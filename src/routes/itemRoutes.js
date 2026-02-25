const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// CRUD
router.post('/', itemController.createItem);
router.get('/', itemController.getAllItems);
router.get('/:id', itemController.getItemById);
router.put('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

//  Profile: items listed by user
router.get('/user/:userId', itemController.getItemsByUserId);

module.exports = router;