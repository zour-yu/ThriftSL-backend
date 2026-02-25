const mongoose = require('mongoose');
const Item = require('../models/item');

// POST /api/items
exports.createItem = async (req, res) => {
  try {
    const {
      itemId,
      title,
      price,
      description,
      userId,
      negotiable,
      swappable,
      postDate
    } = req.body;

    if (!itemId || !title || price === undefined || !userId) {
      return res
        .status(400)
        .json({ message: 'itemId, title, price, and userId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId (must be ObjectId)' });
    }

    const existing = await Item.findOne({ itemId });
    if (existing) return res.status(409).json({ message: 'itemId already exists' });

    const item = await Item.create({
      itemId,
      title,
      price,
      description,
      userId,
      negotiable: negotiable ?? false,
      swappable: swappable ?? 'no',
      postDate: postDate ? new Date(postDate) : undefined
    });

    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/items
exports.getAllItems = async (req, res) => {
  try {
    const { userId, q, minPrice, maxPrice, negotiable, swappable, sortBy } = req.query;

    const filter = {};

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId' });
      }
      filter.userId = userId;
    }

    if (q) filter.title = { $regex: q, $options: 'i' };

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (negotiable !== undefined) filter.negotiable = negotiable === 'true';
    if (swappable !== undefined) filter.swappable = swappable;

    let query = Item.find(filter);

    if (sortBy === 'newest') query = query.sort({ postDate: -1 });
    if (sortBy === 'priceAsc') query = query.sort({ price: 1 });
    if (sortBy === 'priceDesc') query = query.sort({ price: -1 });

    const items = await query.exec();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/items/:id (Mongo _id)
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/items/:id
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    // Optional: prevent itemId changes
    if (req.body.itemId) {
      return res.status(400).json({ message: 'itemId cannot be updated' });
    }

    const updated = await Item.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ message: 'Item not found' });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/items/:id
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const deleted = await Item.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Item not found' });

    return res.json({ message: 'Item deleted', id });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ GET /api/items/user/:userId  (items listed by a user for profile)
exports.getItemsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const items = await Item.find({ userId }).sort({ postDate: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};