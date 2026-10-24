const { pool, isPgConnected, inMemoryStore } = require('../config/db');

// PUT /api/posts/:id/reaction - Add or change reaction
async function upsertReaction(req, res, next) {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { type = 'like' } = req.body;

    const validTypes = ['like', 'fire', 'clap', 'party', 'epic', 'star'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ success: false, message: `Invalid reaction type. Valid: ${validTypes.join(', ')}` });
    }

    const normType = type.toLowerCase();

    if (isPgConnected()) {
      await pool.query(
        `INSERT INTO reactions (post_id, user_id, type)
         VALUES ($1, $2, $3)
         ON CONFLICT (post_id, user_id)
         DO UPDATE SET type = EXCLUDED.type, created_at = NOW();`,
        [postId, userId, normType]
      );

      const countsRes = await pool.query(
        `SELECT type, COUNT(*)::int AS count FROM reactions WHERE post_id = $1 GROUP BY type`,
        [postId]
      );
      const reactionCounts = {};
      countsRes.rows.forEach((r) => {
        reactionCounts[r.type] = r.count;
      });

      return res.json({
        success: true,
        myReaction: normType,
        hasLiked: normType === 'like',
        reactionCounts,
      });
    }

    // In-Memory Dev Store
    const existingIdx = inMemoryStore.reactions.findIndex(
      (r) => r.post_id === postId && r.user_id === userId
    );

    if (existingIdx !== -1) {
      inMemoryStore.reactions[existingIdx].type = normType;
    } else {
      inMemoryStore.reactions.push({ post_id: postId, user_id: userId, type: normType });
    }

    const postReactions = inMemoryStore.reactions.filter((r) => r.post_id === postId);
    const reactionCounts = {};
    postReactions.forEach((r) => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    res.json({
      success: true,
      myReaction: normType,
      hasLiked: normType === 'like',
      reactionCounts,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id/reaction - Remove reaction
async function deleteReaction(req, res, next) {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isPgConnected()) {
      await pool.query(`DELETE FROM reactions WHERE post_id = $1 AND user_id = $2`, [postId, userId]);

      const countsRes = await pool.query(
        `SELECT type, COUNT(*)::int AS count FROM reactions WHERE post_id = $1 GROUP BY type`,
        [postId]
      );
      const reactionCounts = {};
      countsRes.rows.forEach((r) => {
        reactionCounts[r.type] = r.count;
      });

      return res.json({
        success: true,
        myReaction: null,
        hasLiked: false,
        reactionCounts,
      });
    }

    const existingIdx = inMemoryStore.reactions.findIndex(
      (r) => r.post_id === postId && r.user_id === userId
    );
    if (existingIdx !== -1) {
      inMemoryStore.reactions.splice(existingIdx, 1);
    }

    const postReactions = inMemoryStore.reactions.filter((r) => r.post_id === postId);
    const reactionCounts = {};
    postReactions.forEach((r) => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    res.json({
      success: true,
      myReaction: null,
      hasLiked: false,
      reactionCounts,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upsertReaction,
  deleteReaction,
};
