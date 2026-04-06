const User = require("../models/user");
const Item = require("../models/item");
const mongoose = require("mongoose");

class UserController {
  
  //Admin Functions

  // Get Admin Dashboard Stats
  static async getAdminDashboardStats(req, res) {
    try {
      // Use the actual models and criteria for counting
      const activeListings = await Item.countDocuments(); // Counts all items, assuming listed = active
      const activeUsers = await User.countDocuments({ isActive: true });
      
      // Calculate new users and listings today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
      const newListingsToday = await Item.countDocuments({ createdAt: { $gte: startOfToday } });

      // Get listings by category for Pie Chart
      const categoryAggregation = await Item.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 } // Sort by count descending
        }
      ]);

      // Format for frontend: [{ name: "electronics", count: 145 }]
      const categoryStats = categoryAggregation.map(cat => ({
        name: cat._id || "Uncategorized",
        count: cat.count
      }));

      res.json({
          activeListings,
          activeUsers,
          newListingsToday,
          newUsersToday,
          categoryStats
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
      const users = await User.find().select("-__v");
      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  }

  // Get user by ID 
  static async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id).select("-__v");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user",
        error: error.message,
      });
    }
  }

  // Get user by Firebase UID (admin only)
  static async getUserByFirebaseUID(req, res) {
    try {
      const user = await User.findOne({
        firebaseUID: req.params.firebaseUID,
      }).select("-__v");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user",
        error: error.message,
      });
    }
  }

  // Create new user(admin & user can create their own account through signup)
  static async createUser(req, res) {
    try {
      const { firebaseUID, name, email, phone, role, isActive } = req.body;

      // Validate required fields
      if (!firebaseUID || !name || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required fields",
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ firebaseUID }, { email }],
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this Firebase UID or email already exists",
        });
      }

      const user = await User.create({
        firebaseUID,
        name,
        email,
        phone,
        role: role || "user",
        isActive: isActive !== undefined ? isActive : true,
      });

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating user",
        error: error.message,
      });
    }
  }

  // Update user (admin only)
  static async updateUser(req, res) {
    try {
      const { name, email, phone, role, isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { name, email, phone, role, isActive },
        { new: true, runValidators: true }
      ).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  }

  // Delete user(admin only)
  static async deleteUser(req, res) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting user",
        error: error.message,
      });
    }
  }

  // Get users by role(admin only)
  static async getUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const users = await User.find({ role }).select("-__v");

      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching users by role",
        error: error.message,
      });
    }
  }

  // Get active users  (admin only)
  static async getActiveUsers(req, res) {
    try {
      const users = await User.find({ isActive: true }).select("-__v");
      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching active users",
        error: error.message,
      });
    }
  }

  // Deactivate user (admin only)
  static async deactivateUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true, runValidators: true }
      ).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User deactivated successfully",
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deactivating user",
        error: error.message,
      });
    }
  }

  // Activate user
  static async activateUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: true },
        { new: true, runValidators: true }
      ).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User activated successfully",
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error activating user",
        error: error.message,
      });
    }
  }

  //User-specific Functions

  // Get my profile (authenticated )
  static async getMyProfile(req, res) {
    try {
      
      const user = await User.findOne({ firebaseUID: req.user.uid }).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User profile not found",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching profile",
        error: error.message,
      });
    }
  }

  // Update my profile (authenticated )
  static async updateMyProfile(req, res) {
    try {
      const { name, phone } = req.body;

      // Only allow updating name and phone
      const user = await User.findOneAndUpdate(
        { firebaseUID: req.user.uid },
        { name, phone },
        { new: true, runValidators: true }
      ).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User profile not found",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating profile",
        error: error.message,
      });
    }
  }

  // Delete my account (authenticated )
  static async deleteMyAccount(req, res) {
    try {
      const user = await User.findOneAndDelete({ firebaseUID: req.user.uid });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User profile not found",
        });
      }

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting account",
        error: error.message,
      });
    }
  }

static async getItemsByUserId(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const items = await Item.find({ userId: id }).sort({ createdAt: -1 });
      return res.json({ success: true, count: items.length, data: items });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching user items",
        error: error.message,
      });
    }
  }  
}


module.exports = UserController;
