const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const reactionController = require('../controllers/reactionController');
const commentController = require('../controllers/commentController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Posts Feed & Stats (Public / Guest readable with optionalAuth)
router.get('/', optionalAuth, postController.getFeed);
router.get('/stats/weekly', optionalAuth, postController.getWeeklyStats);

// Write actions require full authentication
router.post('/', authMiddleware, postController.createPost);
router.patch('/:id/visibility', authMiddleware, postController.updateVisibility);
router.delete('/:id', authMiddleware, postController.deletePost);

// Post Reactions (/api/posts/:id/reaction)
router.put('/:id/reaction', authMiddleware, reactionController.upsertReaction);
router.delete('/:id/reaction', authMiddleware, reactionController.deleteReaction);

// Post Comments (/api/posts/:id/comments)
router.get('/:id/comments', optionalAuth, commentController.getComments);
router.post('/:id/comments', authMiddleware, commentController.addComment);

module.exports = router;
