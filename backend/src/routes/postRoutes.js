const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const reactionController = require('../controllers/reactionController');
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Posts Feed & CRUD
router.get('/', auth, postController.getFeed);
router.post('/', auth, postController.createPost);
router.get('/stats/weekly', auth, postController.getWeeklyStats);
router.patch('/:id/visibility', auth, postController.updateVisibility);
router.delete('/:id', auth, postController.deletePost);

// Post Reactions (/api/posts/:id/reaction)
router.put('/:id/reaction', auth, reactionController.upsertReaction);
router.delete('/:id/reaction', auth, reactionController.deleteReaction);

// Post Comments (/api/posts/:id/comments)
router.get('/:id/comments', auth, commentController.getComments);
router.post('/:id/comments', auth, commentController.addComment);

module.exports = router;

