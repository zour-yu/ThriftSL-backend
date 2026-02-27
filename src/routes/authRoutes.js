const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');


// Sign up 
router.post('/signup', AuthController.signup);

// Sign in 
router.post('/signin', AuthController.signin);

// Reset password 
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;
