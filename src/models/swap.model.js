const mongoose = require("mongoose");

const swapSchema = new mongoose.Schema(
  {
    sUserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetProductID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true,
    },
    targetOwnerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    sTitle: {
      type: String,
      required: true,
      trim: true,
    },
    sImage: {
      type: String,
      required: true,
      trim: true,
    },
    sDescription: {
      type: String,
      required: true,
      trim: true,
    },
    sPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sPhoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    topup: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    conditionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// --- CALCULATED VALUE LOGIC (Fairness Check) ---

// 1. Simple Total Value: Item Price + Cash Topup
swapSchema.virtual("totalValue").get(function totalValue() {
    return (this.sPrice || 0) + (this.topup || 0);
});

// 2. Condition Adjusted Value: (Price * Condition%) + Topup
// Example: ($100 item at 80% condition) + $20 topup = $100 total deal value
swapSchema.virtual("fairnessScore").get(function fairnessScore() {
    const adjustedItemValue = (this.sPrice || 0) * ((this.conditionPercentage || 0) / 100);
    return adjustedItemValue + this.topup;
});


const Swap = mongoose.model("Swap", swapSchema);

module.exports = Swap;