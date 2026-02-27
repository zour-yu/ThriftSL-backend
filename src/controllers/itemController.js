const mongoose = require('mongoose');
const Item = require('../models/item');
const User = require("../models/user");
const { sendItemCreatedEmail } = require("../service/emailService");

// POST /api/items
exports.createItem = async (req, res) => {
  try {
    const {
      title,
      price,
      description,
      userId,
      negotiable,
      swappable,
      postDate,
    } = req.body;

    // 🔎 Basic validation
    if (!title || price === undefined || !userId) {
      return res.status(400).json({
        message: "title, price, and userId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId (must be ObjectId)",
      });
    }

    // 🔎 Ensure user exists
    const user = await User.findById(userId).select("name email isActive");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "User is inactive" });
    }

    // ✅ Create item with all fields
    const item = await Item.create({
      title: String(title).trim(),
      price,
      description: description ? String(description) : "",
      userId,
      negotiable: negotiable ?? false,
      swappable: swappable ?? "no",
      postDate: postDate ? new Date(postDate) : new Date(),
    });

    // 🚀 Respond immediately (fast UX)
    res.status(201).json({
      message: "Item created successfully",
      data: item,
    });

    // 📧 Send email AFTER response (non-blocking)
    if (user.email) {
      sendItemCreatedEmail({
        toEmail: user.email,
        toName: user.name,
        item,
      }).catch((err) => {
        console.error(
          "Email send failed:",
          err?.response?.body || err?.response?.data || err.message
        );
      });
    }
  } catch (err) {
    console.error("Create item error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/items
exports.createItem = async (req, res) => {
  try {
    const {
      title,
      price,
      description,
      userId,
      negotiable,
      swappable,
      postDate,
    } = req.body;

    //  Basic validation
    if (!title || price === undefined || !userId) {
      return res.status(400).json({
        message: "title, price, and userId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId (must be ObjectId)",
      });
    }

    //  Ensure user exists
    const user = await User.findById(userId).select("name email isActive");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "User is inactive" });
    }

    //  Create item with all fields
    const item = await Item.create({
      title: String(title).trim(),
      price,
      description: description ? String(description) : "",
      userId,
      negotiable: negotiable ?? false,
      swappable: swappable ?? "no",
      postDate: postDate ? new Date(postDate) : new Date(),
    });

    //  Respond immediately (fast UX)
    res.status(201).json({
      message: "Item created successfully",
      data: item,
    });

    // Send email AFTER response (non-blocking)
    if (user.email) {
      sendItemCreatedEmail({
        toEmail: user.email,
        toName: user.name,
        item,
      }).catch((err) => {
        console.error(
          "Email send failed:",
          err?.response?.body || err?.response?.data || err.message
        );
      });
    }
  } catch (err) {
    console.error("Create item error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/items/:id (Mongo _id)
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/items/:id
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item id" });
    }

    // optional safety: prevent changing owner
    if (req.body.userId) {
      return res.status(400).json({ message: "userId cannot be updated" });
    }

    const updated = await Item.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ message: "Item not found" });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/items/:id
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item id" });
    }

    const deleted = await Item.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Item not found" });

    return res.json({ message: "Item deleted", id });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ GET /api/items/user/:userId  (items listed by a user for profile)
exports.getItemsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const items = await Item.find({ userId }).sort({ postDate: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/items/swappable?excludeItemId=<id>&userId=<userId>
/*exports.getSwappableItems = async (req, res) => {
  try {
    const { excludeItemId, userId } = req.query;

    const filter = {
      swappable: { $ne: 'no' } // treats 'yes', 'swap', etc as swappable
    };

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId' });
      }
      filter.userId = userId;
    }

    if (excludeItemId) {
      if (!mongoose.Types.ObjectId.isValid(excludeItemId)) {
        return res.status(400).json({ message: 'Invalid excludeItemId' });
      }
      filter._id = { $ne: excludeItemId };
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
*/

// GET /api/items/:id/full  (item + images)
exports.getItemByIdFull = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const result = await Item.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'itemimages',          // ✅ collection name for ItemImage model
          localField: '_id',
          foreignField: 'itemId',
          as: 'images'
        }
      },
      { $limit: 1 }
    ]);

    if (!result.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    return res.json(result[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/items/swappable/full?excludeItemId=<id>&userId=<userId>
exports.getSwappableItemsFull = async (req, res) => {
  try {
    const { excludeItemId, userId } = req.query;

    const match = {
      swappable: { $ne: 'no' } // 'yes' or any other string is treated as swappable
    };

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId' });
      }
      match.userId = new mongoose.Types.ObjectId(userId);
    }

    if (excludeItemId) {
      if (!mongoose.Types.ObjectId.isValid(excludeItemId)) {
        return res.status(400).json({ message: 'Invalid excludeItemId' });
      }
      match._id = { $ne: new mongoose.Types.ObjectId(excludeItemId) };
    }

    const items = await Item.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'itemimages',
          localField: '_id',
          foreignField: 'itemId',
          as: 'images'
        }
      }
    ]);

    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
