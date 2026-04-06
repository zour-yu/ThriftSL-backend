const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');


// Sign up
router.post('/signup', AuthController.signup);

// Sign in
router.post('/signin', AuthController.signin);

// Reset password
router.post('/reset-password', AuthController.resetPassword);

// Logout - destroy session
router.post('/logout', AuthController.logout);

// Check session status
router.get('/session', AuthController.checkSession);

module.exports = router;
