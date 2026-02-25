const mongoose = require('mongoose');
const ItemImage = require('../models/itemImage');
const Item = require('../models/item');

// POST /api/item-images
exports.createItemImage = async (req, res) => {
  try {
    const { imageId, itemId, imageUrl } = req.body;

    if (!imageId || !itemId || !imageUrl) {
      return res.status(400).json({ message: 'imageId, itemId, imageUrl are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid itemId (must be Mongo ObjectId)' });
    }

    // Ensure item exists
    const itemExists = await Item.findById(itemId);
    if (!itemExists) return res.status(404).json({ message: 'Item not found for itemId' });

    const existing = await ItemImage.findOne({ imageId });
    if (existing) return res.status(409).json({ message: 'imageId already exists' });

    const created = await ItemImage.create({ imageId, itemId, imageUrl });
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/item-images?itemId=<mongoItemId>
exports.getItemImages = async (req, res) => {
  try {
    const { itemId } = req.query;

    const filter = {};
    if (itemId) {
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: 'Invalid itemId' });
      }
      filter.itemId = itemId;
    }

    const images = await ItemImage.find(filter).sort({ createdAt: -1 });
    return res.json(images);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/item-images/:id  (Mongo _id of ItemImage)
exports.deleteItemImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid image document id' });
    }

    const deleted = await ItemImage.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Image not found' });

    return res.json({ message: 'Image deleted', id });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};