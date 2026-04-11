const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const upload = require("../config/multer");
const { authenticate } = require("../middleware/authMiddleware");

// CRUD - Authenticate creation, update and deletion
router.post("/", authenticate, upload.array("images", 5), itemController.createItem);

router.get("/search/:query", itemController.searchItems);

router.get("/filter", itemController.filterItems);

router.get("/", itemController.getAllItems);

router.get("/category/:category", itemController.getItemsByCategory);

router.get("/user/:userId", itemController.getItemsByUser);

router.get("/:id", itemController.getItemById);

router.put("/:id", authenticate, itemController.updateItem);

router.delete("/:id", authenticate, itemController.deleteItem);

module.exports = router;
