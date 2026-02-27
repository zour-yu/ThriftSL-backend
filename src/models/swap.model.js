import mongoose from 'mongoose';

const swapSchema = new mongoose.Schema({
    sUserID: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    targetProductID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', 
      required: true
    },
    // ID of the person who owns the original ad (for notifications)
    targetOwnerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    sTitle: { 
        type: String, 
        required: true 
    },
    sImage: {
        type: String,
        required: true
    },
    sDescription: {
        type: String,
        required: true
    },
    sPrice: {
        type: Number, 
        default: 0,
        required: true
    },
    sPhoneNumber: {
        type: String,
        required: true
    },
    topup: {
        type: Number, 
        default: 0,
        required: true
    },
    conditionPercentage: { 
      type: Number, 
      min: 0, 
      max: 100,
      required: true
    },
}, {
    timestamps: true,

    // This allows virtuals to be sent to Postman/Frontend
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// --- CALCULATED VALUE LOGIC (Fairness Check) ---

// 1. Simple Total Value: Item Price + Cash Topup
swapSchema.virtual('totalValue').get(function() {
    return (this.sPrice || 0) + (this.topup || 0);
});

// 2. Condition Adjusted Value: (Price * Condition%) + Topup
// Example: ($100 item at 80% condition) + $20 topup = $100 total deal value
swapSchema.virtual('fairnessScore').get(function() {
    const adjustedItemValue = (this.sPrice * (this.conditionPercentage / 100));
    return adjustedItemValue + this.topup;
});


const Swap = mongoose.model('Swap', swapSchema);

export default Swap;