const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

// GET /api/leaderboard?period=weekly|monthly|all-time&groupId=&search=&limit=
router.get('/', auth, leaderboardController.getLeaderboard);

module.exports = router;
