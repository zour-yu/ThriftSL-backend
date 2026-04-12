const User = require("../models/user");
const Item = require("../models/item");
const mongoose = require("mongoose");

class UserController {
  // Admin Functions
  

  // Get Admin Dashboard Stats
  // [GET] /api/users/dashboard-stats (admin only)
  static async getAdminDashboardStats(req, res) {
    try {
      // Use the actual models and criteria for counting
      const activeListings = await Item.countDocuments(); // Counts all items
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

      // Format for frontend
      const categoryStats = categoryAggregation.map(cat => ({
        name: cat._id || "Uncategorized",
        count: cat.count
      }));

      // Fetch Recent Activity (New Listings and New Users)
      const recentItems = await Item.find().sort({ createdAt: -1 }).limit(5);
      const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

      const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return Math.floor(seconds) + " seconds ago";
      };

      const combinedActivity = [
        ...recentItems.map(item => ({
          id: item._id.toString(),
          type: "listing",
          message: `New ${item.title} listed in ${item.category}`,
          createdAt: item.createdAt,
          time: getTimeAgo(item.createdAt)
        })),
        ...recentUsers.map(user => ({
          id: user._id.toString(),
          type: "user",
          message: `${user.name} registered an account`,
          createdAt: user.createdAt,
          time: getTimeAgo(user.createdAt)
        }))
      ];

      // Sort by newest first and find top 5
      combinedActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const recentActivity = combinedActivity.slice(0, 5).map(({ createdAt, ...rest }) => rest);

      res.json({
          activeListings,
          activeUsers,
          newListingsToday,
          newUsersToday,
          categoryStats,
          recentActivity
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  // Get all users
  // [GET] /api/users/ (admin only)
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
  // [GET] /api/users/:id (admin only)
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
  // [GET] /api/users/firebase/:firebaseUID
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

  // Create new user( & user can create their own account through signup)
  // [POST] /api/users/ 
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
  // [PUT] /api/users/:id 
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
  // [DELETE] /api/users/:id
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
  // [GET] /api/users/role/:role 
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
  // [GET] /api/users/active 
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
  // [PATCH] /api/users/:id/deactivate 
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
  // [PATCH] /api/users/:id/activate 
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
  // [GET] /api/users/me
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
  // [PUT] /api/users/me 
  static async updateMyProfile(req, res) {
    try {
      const { name, phone } = req.body;
      const updateData = { name, phone };

      if (req.file && req.file.path) {
        updateData.profileImage = req.file.path;
      }

      // Allow updating name, phone, and profileImage
      const user = await User.findOneAndUpdate(
        { firebaseUID: req.user.uid },
        updateData,
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

  // Delete my account (authenticated user)
  // [DELETE] /api/users/me
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

  // [GET] /api/users/:id/items (authenticated user)
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
