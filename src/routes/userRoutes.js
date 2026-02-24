const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");

// Get all users
router.get("/", UserController.getAllUsers);

// Get users by role
router.get("/role/:role", UserController.getUsersByRole);

// Get user by Firebase UID
router.get("/firebase/:firebaseUID", UserController.getUserByFirebaseUID);

// Get user by ID
router.get("/:id", UserController.getUserById);

// Create new user
router.post("/", UserController.createUser);

// Update user
router.put("/:id", UserController.updateUser);

// Delete user
router.delete("/:id", UserController.deleteUser);

module.exports = router;
