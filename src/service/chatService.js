const Message = require('../models/message');
const User = require('../models/user');
const Item = require('../models/item');
const mongoose = require('mongoose');

// Get the Notification model (already registered by swap.notification.model)
const getNotificationModel = () => mongoose.model('Notification');

/**
 * Initiate a new chat or return existing conversation
 * @param {string} buyerId - ID of the buyer initiating chat
 * @param {string} sellerId - ID of the seller
 * @param {string} itemId - ID of the item being discussed
 * @returns {object} - Returns existing or newly created chat metadata
 */
const initiateChat = async (buyerId, sellerId, itemId) => {
  // Validation
  if (buyerId === sellerId) {
    throw new Error('Cannot initiate chat with yourself');
  }

  const buyerExists = await User.findById(buyerId);
  if (!buyerExists) {
    throw new Error('Buyer not found');
  }

  const sellerExists = await User.findById(sellerId);
  if (!sellerExists) {
    throw new Error('Seller not found');
  }

  // Validate item exists
  const item = await Item.findById(itemId);
  if (!item) {
    throw new Error('Item not found');
  }

  // Check if conversation already exists for this buyer-seller-item combo
  const existingChat = await Message.findOne({
    $or: [
      { sender: buyerId, receiver: sellerId, itemId: itemId },
      { sender: sellerId, receiver: buyerId, itemId: itemId },
    ],
    isDeleted: false,
  })
    .populate('sender', 'name email profileImage')
    .populate('receiver', 'name email profileImage')
    .populate('itemId', 'title price images');

  if (existingChat) {
    return {
      isNew: false,
      chatData: {
        buyer: {
          id: buyerId,
          name: buyerExists.name,
          email: buyerExists.email,
        },
        seller: {
          id: sellerId,
          name: sellerExists.name,
          email: sellerExists.email,
        },
        item: {
          id: itemId,
          title: item.title,
          price: item.price,
        },
        lastMessage: existingChat,
      },
    };
  }

  // Create notification for seller about new chat
  const Notification = getNotificationModel();
  await Notification.create({
    recipientID: sellerId,
    senderID: buyerId,
    message: `${buyerExists.name} wants to chat about "${item.title}"`,
    type: 'chat_initiated',
    itemId: itemId,
  });

  return {
    isNew: true,
    chatData: {
      buyer: {
        id: buyerId,
        name: buyerExists.name,
        email: buyerExists.email,
      },
      seller: {
        id: sellerId,
        name: sellerExists.name,
        email: sellerExists.email,
      },
      item: {
        id: itemId,
        title: item.title,
        price: item.price,
      },
      lastMessage: null,
    },
  };
};

/**
 * Get all unique conversations for a user
 * @param {string} userId - ID of the user
 * @param {number} page - Page number for pagination (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {object} - Returns list of conversations with metadata
 */
const getUserConversations = async (userId, page = 1, limit = 10) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Get all messages involving the user
  const messages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
    isDeleted: false,
  })
    .populate('sender', 'name email profileImage')
    .populate('receiver', 'name email profileImage')
    .populate('itemId', 'title price images')
    .sort({ createdAt: -1 });

  // Group by unique user conversations
  const conversationMap = new Map();

  messages.forEach((msg) => {
    const otherUserId = msg.sender._id.toString() === userId ? msg.receiver._id.toString() : msg.sender._id.toString();
    const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;

    const key = [userId, otherUserId].sort().join('_');

    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        conversationId: key,
        withUser: {
          id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          profileImage: otherUser.profileImage,
        },
        lastMessage: msg.content,
        lastMessageTime: msg.createdAt,
        item: msg.itemId ? {
          id: msg.itemId._id,
          title: msg.itemId.title,
          price: msg.itemId.price,
        } : null,
        unreadCount: 0,
      });
    }

    // Count unread messages
    if (msg.receiver._id.toString() === userId && msg.status === 'sent') {
      conversationMap.get(key).unreadCount += 1;
    }
  });

  // Convert map to array and sort by timestamp
  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  );

  // Apply pagination
  const totalConversations = conversations.length;
  const startIndex = (page - 1) * limit;
  const paginatedConversations = conversations.slice(startIndex, startIndex + limit);

  return {
    success: true,
    data: paginatedConversations,
    pagination: {
      currentPage: page,
      limit: limit,
      totalConversations: totalConversations,
      totalPages: Math.ceil(totalConversations / limit),
    },
  };
};

/**
 * Get conversation details between two users for a specific item
 * @param {string} userId - ID of current user
 * @param {string} otherUserId - ID of the other user
 * @param {string} itemId - ID of the item (optional)
 * @returns {object} - Returns conversation messages
 */
const getConversationDetails = async (userId, otherUserId, itemId = null) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw new Error('Other user not found');
  }

  const query = {
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId },
    ],
    isDeleted: false,
  };

  if (itemId) {
    query.itemId = itemId;
  }

  const messages = await Message.find(query)
    .populate('sender', 'name email profileImage')
    .populate('receiver', 'name email profileImage')
    .populate('itemId', 'title price images')
    .sort({ createdAt: 1 });

  return {
    success: true,
    conversationWith: {
      id: otherUser._id,
      name: otherUser.name,
      email: otherUser.email,
      profileImage: otherUser.profileImage,
    },
    messages: messages,
  };
};

/**
 * Create and send a message
 * @param {string} senderId - ID of message sender
 * @param {string} receiverId - ID of message receiver
 * @param {string} content - Message content
 * @param {string} itemId - ID of the item (optional)
 * @returns {object} - Returns the created message
 */
const sendMessage = async (senderId, receiverId, content, itemId = null) => {
  if (!senderId || !receiverId || !content) {
    throw new Error('senderId, receiverId and content are required');
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new Error('Receiver not found');
  }

  if (senderId === receiverId) {
    throw new Error('Cannot send message to yourself');
  }

  const messageData = {
    sender: senderId,
    receiver: receiverId,
    content,
    status: 'sent',
  };

  if (itemId) {
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    messageData.itemId = itemId;
  }

  const message = new Message(messageData);
  await message.save();
  await message.populate(['sender', 'receiver', 'itemId']);

  // Create notification for new message
  await Notification.create({
    recipientID: receiverId,
    senderID: senderId,
    message: `New message from ${(await User.findById(senderId)).name}`,
    type: 'new_message',
    itemId: itemId || null,
  });

  return message;
};

/**
 * Mark messages as read for a conversation
 * @param {string} receiverId - ID of message receiver
 * @param {string} senderId - ID of message sender
 */
const markConversationAsRead = async (receiverId, senderId) => {
  await Message.updateMany(
    {
      receiver: receiverId,
      sender: senderId,
      status: 'sent',
      isDeleted: false,
    },
    {
      $set: { status: 'read' },
    }
  );
};

module.exports = {
  initiateChat,
  getUserConversations,
  getConversationDetails,
  sendMessage,
  markConversationAsRead,
};
