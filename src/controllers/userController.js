const User = require("../models/user");

class UserController {
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

  // Get user by Firebase UID
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

  // Create new user
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

  // Update user
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

  // Delete user
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

  // Get users by role
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

  // Get active users only
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

  // Deactivate user (soft delete)
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
}

module.exports = UserController;
