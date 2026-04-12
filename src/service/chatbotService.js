const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const mongoose = require("mongoose");
const Item = require("../models/item");
const { SYSTEM_PROMPT } = require("../config/chatbotKnowledge");

// gemini-2.0-flash is deprecated for new API keys (404). Prefer 2.5+ per https://ai.google.dev/gemini-api/docs/models
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildListingUrl(siteOrigin, itemId) {
  const base = (siteOrigin || "").replace(/\/$/, "");
  if (!base) return `/item/${itemId}`;
  return `${base}/item/${itemId}`;
}

const searchListingsDeclaration = {
  name: "search_listings",
  description:
    "Search active marketplace listings by keyword in title or description. Use for user questions like 'phones under X', 'dresses', brand names, etc.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "Search phrase (e.g. phone, Nike, dress).",
      },
      limit: {
        type: SchemaType.NUMBER,
        description: "Max results (default 8, max 15).",
      },
    },
    required: ["query"],
  },
};

const listRecentListingsDeclaration = {
  name: "list_recent_listings",
  description:
    "List the most recently added active listings. Use when the user asks what's new or for general browsing without a specific search.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      limit: {
        type: SchemaType.NUMBER,
        description: "How many listings (default 8, max 15).",
      },
    },
  },
};

const getListingByIdDeclaration = {
  name: "get_listing_by_id",
  description:
    "Get full details for one listing by its MongoDB _id. Use when the user references a specific item id or asks about one listing from prior results.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      id: {
        type: SchemaType.STRING,
        description: "The listing _id string.",
      },
    },
    required: ["id"],
  },
};

async function execSearchListings({ query, limit }, siteOrigin) {
  const q = (query || "").trim();
  if (!q) return { ok: false, error: "empty_query" };
  const lim = Math.min(Math.max(Number(limit) || 8, 1), 15);
  const rx = new RegExp(escapeRegex(q), "i");
  const items = await Item.find({
    $or: [{ title: rx }, { description: rx }],
  })
    .sort({ createdAt: -1 })
    .limit(lim)
    .select("title price category location images description _id negotiable swappable")
    .lean();

  return {
    ok: true,
    count: items.length,
    listings: items.map((it) => ({
      id: String(it._id),
      title: it.title,
      price: it.price,
      category: it.category,
      location: it.location,
      negotiable: it.negotiable,
      swappable: it.swappable,
      urlPath: buildListingUrl(siteOrigin, it._id),
      imageUrl: Array.isArray(it.images) && it.images[0] ? it.images[0] : null,
      descriptionPreview:
        it.description && it.description.length > 200
          ? `${it.description.slice(0, 200)}…`
          : it.description || "",
    })),
  };
}

async function execListRecentListings({ limit }, siteOrigin) {
  const lim = Math.min(Math.max(Number(limit) || 8, 1), 15);
  const items = await Item.find({})
    .sort({ createdAt: -1 })
    .limit(lim)
    .select("title price category location images _id negotiable swappable")
    .lean();

  return {
    ok: true,
    count: items.length,
    listings: items.map((it) => ({
      id: String(it._id),
      title: it.title,
      price: it.price,
      category: it.category,
      location: it.location,
      negotiable: it.negotiable,
      swappable: it.swappable,
      urlPath: buildListingUrl(siteOrigin, it._id),
      imageUrl: Array.isArray(it.images) && it.images[0] ? it.images[0] : null,
    })),
  };
}

async function execGetListingById({ id }, siteOrigin) {
  if (!id || typeof id !== "string") return { ok: false, error: "invalid_id" };
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { ok: false, error: "invalid_id" };
  }
  const item = await Item.findOne({ _id: id })
    .select(
      "title price category location images description userId _id createdAt negotiable swappable"
    )
    .populate("userId", "name email")
    .lean();

  if (!item) return { ok: false, error: "not_found" };

  const seller = item.userId;

  return {
    ok: true,
    listing: {
      id: String(item._id),
      title: item.title,
      price: item.price,
      category: item.category,
      location: item.location,
      description: item.description || "",
      urlPath: buildListingUrl(siteOrigin, item._id),
      images: Array.isArray(item.images) ? item.images.slice(0, 5) : [],
      negotiable: item.negotiable,
      swappable: item.swappable,
      sellerName: seller?.name || null,
      createdAt: item.createdAt,
    },
  };
}

async function dispatchToolCall(name, args, siteOrigin) {
  switch (name) {
    case "search_listings":
      return execSearchListings(args, siteOrigin);
    case "list_recent_listings":
      return execListRecentListings(args, siteOrigin);
    case "get_listing_by_id":
      return execGetListingById(args, siteOrigin);
    default:
      return { ok: false, error: "unknown_tool" };
  }
}

function mapHistoryToGemini(history) {
  if (!Array.isArray(history)) return [];
  let mapped = history
    .map((h) => {
      if (!h) return null;
      const role =
        h.role === "user"
          ? "user"
          : h.role === "model" || h.role === "assistant"
            ? "model"
            : null;
      const text =
        typeof h.text === "string"
          ? h.text
          : typeof h.content === "string"
            ? h.content
            : "";
      if (!role || !text.trim()) return null;
      return { role, parts: [{ text: text.trim() }] };
    })
    .filter(Boolean)
    .slice(-12);

  // Gemini chat sessions require the first history entry to be role "user", not "model".
  // Some clients send history starting with the assistant reply — strip leading model turns.
  while (mapped.length > 0 && mapped[0].role !== "user") {
    mapped = mapped.slice(1);
  }

  return mapped;
}

/**
 * @param {string} message
 * @param {{ role: string, text?: string, content?: string }[]} [history]
 * @param {string} [siteOrigin]
 * @returns {Promise<{ text: string, error?: string }>}
 */
async function runChatbot(message, history = [], siteOrigin = "") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: "The assistant is not configured yet. Please try again later.",
      error: "missing_api_key",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    tools: [
      {
        functionDeclarations: [
          searchListingsDeclaration,
          listRecentListingsDeclaration,
          getListingByIdDeclaration,
        ],
      },
    ],
  });

  try {
    const chat = model.startChat({
      history: mapHistoryToGemini(history),
    });

    let result = await chat.sendMessage(message);
    let response = result.response;

    for (let round = 0; round < 6; round += 1) {
      const calls = response.functionCalls();
      if (!calls || calls.length === 0) break;

      const parts = [];
      for (const call of calls) {
        const payload = await dispatchToolCall(
          call.name,
          call.args || {},
          siteOrigin
        );
        parts.push({
          functionResponse: {
            name: call.name,
            response: payload,
          },
        });
      }

      result = await chat.sendMessage(parts);
      response = result.response;
    }

    const text = response.text();
    if (text && text.trim()) return { text: text.trim() };

    return {
      text: "Sorry, I could not generate a reply. Please try again.",
      error: "empty_model_reply",
    };
  } catch (err) {
    console.error("runChatbot:", err);
    if (err.status === 429) {
      return {
        text: "The assistant is temporarily over its Gemini usage limit (often the free tier per minute or per day). Wait a bit and try again, or check quota and billing for your API key in Google AI Studio.",
        error: "gemini_rate_limit",
      };
    }
    if (err.status === 404) {
      return {
        text: "This Gemini model is not available for your API key (often retired for new users). Set GEMINI_MODEL in server .env to a current model, for example gemini-2.5-flash, then restart the server.",
        error: "gemini_model_not_found",
      };
    }
    return {
      text: "Sorry, something went wrong talking to the assistant. Please try again in a moment.",
      error: err.message || "gemini_error",
    };
  }
}

module.exports = { runChatbot };
