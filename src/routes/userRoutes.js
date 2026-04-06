const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const { verifySession, checkUserRole } = require("../middleware/authMiddleware");

// Protect all following routes with session authentication
router.use(verifySession);

// User-specific routes (for any authenticated user)
// Get my(user) profile
router.get("/me", UserController.getMyProfile);

// Update my profile
router.put("/me", UserController.updateMyProfile);

// Delete my account
router.delete("/me", UserController.deleteMyAccount);

// Get user items (same as logged user"/:id")
router.get("/:id/items", UserController.getItemsByUserId);


// Admin routes - Restrict access to admin role only
router.use(checkUserRole('admin'));

// Admin dashboard stats
router.get("/dashboard-stats", UserController.getAdminDashboardStats);

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
