/**
 * Session-based Authentication Middleware
 * Validates that user has an active session
 * Extracts user data from session and attaches to req.session.user
 */

const validateSession = (req, res, next) => {
  try {
    // Check if session exists and has user data
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No active session. Please log in.',
      });
    }

    // Session is valid, user is authenticated
    // req.session.user is already available to controllers
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Session validation error',
      error: error.message,
    });
  }
};

module.exports = { validateSession };
