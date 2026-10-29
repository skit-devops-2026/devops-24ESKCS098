import express from 'express';
import commentController from '../controllers/commentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// DELETE /api/comments/:id
router.delete('/:id', auth, commentController.deleteComment);

export default router;
