'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Public Auth Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Auth Endpoint
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
