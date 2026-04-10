const chatService = require('../service/chatService');
const mongoose = require('mongoose');
const Message = require('../models/message');

// Get the Notification model (already registered by swap.notification.model)
const getNotificationModel = () => mongoose.model('Notification');

/**
 * Initiate a new chat between buyer and seller
 * POST /api/chats/initiate
 * Authenticated via session cookie
 */
const initiateChat = async (req, res) => {
  try {
    // Get authenticated user from session
    const sessionUserId = req.session.user?._id;
    const { buyerId, sellerId, itemId } = req.body;

    // Use session user as buyerId (more secure), or accept from body if provided
    const actualBuyerId = buyerId || sessionUserId;

    if (!actualBuyerId || !sellerId || !itemId) {
      return res.status(400).json({
        success: false,
        error: 'sellerId and itemId are required (buyerId from session)',
      });
    }

    // Security check: ensure the requester is initiating chat as themselves
    if (buyerId && buyerId !== sessionUserId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot initiate chat on behalf of another user',
      });
    }

    const result = await chatService.initiateChat(actualBuyerId, sellerId, itemId);

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      isNew: result.isNew,
      data: result.chatData,
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all conversations for a user
 * GET /api/chats/conversations?page=1&limit=10
 * Authenticated via session cookie
 */
const getUserConversations = async (req, res) => {
  try {
    const sessionUserId = req.session.user?._id;
    const { page = 1, limit = 10 } = req.query;

    if (!sessionUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const result = await chatService.getUserConversations(sessionUserId, parseInt(page), parseInt(limit));

    res.status(200).json(result);
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get conversation details between two users
 * GET /api/chats/:otherUserId?itemId=<itemId>
 * Authenticated via session cookie
 */
const getConversationDetails = async (req, res) => {
  try {
    const sessionUserId = req.session.user?._id;
    const { otherUserId } = req.params;
    const { itemId } = req.query;

    if (!sessionUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'otherUserId parameter is required',
      });
    }

    const result = await chatService.getConversationDetails(sessionUserId, otherUserId, itemId);

    res.status(200).json(result);
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Send a message
 * POST /api/chats/messages
 * Authenticated via session cookie
 */
const sendMessage = async (req, res) => {
  try {
    const sessionUserId = req.session.user?._id;
    const { senderId, receiverId, content, itemId } = req.body;

    // Use session user as senderId (more secure), or accept from body if provided
    const actualSenderId = senderId || sessionUserId;

    if (!actualSenderId || !receiverId || !content) {
      return res.status(400).json({
        success: false,
        error: 'receiverId and content are required (senderId from session)',
      });
    }

    // Security check: ensure the requester is sending as themselves
    if (senderId && senderId !== sessionUserId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot send message on behalf of another user',
      });
    }

    const message = await chatService.sendMessage(actualSenderId, receiverId, content, itemId);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Mark conversation as read
 * PATCH /api/chats/mark-read
 * Authenticated via session cookie
 */
const markConversationAsRead = async (req, res) => {
  try {
    const sessionUserId = req.session.user?._id;
    const { senderId } = req.body;

    if (!sessionUserId || !senderId) {
      return res.status(400).json({
        success: false,
        error: 'senderId is required (receiverId from session)',
      });
    }

    await chatService.markConversationAsRead(sessionUserId, senderId);

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get user notifications
 * GET /api/chats/notifications?page=1&limit=10
 * Authenticated via session cookie
 */
const getNotifications = async (req, res) => {
  try {
    const Notification = getNotificationModel();
    const sessionUserId = req.session.user?._id;
    const { page = 1, limit = 10 } = req.query;

    if (!sessionUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const notifications = await Notification.find({
      recipientID: sessionUserId,
    })
      .populate('senderID', 'name email profileImage')
      .populate('itemId', 'title price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments({
      recipientID: sessionUserId,
    });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        totalNotifications: totalNotifications,
        totalPages: Math.ceil(totalNotifications / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Mark notification as read
 * PATCH /api/chats/notifications/:notificationId/read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const Notification = getNotificationModel();
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Clear all notifications for a user
 * DELETE /api/chats/notifications
 * Authenticated via session cookie
 */
const clearNotifications = async (req, res) => {
  try {
    const Notification = getNotificationModel();
    const sessionUserId = req.session.user?._id;

    if (!sessionUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    await Notification.deleteMany({
      recipientID: sessionUserId,
    });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  initiateChat,
  getUserConversations,
  getConversationDetails,
  sendMessage,
  markConversationAsRead,
  getNotifications,
  markNotificationAsRead,
  clearNotifications,
};
