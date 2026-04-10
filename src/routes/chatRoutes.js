const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { validateSession } = require('../middleware/sessionAuthMiddleware');

// Apply session validation to all chat routes
router.use(validateSession);

// Chat initiation
router.post('/initiate', chatController.initiateChat);

// Get user conversations
router.get('/conversations', chatController.getUserConversations);

// Get conversation details with another user
router.get('/:otherUserId', chatController.getConversationDetails);

// Send a message
router.post('/messages', chatController.sendMessage);

// Mark conversation as read
router.patch('/mark-read', chatController.markConversationAsRead);

// Get user notifications
router.get('/notifications', chatController.getNotifications);

// Mark notification as read
router.patch('/notifications/:notificationId/read', chatController.markNotificationAsRead);

// Clear all notifications
router.delete('/notifications', chatController.clearNotifications);

module.exports = router;
