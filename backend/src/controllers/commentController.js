const { pool, isPgConnected, inMemoryStore } = require('../config/db');

// GET /api/posts/:id/comments - List comments for a post
async function getComments(req, res, next) {
  try {
    const postId = parseInt(req.params.id, 10);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    if (isPgConnected()) {
      const { rows } = await pool.query(
        `SELECT c.id, c.text, c.created_at, u.id AS author_id, u.name AS author_name, u.avatar_url AS author_avatar
         FROM comments c
         JOIN users u ON u.id = c.author_id
         WHERE c.post_id = $1
         ORDER BY c.created_at ASC
         LIMIT $2 OFFSET $3;`,
        [postId, limit, offset]
      );

      const comments = rows.map((c) => ({
        id: c.id,
        name: c.author_name,
        avatar: c.author_avatar,
        text: c.text,
        time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      return res.json({ success: true, comments });
    }

    // In-Memory Dev Store
    const postComments = inMemoryStore.comments.filter((c) => c.post_id === postId);
    const paginated = postComments.slice(offset, offset + limit);

    res.json({
      success: true,
      comments: paginated.map((c) => ({
        id: c.id,
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

    if (isPgConnected()) {
      const { rows } = await pool.query(
        `INSERT INTO comments (post_id, author_id, text)
         VALUES ($1, $2, $3)
         RETURNING id, text, created_at;`,
        [postId, userId, text.trim()]
      );

      const userRes = await pool.query(`SELECT name, avatar_url FROM users WHERE id = $1`, [userId]);
      const author = userRes.rows[0] || { name: 'You' };

      const newComment = {
        id: rows[0].id,
        name: author.name,
        text: rows[0].text,
        time: 'Just now',
      };

      return res.status(201).json({ success: true, comment: newComment });
    }

    // In-Memory Dev Store
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

    if (isPgConnected()) {
      const { rowCount } = await pool.query(
        `DELETE FROM comments
         WHERE id = $1
           AND (author_id = $2 OR post_id IN (SELECT id FROM posts WHERE author_id = $2))`,
        [commentId, userId]
      );
      if (rowCount === 0) return res.status(404).json({ success: false, message: 'Comment not found or unauthorized' });
      return res.json({ success: true, message: 'Comment deleted' });
    }

    const idx = inMemoryStore.comments.findIndex((c) => c.id === commentId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Comment not found' });
    inMemoryStore.comments.splice(idx, 1);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getComments,
  addComment,
  deleteComment,
};
