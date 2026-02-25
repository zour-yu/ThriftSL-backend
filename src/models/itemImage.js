const mongoose = require('mongoose');

const itemImageSchema = new mongoose.Schema(
  {
    imageId: { type: String, unique: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Item' },
    imageUrl: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ItemImage', itemImageSchema);