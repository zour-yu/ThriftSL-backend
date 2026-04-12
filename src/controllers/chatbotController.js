const { runChatbot } = require('../service/chatbotService');

/**
 * POST /api/chatbot
 * Body: { message: string, history?: { role: 'user'|'assistant', content: string }[], siteOrigin?: string }
 */
exports.chat = async (req, res) => {
  try {
    const { message, history, siteOrigin } = req.body || {};

    if (typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'message must be a string',
      });
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: 'message is required',
      });
    }

    if (trimmed.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'message too long',
      });
    }

    const originHeader = req.get('origin') || req.get('referer') || '';
    let origin = typeof siteOrigin === 'string' ? siteOrigin.trim() : '';
    if (!origin && originHeader) {
      try {
        origin = new URL(originHeader).origin;
      } catch {
        origin = '';
      }
    }

    const { text, error } = await runChatbot(trimmed, history, origin);

    if (error) {
      return res.status(200).json({
        success: true,
        data: { reply: text || 'Sorry, something went wrong.', warning: error },
      });
    }

    return res.json({
      success: true,
      data: { reply: text },
    });
  } catch (err) {
    console.error('chatbotController.chat:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Chatbot error',
    });
  }
};
