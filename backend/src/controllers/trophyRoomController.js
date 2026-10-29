import { Post, Group, Badge, User } from '../models/index.js';
import { isMongoConnected, inMemoryStore } from '../config/db.js';

// GET /api/trophy-room/me - Personal Achievement Log & Badges Rack
async function getMyTrophyRoom(req, res, next) {
  try {
    const userId = req.user?.id || 1;
    const category = req.query.category || 'ALL';

    // MongoDB Mode
    if (isMongoConnected()) {
      const [user, userPosts, userGroups, allBadges] = await Promise.all([
        User.findOne({ id: userId }).lean(),
        Post.find({ author_id: userId }).sort({ completed_at: -1 }).lean(),
        Group.find({
          $or: [
            { 'members.user_id': userId },
            { 'members.userId': userId },
            { adminId: userId },
            { admin_id: userId },
          ],
        }).lean(),
        Badge.find({}).lean(),
      ]);

      const totalQuests = userPosts.length;
      const totalXp = user?.xp ?? userPosts.reduce((sum, p) => sum + (p.xp_earned || 0), 0);
      const squadCount = userGroups.length;

      // Dynamic rank calculation based on community XP
      const higherXpCount = await User.countDocuments({ xp: { $gt: totalXp } });
      const currentRank = `#${higherXpCount + 1}`;

      // Dynamic streak computation based on distinct weeks with activity
      const postWeeks = new Set(
        userPosts.map((p) => {
          const d = new Date(p.completed_at || p.created_at || Date.now());
          const yearStart = new Date(d.getFullYear(), 0, 1);
          const weekNo = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
          return `${d.getFullYear()}-W${weekNo}`;
        })
      );
      const streakWeeks = Math.max(postWeeks.size, totalQuests > 0 ? 1 : 0);

      const badges = allBadges.map((b) => {
        const unlock = (b.unlocked_by || []).find(
          (u) => u.user_id === userId || u.userId === userId
        );
        const hasMatchingQuest = userPosts.some(
          (p) => (p.category || '').toUpperCase() === (b.category || '').toUpperCase()
        );
        const isUnlocked = Boolean(unlock || hasMatchingQuest);

        return {
          id: b.id || b._id,
          title: b.title,
          category: b.category,
          icon: b.icon || '🏆',
          desc: b.description || '',
          bg: b.bg_color && b.bg_color.startsWith('#') ? `bg-[${b.bg_color}]` : b.bg_color || 'bg-[#ffed00]',
          locked: !isUnlocked,
          progress: b.progress || null,
          unlockedAt: isUnlocked
            ? unlock?.unlocked_at
              ? new Date(unlock.unlocked_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'Unlocked'
            : 'Locked 🔒',
        };
      });

      const groupMap = new Map(userGroups.map((g) => [g.id || String(g._id), g.name]));

      let completedItems = userPosts.map((p) => {
        const proofImg =
          (p.proof_images && p.proof_images[0]) ||
          (p.images && p.images[0]) ||
          p.image ||
          null;

        return {
          id: `comp-${p.id || p._id}`,
          postId: p.id || p._id,
          title: p.title || 'Milestone Conquered',
          category: (p.category || p.badge_label || 'ADVENTURE').toUpperCase(),
          squad: groupMap.get(String(p.group_id)) || 'Personal Quest',
          completedDate: new Date(p.completed_at || p.created_at || Date.now()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          image: proofImg,
          stat: p.stat_badge || `${p.xp_earned || 250} XP Conquered`,
          note: p.caption || '',
          isPrivate: p.visibility === 'personal',
          xp: p.xp_earned || 250,
        };
      });

      if (category !== 'ALL') {
        completedItems = completedItems.filter((i) =>
          i.category.toUpperCase().includes(category.toUpperCase())
        );
      }

      return res.json({
        success: true,
        stats: {
          totalQuests,
          totalXp: `${Number(totalXp).toLocaleString()} XP`,
          currentRank,
          streakWeeks,
          squadCount,
        },
        badges,
        completedItems,
      });
    }

    // In-Memory Dev Store Mode Fallback
    const userPosts = (inMemoryStore.posts || []).filter((p) => p.author_id === userId);
    const userGroups = (inMemoryStore.groups || []).filter((g) =>
      (g.members || []).some((m) => m.userId === userId || m.user_id === userId)
    );
    const totalXp = userPosts.reduce((sum, p) => sum + (p.xp_earned || 250), 0);

    const items = userPosts.map((p) => {
      const squad = (inMemoryStore.groups || []).find((g) => g.id === p.group_id) || { name: 'Personal Quest' };
      return {
        id: `comp-${p.id}`,
        postId: p.id,
        title: p.title || 'Milestone Conquered',
        category: (p.category || 'ADVENTURE').toUpperCase(),
        squad: squad.name,
        completedDate: new Date(p.completed_at || Date.now()).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        image: (p.proof_images && p.proof_images[0]) || null,
        stat: p.stat_badge || 'Milestone Conquered',
        note: p.caption,
        isPrivate: p.visibility === 'personal',
        xp: p.xp_earned || 250,
      };
    });

    res.json({
      success: true,
      stats: {
        totalQuests: items.length,
        totalXp: `${totalXp.toLocaleString()} XP`,
        currentRank: '#1',
        streakWeeks: items.length > 0 ? 1 : 0,
        squadCount: userGroups.length,
      },
      badges: (inMemoryStore.badges || []).map((b) => ({
        id: b.id,
        title: b.title,
        category: b.category,
        icon: b.icon,
        desc: b.description,
        bg: b.bg,
        locked: false,
        progress: b.progress || null,
        unlockedAt: 'Unlocked',
      })),
      completedItems: category === 'ALL' ? items : items.filter((i) => i.category.includes(category)),
    });
  } catch (err) {
    next(err);
  }
}

export {
  getMyTrophyRoom,
};

export default {
  getMyTrophyRoom,
};
