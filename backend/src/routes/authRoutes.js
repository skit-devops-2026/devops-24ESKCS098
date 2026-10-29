'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Public auth routes (supports both /signup and /register)
router.post('/signup', authController.signup);
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected auth routes
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
