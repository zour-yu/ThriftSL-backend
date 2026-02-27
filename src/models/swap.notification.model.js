import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipientID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    senderID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    message: { type: String, required: true },
    swapID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Swap' 
    },
    isRead: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;