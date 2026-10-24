const express = require('express');
const router = express.Router();
const trophyRoomController = require('../controllers/trophyRoomController');
const auth = require('../middleware/auth');

// GET /api/trophy-room/me?category=
router.get('/me', auth, trophyRoomController.getMyTrophyRoom);

module.exports = router;
