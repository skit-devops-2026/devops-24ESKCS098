'use strict';

import express from 'express';
import authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Support both /signup and /register to maintain backward compatibility across all frontend components
router.post('/signup', authController.signup);
router.post('/register', authController.register);
router.post('/login', authController.login);

// Session verification and stateless logout
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, authController.logout);

export default router;
