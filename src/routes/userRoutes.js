const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const { verifyToken, checkUserRole } = require("../middleware/authMiddleware");

//  verifyToken removed for testing 

// User-specific routes (for any authenticated user)
// Get my profile
router.get("/me", UserController.getMyProfile);

// Update my profile
router.put("/me", UserController.updateMyProfile);

// Delete my account
router.delete("/me", UserController.deleteMyAccount);

// Get user items (must be above "/:id")
router.get("/:id/items", UserController.getItemsByUserId);


// Admin routes 
// Get all users
router.get("/", UserController.getAllUsers);

// Get active users only
router.get("/active", UserController.getActiveUsers);

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

// Deactivate user
router.patch("/:id/deactivate", UserController.deactivateUser);

// Activate user
router.patch("/:id/activate", UserController.activateUser);

// Delete user
router.delete("/:id", UserController.deleteUser);

module.exports = router;
