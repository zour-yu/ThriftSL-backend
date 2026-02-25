const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true }, // business ID like ITM-0001
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },

    // User system not ready - still store ObjectId for future compatibility
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    negotiable: { type: Boolean, default: false },

    // you said swappable is String
    swappable: { type: String, default: 'no' },

    postDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);