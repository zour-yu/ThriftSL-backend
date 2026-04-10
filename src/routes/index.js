const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Auth Routes
router.use('/auth', require('./authRoutes'));

// User Routes
router.use('/users', require('./userRoutes'));

// Item Listing Route  !!!!DO NOT MODIFY THESE
router.use('/items', require('./itemRoutes'));
router.use('/item-images', require('./itemImageRoutes'));

// Messaging & Interaction Management
router.use('/messages', require('./messageRoutes'));

// Chat Routes
router.use('/chats', require('./chatRoutes'));

// IMPORT swap routes (handle ES6 module export)
let swapRoutes = require('./swap.route.js');
swapRoutes = swapRoutes.default || swapRoutes;

// USE swap routes
router.use('/swaps', swapRoutes);

module.exports = router;
