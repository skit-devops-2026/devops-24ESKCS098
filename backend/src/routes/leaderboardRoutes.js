'use strict';

const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth } = require('../middleware/auth');

// Leaderboard rankings with optional squad, period, and search filters
router.get('/', optionalAuth, leaderboardController.getLeaderboard);

module.exports = router;
