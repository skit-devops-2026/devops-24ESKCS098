import { Reaction } from '../models/index.js';
import { isMongoConnected, inMemoryStore } from '../config/db.js';

// PUT /api/posts/:id/reaction - Add or change reaction
async function upsertReaction(req, res, next) {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { type = 'like' } = req.body;

    const validTypes = ['like', 'fire', 'clap', 'party', 'epic', 'star'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid reaction type. Valid: ${validTypes.join(', ')}`,
      });
    }

    const normType = type.toLowerCase();

    // MongoDB Mode
    if (isMongoConnected()) {
      await Reaction.findOneAndUpdate(
        { post_id: postId, user_id: userId },
        { type: normType, created_at: new Date() },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      const countsRaw = await Reaction.aggregate([
        { $match: { post_id: postId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]);

      const reactionCounts = {};
      countsRaw.forEach((r) => {
        reactionCounts[r._id] = r.count;
      });

      return res.json({
        success: true,
        myReaction: normType,
        hasLiked: normType === 'like',
        reactionCounts,
      });
    }

    // In-Memory Dev Store Fallback
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

    // MongoDB Mode
    if (isMongoConnected()) {
      await Reaction.deleteOne({ post_id: postId, user_id: userId });

      const countsRaw = await Reaction.aggregate([
        { $match: { post_id: postId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]);

      const reactionCounts = {};
      countsRaw.forEach((r) => {
        reactionCounts[r._id] = r.count;
      });

      return res.json({
        success: true,
        myReaction: null,
        hasLiked: false,
        reactionCounts,
      });
    }

    // In-Memory Dev Store Fallback
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

export {
  upsertReaction,
  deleteReaction,
};

export default {
  upsertReaction,
  deleteReaction,
};
