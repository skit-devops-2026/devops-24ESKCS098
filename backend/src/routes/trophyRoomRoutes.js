import express from 'express';
import trophyRoomController from '../controllers/trophyRoomController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/trophy-room/me?category=
router.get('/me', auth, trophyRoomController.getMyTrophyRoom);

export default router;
