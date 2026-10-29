'use strict';

import express from 'express';
import leaderboardController from '../controllers/leaderboardController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Leaderboard rankings with optional squad, period, and search filters
router.get('/', optionalAuth, leaderboardController.getLeaderboard);

export default router;
