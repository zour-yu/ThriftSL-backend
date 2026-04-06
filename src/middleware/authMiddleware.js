const admin = require('firebase-admin');
const User = require('../models/user');

// verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please include Authorization: Bearer <token>',
      });
    }


    const token = authHeader.split('Bearer ')[1];

    // Verify token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user into controller to use
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user',
    };

    // Check if user is active in MongoDB
    const user = await User.findOne({ firebaseUID: decodedToken.uid });
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated or not found. Please contact support.',
      });
    }

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

// Verify session-based authentication
const verifySession = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please sign in.',
      });
    }

    // Check if user is active in MongoDB
    const user = await User.findById(req.session.userId);
    if (!user || !user.isActive) {
      // Clear session if user is inactive
      req.session.destroy();
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated or not found. Please contact support.',
      });
    }

    // Attach user info from session to request
    req.user = {
      id: req.session.userId,
      uid: req.session.firebaseUID,
      email: req.session.email,
      role: req.session.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session verification failed',
      error: error.message,
    });
  }
};

// check user role
const checkUserRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const user = await User.findOne({ firebaseUID: req.user.uid });

      // Check if user exists in database
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found',
        });
      }

      // Check if user have required role
      if (user.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: `Access denied. ${requiredRole} role required.`,
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking user role',
        error: error.message,
      });
    }
  };
};

module.exports = { verifyToken, verifySession, checkUserRole };
