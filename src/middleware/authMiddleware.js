const admin = require('firebase-admin');
const User = require('../models/user');

// Hybrid authentication middleware (Token first, then Session)
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check for Bearer Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Check if user is active in MongoDB
      const user = await User.findOne({ firebaseUID: decodedToken.uid });
      if (!user) {
        return res.status(403).json({
          success: false,
          message: 'User account not found.',
        });
      }
      
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      req.user = {
        id: user._id,
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: user.role || 'user',
      };
      return next();
    } catch (error) {
      console.log('DEBUG authenticate: Token verification failed, falling back to session', error.message);
      // Fall through to session check
    }
  }

  // 2. Check for Session/Cookie
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Session invalid: User not found.',
        });
      }

      if (!user.isActive) {
        req.session.destroy();
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      req.user = {
        id: user._id,
        uid: user.firebaseUID,
        email: user.email,
        role: user.role,
      };
      return next();
    }
  } catch (error) {
    console.log('DEBUG authenticate: Session check error', error);
  }

  // 3. Neither method worked
  return res.status(401).json({
    success: false,
    message: 'Not authenticated. Please sign in or provide a valid token.',
  });
};

// verify Firebase ID token (Standalone - kept for backward compatibility if used directly)
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
    // Check if user is active in MongoDB
    const user = await User.findOne({ firebaseUID: decodedToken.uid });
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated or not found. Please contact support.',
      });
    }

    req.user = {
      id: user._id,
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: user.role || 'user',
    };

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

// Verify session-based authentication (Standalone - kept for backward compatibility if used directly)
const verifySession = async (req, res, next) => {
  try {
    // Debug log for session and cookies
    console.log('DEBUG verifySession: session:', req.session);
    console.log('DEBUG verifySession: cookies:', req.cookies);

    if (!req.session || !req.session.userId) {
      console.log('DEBUG verifySession: No session or userId');
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
      console.log('DEBUG verifySession: User not active or not found');
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
    console.log('DEBUG verifySession: user attached to req:', req.user);

    next();
  } catch (error) {
    console.log('DEBUG verifySession: error', error);
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
      // Use req.user.role if it exists (set by verifySession or verifyToken)
      const role = req.user && req.user.role;

      if (!role) {
        return res.status(401).json({
          success: false,
          message: 'User authentication information missing',
        });
      }

      // Check if user have required role
      if (role !== requiredRole) {
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

module.exports = { authenticate, verifyToken, verifySession, checkUserRole };
