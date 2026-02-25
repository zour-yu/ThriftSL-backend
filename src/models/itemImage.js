const mongoose = require('mongoose');

const itemImageSchema = new mongoose.Schema(
  {
    imageId: { type: String, required: true, unique: true }, // business ID
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Item' },
    imageUrl: { type: String, required: true } // Cloudinary URL
  },
  { timestamps: true }
);

module.exports = mongoose.model('ItemImage', itemImageSchema);