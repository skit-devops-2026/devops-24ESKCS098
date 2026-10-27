const { pool, isPgConnected, inMemoryStore } = require('../config/db');
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

    if (isPgConnected()) {
      // PostgreSQL Production Query
      const isThisWeek = filter === 'this-week';
      const feedQuery = `
        SELECT
          p.id, p.type, p.title, p.caption, p.badge_label, p.stat_badge,
          p.xp_earned, p.visibility, p.completed_at, p.group_id,
          u.id AS author_id, u.name AS author_name, u.avatar_url AS author_avatar,
          g.name AS squad_name,
          (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id)::int AS reaction_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)::int AS comment_count,
          (SELECT r.type FROM reactions r WHERE r.post_id = p.id AND r.user_id = $1) AS my_reaction,
          EXISTS(SELECT 1 FROM reactions r WHERE r.post_id = p.id AND r.user_id = $1 AND r.type = 'like') AS has_liked,
          COALESCE((SELECT json_agg(i.image_url) FROM post_images i WHERE i.post_id = p.id), '[]') AS proof_images
        FROM posts p
        JOIN users u ON u.id = p.author_id
        JOIN groups g ON g.id = p.group_id
        WHERE p.visibility = 'shared'
          AND p.group_id IN (SELECT group_id FROM group_members WHERE user_id = $1)
          AND ($2::int IS NULL OR p.group_id = $2)
          AND ($3::boolean = FALSE OR p.completed_at >= NOW() - INTERVAL '7 days')
        ORDER BY p.completed_at DESC
        LIMIT $4 OFFSET $5;
      `;

      const { rows } = await pool.query(feedQuery, [userId, groupId, isThisWeek, limit + 1, offset]);
      const hasMore = rows.length > limit;
      const postsToReturn = hasMore ? rows.slice(0, limit) : rows;

      // Batch query top reactions and latest 2 comments if there are posts
      const postIds = postsToReturn.map((p) => p.id);
      let reactionsByPost = {};
      let commentsByPost = {};

      if (postIds.length > 0) {
        const reactionsRes = await pool.query(
          `SELECT post_id, type, COUNT(*)::int AS count FROM reactions WHERE post_id = ANY($1::int[]) GROUP BY post_id, type`,
          [postIds]
        );
        reactionsRes.rows.forEach((r) => {
          if (!reactionsByPost[r.post_id]) reactionsByPost[r.post_id] = {};
          reactionsByPost[r.post_id][r.type] = r.count;
        });

        const commentsRes = await pool.query(
          `SELECT c.id, c.post_id, c.author_id, c.text, c.created_at, u.name AS author_name
           FROM (
             SELECT *, ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at DESC) AS rn
             FROM comments WHERE post_id = ANY($1::int[])
           ) c
           JOIN users u ON u.id = c.author_id
           WHERE c.rn <= 2;`,
          [postIds]
        );
        commentsRes.rows.forEach((c) => {
          if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
          commentsByPost[c.post_id].push({
            id: c.id,
            authorId: c.author_id,
            isOwner: c.author_id === userId,
            name: c.author_name,
            text: c.text,
            time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        });
      }

      const formattedPosts = postsToReturn.map((p) => ({
        id: p.id,
        badge: p.badge_label || 'Quest Conquered',
        name: p.author_name,
        subtitle: p.caption,
        avatar: p.author_avatar,
        image: Array.isArray(p.proof_images) && p.proof_images[0] ? p.proof_images[0] : null,
        likes: (reactionsByPost[p.id] && reactionsByPost[p.id]['like']) || 0,
        hasLiked: Boolean(p.has_liked),
        comments: p.comment_count,
        squadName: p.squad_name,
        xpEarned: p.xp_earned,
        statBadge: p.stat_badge,
        completionDate: new Date(p.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        reactionCounts: reactionsByPost[p.id] || {},
        userReaction: p.my_reaction,
        commentList: commentsByPost[p.id] || [],
      }));

      return res.json({ success: true, posts: formattedPosts, page, hasMore });
    }

    // In-Memory Dev Store Mode
    let posts = [...inMemoryStore.posts].filter((p) => p.visibility === 'shared');

    if (groupId) {
      posts = posts.filter((p) => p.group_id === groupId);
    }
    if (filter === 'this-week') {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      posts = posts.filter((p) => new Date(p.completed_at).getTime() >= oneWeekAgo);
    }
    if (filter === 'my-groups') {
      // Show posts from user's squads (groups 1 and 2, or authored by user)
      posts = posts.filter((p) => [1, 2].includes(p.group_id) || p.author_id === userId);
    }

    // Sort descending by completion date
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
      const isRecent = (Date.now() - new Date(p.completed_at).getTime()) <= 7 * 24 * 60 * 60 * 1000;

      return {
        id: p.id,
        filter: isRecent ? 'this-week' : 'my-groups',
        badge: p.badge_label || 'Epic Milestone',
        name: author.name,
        subtitle: p.caption,
        avatar: author.avatar_url,
        image: (p.proof_images && p.proof_images[0]) || (p.proofImages && p.proofImages[0]) || p.image || null,
        likes: reactionCounts['like'] || 0,
        comments: postComments.length,
        squadName: squad ? squad.name : (p.type === 'solo' || !p.group_id ? 'Solo Quest 👤' : null),
        xpEarned: p.xp_earned,
        statBadge: p.stat_badge,
        completionDate: new Date(p.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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

    const proofImages = req.body.proofImages || req.body.imageUrls || (req.body.image ? [req.body.image] : []);

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Quest title is required' });
    }

    const isGroup = Boolean(groupId || (taggedUserIds && taggedUserIds.length > 0) || (req.body.taggedFriendIds && req.body.taggedFriendIds.length > 0));
    const calculatedXp = (typeof xp === 'number' && xp > 0)
      ? xp
      : calculateXP({ hasProof: proofImages.length > 0, isGroup });

    if (isPgConnected()) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const postInsert = `
          INSERT INTO posts (type, author_id, group_id, title, caption, badge_label, stat_badge, xp_earned, visibility)
          VALUES ('solo', $1, $2, $3, $4, $5, $6, $7, 'shared')
          RETURNING *;
        `;
        const { rows } = await client.query(postInsert, [
          userId,
          groupId,
          title.trim(),
          caption ? caption.trim() : `Conquered "${title}"!`,
          badgeLabel || 'Quest Conquered',
          statBadge || 'Verified ⚡',
          calculatedXp,
        ]);
        const newPost = rows[0];

        // Insert proof photos
        for (const imgUrl of proofImages) {
          await client.query(`INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)`, [newPost.id, imgUrl]);
        }

        // Insert tagged friends
        for (const friendId of taggedUserIds) {
          await client.query(`INSERT INTO post_tags (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [newPost.id, friendId]);
        }

        await client.query('COMMIT');
        return res.status(201).json({ success: true, post: newPost });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    // In-Memory Dev Store: Monotonic ID generation (never reuses deleted post IDs)
    if (!inMemoryStore._nextPostId) {
      inMemoryStore._nextPostId = inMemoryStore.posts.length > 0 ? Math.max(...inMemoryStore.posts.map((p) => p.id)) + 1 : 1;
    }
    const newId = inMemoryStore._nextPostId++;
    const newPost = {
      id: newId,
      type: req.body.type || (groupId ? 'group' : 'solo'),
      author_id: userId,
      group_id: req.body.groupId !== undefined ? req.body.groupId : (req.body.type === 'solo' ? null : 1),
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

    if (isPgConnected()) {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM posts
         WHERE completed_at >= NOW() - INTERVAL '7 days'
           AND group_id IN (SELECT group_id FROM group_members WHERE user_id = $1);`,
        [userId]
      );
      return res.json({ success: true, count: rows[0].count });
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const count = inMemoryStore.posts.filter((p) => new Date(p.completed_at).getTime() >= oneWeekAgo).length;
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

    if (isPgConnected()) {
      const { rowCount } = await pool.query(
        `UPDATE posts SET visibility = $1 WHERE id = $2 AND author_id = $3`,
        [visibility, postId, req.user.id]
      );
      if (rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
      }
      return res.json({ success: true, visibility });
    }

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

    if (isPgConnected()) {
      const { rowCount } = await pool.query(
        `DELETE FROM posts WHERE id = $1 AND (author_id = $2 OR group_id IN (SELECT group_id FROM group_members WHERE user_id = $2 AND role = 'admin'))`,
        [postId, userId]
      );
      if (rowCount === 0) return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
      return res.json({ success: true, message: 'Post deleted' });
    }

    const idx = inMemoryStore.posts.findIndex((p) => p.id === postId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Post not found' });
    inMemoryStore.posts.splice(idx, 1);

    // Cascade delete associated comments and reactions for this post in dev store
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
