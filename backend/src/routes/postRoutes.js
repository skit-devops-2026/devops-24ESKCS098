'use strict';

import express from 'express';
import postController from '../controllers/postController.js';
import reactionController from '../controllers/reactionController.js';
import commentController from '../controllers/commentController.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public feed and community stats
router.get('/', optionalAuth, postController.getFeed);
router.get('/stats/weekly', optionalAuth, postController.getWeeklyStats);

// Post creation, privacy updates, and deletions
router.post('/', auth, postController.createPost);
router.patch('/:id/visibility', auth, postController.updateVisibility);
router.delete('/:id', auth, postController.deletePost);

// Post reactions
router.put('/:id/reaction', auth, reactionController.upsertReaction);
router.delete('/:id/reaction', auth, reactionController.deleteReaction);

// Comments
router.get('/:id/comments', optionalAuth, commentController.getComments);
router.post('/:id/comments', auth, commentController.addComment);

export default router;
