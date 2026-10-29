'use strict';

const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const reactionController = require('../controllers/reactionController');
const commentController = require('../controllers/commentController');
const { auth, optionalAuth } = require('../middleware/auth');

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

module.exports = router;
