import { Comment, Post, User } from '../models/index.js';
import { isMongoConnected, inMemoryStore } from '../config/db.js';

// GET /api/posts/:id/comments - List comments for a post
async function getComments(req, res, next) {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user?.id || 1;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    // MongoDB Mode
    if (isMongoConnected()) {
      const commentsRaw = await Comment.find({ post_id: postId })
        .sort({ created_at: 1 })
        .skip(offset)
        .limit(limit)
        .lean();

      const authorIds = [...new Set(commentsRaw.map((c) => c.author_id))];
      const users = await User.find({ id: { $in: authorIds } }).lean();
      const userMap = new Map(users.map((u) => [u.id, u]));

      const comments = commentsRaw.map((c) => {
        const author = userMap.get(c.author_id) || {};
        return {
          id: c.id,
          authorId: c.author_id,
          isOwner: c.author_id === userId,
          name: c.author_name || author.name || 'Explorer',
          avatar: author.avatar_url || '',
          color: c.color || 'text-black',
          text: c.text,
          time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      });

      return res.json({ success: true, comments });
    }

    // In-Memory Dev Store Fallback
    const postComments = inMemoryStore.comments.filter((c) => c.post_id === postId);
    const paginated = postComments.slice(offset, offset + limit);

    res.json({
      success: true,
      comments: paginated.map((c) => ({
        id: c.id,
        authorId: c.author_id,
        isOwner: c.author_id === userId,
        name: c.author_name,
        color: c.color || 'text-black',
        text: c.text,
        time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/posts/:id/comments - Add a new comment
async function addComment(req, res, next) {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty' });
    }

    if (text.length > 300) {
      return res.status(400).json({ success: false, message: 'Comment exceeds 300 characters limit' });
    }

    // MongoDB Mode
    if (isMongoConnected()) {
      const post = await Post.findOne({ id: postId });
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const user = await User.findOne({ id: userId });
      const authorName = user ? user.name : (req.user.name || 'You');

      const lastComment = await Comment.findOne().sort({ id: -1 });
      const newId = lastComment ? lastComment.id + 1 : 1;

      const commentDoc = await Comment.create({
        id: newId,
        post_id: postId,
        author_id: userId,
        author_name: authorName,
        color: 'text-primary font-black',
        text: text.trim(),
        created_at: new Date(),
      });

      return res.status(201).json({
        success: true,
        comment: {
          id: commentDoc.id,
          authorId: userId,
          isOwner: true,
          name: authorName,
          avatar: user ? user.avatar_url : '',
          color: commentDoc.color,
          text: commentDoc.text,
          time: 'Just now',
        },
      });
    }

    // In-Memory Dev Store Fallback
    const postExists = inMemoryStore.posts.some((p) => p.id === postId);
    if (!postExists) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const user = inMemoryStore.users.find((u) => u.id === userId) || { name: 'You (Alex)' };
    const newId = inMemoryStore.comments.length > 0 ? Math.max(...inMemoryStore.comments.map((c) => c.id)) + 1 : 1;

    const newComment = {
      id: newId,
      post_id: postId,
      author_id: userId,
      author_name: user.name,
      color: 'text-primary font-black',
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    inMemoryStore.comments.push(newComment);

    res.status(201).json({
      success: true,
      comment: {
        id: newComment.id,
        authorId: userId,
        isOwner: true,
        name: newComment.author_name,
        color: newComment.color,
        text: newComment.text,
        time: 'Just now',
      },
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/comments/:id
async function deleteComment(req, res, next) {
  try {
    const commentId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // MongoDB Mode
    if (isMongoConnected()) {
      const comment = await Comment.findOne({ id: commentId });
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }
      if (comment.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only delete your own comments',
        });
      }

      await Comment.deleteOne({ id: commentId });
      return res.json({ success: true, message: 'Comment deleted' });
    }

    // In-Memory Dev Store Fallback
    const comment = inMemoryStore.comments.find((c) => c.id === commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own comments',
      });
    }

    const idx = inMemoryStore.comments.indexOf(comment);
    inMemoryStore.comments.splice(idx, 1);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
}

export {
  getComments,
  addComment,
  deleteComment,
};

export default {
  getComments,
  addComment,
  deleteComment,
};
