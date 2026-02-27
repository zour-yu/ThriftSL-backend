const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');



// Full responses with images (put ABOVE "/:id")
//router.get('/swappable/full', itemController.getSwappableItemsFull);

//This will send the item ID use this for swap.
router.get('/:id/full', itemController.getItemByIdFull); // This will send the full item including the image url


//  Profile: items listed by user
router.get('/user/:userId', itemController.getItemsByUserId);

//router.get('/swappable', itemController.getSwappableItems); // This will

// CRUD
router.post('/', itemController.createItem);
router.get('/', itemController.getAllItems);
router.get('/:id', itemController.getItemById);
router.put('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

module.exports = router;
