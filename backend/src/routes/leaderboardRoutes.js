const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth } = require('../middleware/auth');

// GET /api/leaderboard?period=weekly|monthly|all-time&groupId=&search=&limit= (Public / Guest readable)
router.get('/', optionalAuth, leaderboardController.getLeaderboard);

module.exports = router;
