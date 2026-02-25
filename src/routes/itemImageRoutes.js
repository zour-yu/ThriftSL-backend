const express = require('express');
const router = express.Router();

const itemImageController = require('../controllers/itemImageController');

router.post('/', itemImageController.createItemImage);
router.get('/', itemImageController.getItemImages);
router.delete('/:id', itemImageController.deleteItemImage);

module.exports = router;