const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },

    // still keep for future; you can also remove later if needed
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    negotiable: { type: Boolean, default: false },
    swappable: { type: String, default: 'no' },

    postDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);