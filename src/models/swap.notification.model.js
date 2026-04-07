const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["swap_request", "swap_accepted", "swap_rejected"],
      required: true,
      index: true,
    },
    swapID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Swap",
      required: false,
      index: true,
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;