const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Authentication Routes
router.use('/auth', require('./authRoutes'));

// Item Listing Route  !!!!DO NOT MODIFY THESE
router.use('/items', require('./itemRoutes'));
router.use('/item-images', require('./itemImageRoutes'));

// Messaging & Interaction Management
router.use('/messages', require('./messageRoutes'));

module.exports = router;
