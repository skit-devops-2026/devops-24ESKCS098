const { Post, User, Group, Comment, Reaction } = require('../models');
const { isMongoConnected, inMemoryStore } = require('../config/db');
const { calculateXP } = require('../utils/xp');

// GET /api/posts - Wall of Fame Feed
async function getFeed(req, res, next) {
  try {
    const userId = req.user.id;
    const filter = req.query.filter || 'all';
    const groupId = req.query.groupId ? parseInt(req.query.groupId, 10) : null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = (page - 1) * limit;

    // MongoDB Mode
    if (isMongoConnected()) {
      // Find groups user is a member of
      const userGroups = await Group.find({ 'members.user_id': userId }).select('id').lean();
      const userGroupIds = userGroups.map((g) => g.id);

      const query = { visibility: 'shared' };

      if (groupId) {
        query.group_id = groupId;
      } else if (filter === 'my-groups') {
        query.$or = [{ group_id: { $in: userGroupIds } }, { author_id: userId }];
      } else {
        // Shared feed: show posts from user's squads or authored by user or general squads
        if (userGroupIds.length > 0) {
          query.$or = [{ group_id: { $in: userGroupIds } }, { author_id: userId }];
        }
      }

      if (filter === 'this-week') {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        query.completed_at = { $gte: oneWeekAgo };
      }

      const rows = await Post.find(query)
        .sort({ completed_at: -1 })
        .skip(offset)
        .limit(limit + 1)
        .lean();

      const hasMore = rows.length > limit;
      const postsToReturn = hasMore ? rows.slice(0, limit) : rows;
      const postIds = postsToReturn.map((p) => p.id);

      let reactionsByPost = {};
      let myReactionsByPost = {};
      let commentsByPost = {};
      let commentCountsByPost = {};

      if (postIds.length > 0) {
        // Aggregate reactions count per post
        const reactionsRaw = await Reaction.aggregate([
          { $match: { post_id: { $in: postIds } } },
          { $group: { _id: { post_id: '$post_id', type: '$type' }, count: { $sum: 1 } } },
        ]);

        reactionsRaw.forEach((r) => {
          const pid = r._id.post_id;
          const rType = r._id.type;
          if (!reactionsByPost[pid]) reactionsByPost[pid] = {};
          reactionsByPost[pid][rType] = r.count;
        });

        // User's own reactions
        const userReactions = await Reaction.find({
          post_id: { $in: postIds },
          user_id: userId,
        }).lean();

        userReactions.forEach((ur) => {
          myReactionsByPost[ur.post_id] = ur.type;
        });

        // Comment counts
        const commentCountsRaw = await Comment.aggregate([
          { $match: { post_id: { $in: postIds } } },
          { $group: { _id: '$post_id', count: { $sum: 1 } } },
        ]);
        commentCountsRaw.forEach((c) => {
          commentCountsByPost[c._id] = c.count;
        });

        // Latest 2 comments per post
        const comments = await Comment.find({ post_id: { $in: postIds } })
          .sort({ created_at: -1 })
          .lean();

        comments.forEach((c) => {
          if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
          if (commentsByPost[c.post_id].length < 2) {
            commentsByPost[c.post_id].push({
              id: c.id,
              authorId: c.author_id,
              isOwner: c.author_id === userId,
              name: c.author_name,
              color: c.color || 'text-black',
              text: c.text,
              time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }
        });
      }

      // Authors & Groups lookup
      const authorIds = [...new Set(postsToReturn.map((p) => p.author_id))];
      const squadIds = [...new Set(postsToReturn.map((p) => p.group_id).filter(Boolean))];

      const [authors, squads] = await Promise.all([
        User.find({ id: { $in: authorIds } }).lean(),
        Group.find({ id: { $in: squadIds } }).lean(),
      ]);

      const authorMap = new Map(authors.map((u) => [u.id, u]));
      const squadMap = new Map(squads.map((g) => [g.id, g]));

      const formattedPosts = postsToReturn.map((p) => {
        const author = authorMap.get(p.author_id) || {};
        const squad = squadMap.get(p.group_id);
        const postReactions = reactionsByPost[p.id] || {};
        const myReaction = myReactionsByPost[p.id] || null;
        const isRecent = Date.now() - new Date(p.completed_at).getTime() <= 7 * 24 * 60 * 60 * 1000;

        return {
          id: p.id,
          author_id: p.author_id,
          isOwner: p.author_id === userId,
          filter: isRecent ? 'this-week' : 'my-groups',
          badge: p.badge_label || 'Quest Conquered',
          name: author.name || 'Quester',
          subtitle: p.caption,
          avatar: author.avatar_url || '',
          image: p.images && p.images[0] ? p.images[0] : null,
          likes: postReactions['like'] || 0,
          hasLiked: myReaction === 'like',
          comments: commentCountsByPost[p.id] || 0,
          squadName: squad ? squad.name : p.type === 'solo' || !p.group_id ? 'Solo Quest 👤' : null,
          xpEarned: p.xp_earned,
          statBadge: p.stat_badge,
          completionDate: new Date(p.completed_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          reactionCounts: postReactions,
          userReaction: myReaction,
          commentList: commentsByPost[p.id] || [],
          taggedFriends: p.tagged_friends || [],
        };
      });

      return res.json({ success: true, posts: formattedPosts, page, hasMore });
    }

    // In-Memory Dev Store Mode Fallback
    let posts = [...inMemoryStore.posts].filter((p) => p.visibility === 'shared');

    if (groupId) {
      posts = posts.filter((p) => p.group_id === groupId);
    }
    if (filter === 'this-week') {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      posts = posts.filter((p) => new Date(p.completed_at).getTime() >= oneWeekAgo);
    }
    if (filter === 'my-groups') {
      posts = posts.filter((p) => [1, 2].includes(p.group_id) || p.author_id === userId);
    }

    posts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    const paginated = posts.slice(offset, offset + limit);
    const hasMore = offset + limit < posts.length;

    const formattedPosts = paginated.map((p) => {
      const author = inMemoryStore.users.find((u) => u.id === p.author_id) || { name: 'Quester', avatar_url: '' };
      const squad = inMemoryStore.groups.find((g) => g.id === p.group_id);
      const postComments = inMemoryStore.comments.filter((c) => c.post_id === p.id);
      const postReactions = inMemoryStore.reactions.filter((r) => r.post_id === p.id);

      const reactionCounts = {};
      postReactions.forEach((r) => {
        reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
      });

      const myReactionObj = postReactions.find((r) => r.user_id === userId);
      const hasLiked = postReactions.some((r) => r.user_id === userId && r.type === 'like');
      const isRecent = Date.now() - new Date(p.completed_at).getTime() <= 7 * 24 * 60 * 60 * 1000;

      return {
        id: p.id,
        filter: isRecent ? 'this-week' : 'my-groups',
        badge: p.badge_label || 'Epic Milestone',
        name: author.name,
        subtitle: p.caption,
        avatar: author.avatar_url,
        image:
          (p.proof_images && p.proof_images[0]) ||
          (p.proofImages && p.proofImages[0]) ||
          (p.images && p.images[0]) ||
          p.image ||
          null,
        likes: reactionCounts['like'] || 0,
        comments: postComments.length,
        squadName: squad ? squad.name : p.type === 'solo' || !p.group_id ? 'Solo Quest 👤' : null,
        xpEarned: p.xp_earned,
        statBadge: p.stat_badge,
        completionDate: new Date(p.completed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        reactionCounts,
        userReaction: myReactionObj ? myReactionObj.type : null,
        commentList: postComments.map((c) => ({
          id: c.id,
          authorId: c.author_id,
          isOwner: c.author_id === userId,
          name: c.author_name,
          color: c.color || 'text-black',
          text: c.text,
          time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })),
        taggedFriends: p.tagged_friends || [],
      };
    });

    res.json({ success: true, posts: formattedPosts, page, hasMore });
  } catch (err) {
    next(err);
  }
}

// POST /api/posts - Create Wall of Fame Achievement Post
async function createPost(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      title,
      caption,
      badgeLabel,
      statBadge,
      groupId = 1,
      taggedUserIds = [],
      xp,
    } = req.body;

    const proofImages =
      req.body.proofImages || req.body.imageUrls || (req.body.image ? [req.body.image] : []);

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Quest title is required' });
    }

    const isGroup = Boolean(
      groupId ||
        (taggedUserIds && taggedUserIds.length > 0) ||
        (req.body.taggedFriendIds && req.body.taggedFriendIds.length > 0)
    );
    const calculatedXp =
      typeof xp === 'number' && xp > 0
        ? xp
        : calculateXP({ hasProof: proofImages.length > 0, isGroup });

    // MongoDB Mode
    if (isMongoConnected()) {
      const lastPost = await Post.findOne().sort({ id: -1 });
      const newId = lastPost ? lastPost.id + 1 : 1;

      const newPost = await Post.create({
        id: newId,
        type: req.body.type || (groupId ? 'group' : 'solo'),
        author_id: userId,
        group_id: groupId || 1,
        title: title.trim(),
        caption: caption ? caption.trim() : `Conquered "${title}"!`,
        badge_label: badgeLabel || 'Quest Conquered',
        stat_badge: statBadge || 'Verified ⚡',
        xp_earned: calculatedXp,
        visibility: 'shared',
        images: proofImages,
        tagged_friends: taggedUserIds,
        completed_at: new Date(),
        created_at: new Date(),
      });

      let currentUser = await User.findOne({ id: userId });
      if (currentUser && (currentUser.xp === undefined || currentUser.xp === null)) {
        currentUser.xp = 1950;
        await currentUser.save();
      }

      const updatedUser = await User.findOneAndUpdate(
        { id: userId },
        { $inc: { xp: calculatedXp } },
        { returnDocument: 'after' }
      );

      return res.status(201).json({
        success: true,
        post: newPost,
        updatedUserXp: updatedUser ? updatedUser.xp : undefined,
      });
    }

    // In-Memory Dev Store Fallback
    if (!inMemoryStore._nextPostId) {
      inMemoryStore._nextPostId =
        inMemoryStore.posts.length > 0 ? Math.max(...inMemoryStore.posts.map((p) => p.id)) + 1 : 1;
    }
    const newId = inMemoryStore._nextPostId++;
    const newPost = {
      id: newId,
      type: req.body.type || (groupId ? 'group' : 'solo'),
      author_id: userId,
      group_id: req.body.groupId !== undefined ? req.body.groupId : req.body.type === 'solo' ? null : 1,
      title: title.trim(),
      category: req.body.category || 'ADVENTURE',
      caption: caption ? caption.trim() : `Conquered "${title}"!`,
      badge_label: badgeLabel || 'Quest Conquered',
      stat_badge: statBadge || 'Verified ⚡',
      xp_earned: calculatedXp,
      visibility: 'shared',
      completed_at: new Date().toISOString(),
      proof_images: proofImages,
      tagged_friends: taggedUserIds.map((tid) => {
        const u = inMemoryStore.users.find((user) => user.id === tid);
        return u ? { id: u.id, name: u.name } : { id: tid, name: `Friend ${tid}` };
      }),
    };

    inMemoryStore.posts.unshift(newPost);
    res.status(201).json({ success: true, post: newPost });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/stats/weekly - Quests completed in last 7 days
async function getWeeklyStats(req, res, next) {
  try {
    const userId = req.user.id;

    // MongoDB Mode
    if (isMongoConnected()) {
      const userGroups = await Group.find({ 'members.user_id': userId }).select('id').lean();
      const groupIds = userGroups.map((g) => g.id);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const count = await Post.countDocuments({
        completed_at: { $gte: oneWeekAgo },
        group_id: { $in: groupIds },
      });

      return res.json({ success: true, count });
    }

    // In-Memory Dev Store Fallback
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const count = inMemoryStore.posts.filter(
      (p) => new Date(p.completed_at).getTime() >= oneWeekAgo
    ).length;
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/posts/:id/visibility - Toggle Privacy (personal vs shared)
async function updateVisibility(req, res, next) {
  try {
    const postId = parseInt(req.params.id, 10);
    const { visibility } = req.body;

    if (!['personal', 'shared'].includes(visibility)) {
      return res.status(400).json({ success: false, message: 'Visibility must be "personal" or "shared"' });
    }

    // MongoDB Mode
    if (isMongoConnected()) {
      const post = await Post.findOneAndUpdate(
        { id: postId, author_id: req.user.id },
        { visibility },
        { returnDocument: 'after' }
      );

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
      }

      return res.json({ success: true, visibility });
    }

    // In-Memory Dev Store Fallback
    const post = inMemoryStore.posts.find((p) => p.id === postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.visibility = visibility;
    res.json({ success: true, visibility });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id
async function deletePost(req, res, next) {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // MongoDB Mode
    if (isMongoConnected()) {
      const post = await Post.findOne({ id: postId });
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Check author or squad admin
      const isAuthor = post.author_id === userId;
      let isAdmin = false;
      if (!isAuthor && post.group_id) {
        const group = await Group.findOne({ id: post.group_id });
        if (group && group.members) {
          const m = group.members.find((member) => member.user_id === userId);
          if (m && m.role === 'admin') isAdmin = true;
        }
      }

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized to delete post' });
      }

      const xpToDeduct = post.xp_earned || 250;
      await Post.deleteOne({ id: postId });
      await Comment.deleteMany({ post_id: postId });
      await Reaction.deleteMany({ post_id: postId });

      const updatedUser = await User.findOneAndUpdate(
        { id: post.author_id },
        { $inc: { xp: -xpToDeduct } },
        { returnDocument: 'after' }
      );

      return res.json({
        success: true,
        message: 'Post deleted',
        xpDeducted: xpToDeduct,
        updatedUserXp: updatedUser ? updatedUser.xp : undefined,
      });
    }

    // In-Memory Dev Store Fallback
    const idx = inMemoryStore.posts.findIndex((p) => p.id === postId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Post not found' });
    inMemoryStore.posts.splice(idx, 1);

    if (Array.isArray(inMemoryStore.comments)) {
      inMemoryStore.comments = inMemoryStore.comments.filter((c) => c.post_id !== postId);
    }
    if (Array.isArray(inMemoryStore.reactions)) {
      inMemoryStore.reactions = inMemoryStore.reactions.filter((r) => r.post_id !== postId);
    }

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFeed,
  createPost,
  getWeeklyStats,
  updateVisibility,
  deletePost,
};
