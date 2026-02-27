const admin = require('firebase-admin');
const User = require('../models/user');

class AuthController {
  // Sign up 
  static async signup(req, res) {
    try {
      const { email, password, name, phone } = req.body;

      // Validate required fields
      if (!email || !password || !name || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields',
        });
      }

      // Create user in Firebase
      const firebaseUser = await admin.auth().createUser({
        email: email,
        password: password,
        emailVerified: false,
        disabled: false,
      });

      // Save user profile to MongoDB
      const dbUser = await User.create({
        firebaseUID: firebaseUser.uid,
        name: name,
        email: email,
        phone: phone,
        role: 'user',
        isActive: true,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          profile: dbUser,
        },
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error during signup',
        error: error.message,
      });
    }
  }

  // Sign in 
  static async signin(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'ID token is required',
        });
      }

      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUID = decodedToken.uid;

      // Get user from MongoDB
      const user = await User.findOne({ firebaseUID }).select('-__v');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found',
        });
      }

      res.json({
        success: true,
        message: 'Sign in successful',
        data: {
          user: user,
          firebaseUID: firebaseUID,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: error.message,
      });
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      // Generate password reset link
      const link = await admin.auth().generatePasswordResetLink(email);

      res.json({
        success: true,
        message: 'Password reset link generated',
        data: { resetLink: link },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating reset link',
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;
