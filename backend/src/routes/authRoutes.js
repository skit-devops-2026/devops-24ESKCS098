'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Support both /signup and /register to maintain backward compatibility across all frontend components
router.post('/signup', authController.signup);
router.post('/register', authController.register);
router.post('/login', authController.login);

// Session verification and stateless logout
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
