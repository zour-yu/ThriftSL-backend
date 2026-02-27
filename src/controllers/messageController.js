const Message = require('../models/message');
const User = require('../models/user');
const mongoose = require('mongoose');

// CREATE: Send a message
const createMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: 'senderId, receiverId and content are required' });
    }

    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      status: 'sent',
    });

    await message.save();
    await message.populate(['sender', 'receiver']);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ: Get conversation between logged-in user and another user
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { loggedInUserId } = req.query;

    if (!loggedInUserId) {
      return res.status(400).json({ error: 'loggedInUserId query parameter is required' });
    }

    if (loggedInUserId === userId) {
      return res.status(400).json({ error: 'Cannot get conversation with yourself' });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: loggedInUserId, receiver: userId },
        { sender: userId, receiver: loggedInUserId },
      ],
      isDeleted: false,
    })
      .populate('sender', 'name email phone')
      .populate('receiver', 'name email phone')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ: Get inbox (all conversations of logged-in user)
const getInbox = async (req, res) => {
  try {
    const { loggedInUserId } = req.query;

    if (!loggedInUserId) {
      return res.status(400).json({ error: 'loggedInUserId query parameter is required' });
    }

    const objectId = new mongoose.Types.ObjectId(loggedInUserId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: objectId }, { receiver: objectId }],
          isDeleted: false,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', objectId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser',
        },
      },
      {
        $unwind: '$otherUser',
      },
      {
        $project: {
          _id: 1,
          otherUser: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
          },
          lastMessage: {
            _id: 1,
            content: 1,
            status: 1,
            createdAt: 1,
            sender: 1,
          },
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Edit message (only sender can edit if not read)
const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, senderId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== senderId) {
      return res.status(403).json({ error: 'Only sender can edit this message' });
    }

    if (message.status === 'read') {
      return res.status(400).json({ error: 'Cannot edit a read message' });
    }

    message.content = content;
    await message.save();
    await message.populate(['sender', 'receiver']);

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.receiver.toString() !== receiverId) {
      return res.status(403).json({ error: 'Only receiver can mark as read' });
    }

    message.status = 'read';
    await message.save();
    await message.populate(['sender', 'receiver']);

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Soft delete message
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== userId && message.receiver.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createMessage,
  getConversation,
  getInbox,
  updateMessage,
  markAsRead,
  deleteMessage,
};
