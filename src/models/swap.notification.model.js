const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    senderID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    message: { 
        type: String, 
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['chat_initiated', 'new_message', 'swap_request', 'swap_accepted', 'swap_rejected'],
        default: 'swap_request',
        index: true
    },
    swapID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Swap',
        default: null,
        index: true
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null,
        index: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        default: null,
        index: true
    },
    isRead: { 
        type: Boolean, 
        default: false,
        index: true
    }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;