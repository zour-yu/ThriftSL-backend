const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require("../middleware/authMiddleware");

// Authenticate all message routes
router.use(authenticate);

// CREATE: Send a message
router.post('/', messageController.createMessage);

// READ: Get conversation between logged-in user and another user
router.get('/conversation/:userId', messageController.getConversation);

// READ: Get inbox (all conversations of logged-in user)
router.get('/inbox', messageController.getInbox);

// UPDATE: Edit message
router.put('/:id', messageController.updateMessage);

// UPDATE: Mark message as read
router.patch('/:id/read', messageController.markAsRead);

// DELETE: Soft delete message
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
