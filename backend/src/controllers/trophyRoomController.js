const { Post, Group, Badge, User } = require('../models');
const { isMongoConnected, inMemoryStore } = require('../config/db');

// Alex Rivero's Lifetime Conquests fallback presets
const ALEX_LIFETIME_CONQUESTS = [
  {
    id: 'comp-1',
    postId: 1,
    title: 'First Solo Skydive from 15,000 ft',
    category: 'ADVENTURE',
    squad: 'Trip Squad ✈️',
    completedDate: 'Oct 24, 2026',
    image: 'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
    stat: '15,000 ft • 60s Freefall',
    note: 'Heart was pounding like crazy at the exit door, but the freefall adrenaline was unmatched.',
    isPrivate: false,
    xp: 350,
  },
  {
    id: 'comp-2',
    postId: 101,
    title: 'Scuba Diving Ocean Reef Certification',
    category: 'TRAVEL',
    squad: 'Trip Squad ✈️',
    completedDate: 'Oct 10, 2026',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
    stat: '18m Depth • 45m Dive',
    note: 'Swam alongside sea turtles and navigated vibrant coral pinnacles in crystal turquoise waters.',
    isPrivate: false,
    xp: 350,
  },
  {
    id: 'comp-3',
    postId: 102,
    title: 'High Altitude Summit: Mount Rainier (Camp Muir)',
    category: 'ADVENTURE',
    squad: 'Trip Squad ✈️',
    completedDate: 'Sep 28, 2026',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    stat: '10,080 ft • 9 hrs Trek',
    note: 'Navigated glacier snowfields with crampons and ice axes. The sunrise above cloud level was breathtaking.',
    isPrivate: false,
    xp: 400,
  },
  {
    id: 'comp-4',
    postId: 103,
    title: '100km Century Cycling Challenge',
    category: 'FITNESS',
    squad: 'Fitness Freaks 🏋️',
    completedDate: 'Sep 14, 2026',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80',
    stat: '102.4 km • 3h 48m',
    note: 'Pushed through strong coastal headwinds. Legs burned on the climbs, but crossed the line with adrenaline to spare.',
    isPrivate: false,
    xp: 300,
  },
  {
    id: 'comp-5',
    postId: 104,
    title: 'White Water Rafting Grade IV Rapids',
    category: 'ADVENTURE',
    squad: 'Trip Squad ✈️',
    completedDate: 'Aug 30, 2026',
    image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=600&q=80',
    stat: '24 km • Grade IV Rapids',
    note: 'Flipped once through the whirlpool canyon, but the squad pulled me right back into the raft!',
    isPrivate: false,
    xp: 300,
  },
  {
    id: 'comp-6',
    postId: 105,
    title: 'Desert Dunes Trek & Stargazing Camp',
    category: 'TRAVEL',
    squad: 'Personal Quest',
    completedDate: 'Aug 15, 2026',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80',
    stat: '3 Days • 40km Dunes',
    note: 'Zero light pollution under the Milky Way. Cooked flatbreads over campfire embers with local guides.',
    isPrivate: false,
    xp: 250,
  },
];

// GET /api/trophy-room/me - Personal Achievement Log & Badges Rack (Section 4)
async function getMyTrophyRoom(req, res, next) {
  try {
    const userId = req.user.id;
    const category = req.query.category || 'ALL';

    // MongoDB Mode
    if (isMongoConnected()) {
      const [userPosts, userGroups, allBadges] = await Promise.all([
        Post.find({ author_id: userId }).sort({ completed_at: -1 }).lean(),
        Group.find({ 'members.user_id': userId }).lean(),
        Badge.find({}).lean(),
      ]);

      const totalQuests = userPosts.length;
      const totalXp = userPosts.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 3910;
      const squadCount = userGroups.length || 3;

      const badges = allBadges.map((b) => {
        const unlock = (b.unlocked_by || []).find((u) => u.user_id === userId);
        return {
          id: b.id,
          title: b.title,
          category: b.category,
          icon: b.icon,
          desc: b.description,
          bg: b.bg_color && b.bg_color.startsWith('#') ? `bg-[${b.bg_color}]` : b.bg_color || 'bg-[#ffed00]',
          locked: !unlock,
          progress: b.progress || null,
          unlockedAt: unlock
            ? new Date(unlock.unlocked_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : 'Locked 🔒',
        };
      });

      const groupMap = new Map(userGroups.map((g) => [g.id, g.name]));
      let completedItems = userPosts.map((p) => ({
        id: `comp-${p.id}`,
        postId: p.id,
        title: p.title,
        category: (p.badge_label || 'ADVENTURE').toUpperCase(),
        squad: groupMap.get(p.group_id) || 'Personal Quest',
        completedDate: new Date(p.completed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        image:
          (p.images && p.images[0]) ||
          'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
        stat: p.stat_badge || 'Milestone Conquered',
        note: p.caption,
        isPrivate: p.visibility === 'personal',
        xp: p.xp_earned,
      }));

      // Combine with presets if user has few posts
      const existingIds = new Set(completedItems.map((c) => c.postId));
      const presetsToAdd = ALEX_LIFETIME_CONQUESTS.filter((c) => !existingIds.has(c.postId));
      completedItems = [...completedItems, ...presetsToAdd];

      if (category !== 'ALL') {
        completedItems = completedItems.filter((i) =>
          i.category.toUpperCase().includes(category.toUpperCase())
        );
      }

      let currentRank = '#2';
      if (totalXp > 2250) currentRank = '#1';
      else if (totalXp >= 1800) currentRank = '#2';
      else currentRank = '#3';

      return res.json({
        success: true,
        stats: {
          totalQuests: Math.max(totalQuests, completedItems.length),
          totalXp: `${totalXp.toLocaleString()} XP`,
          currentRank,
          streakWeeks: 4,
          squadCount,
        },
        badges,
        completedItems,
      });
    }

    // In-Memory Dev Store Mode Fallback
    const existingPostIds = new Set(ALEX_LIFETIME_CONQUESTS.map((c) => c.postId));
    const newlyCreated = inMemoryStore.posts
      .filter((p) => (p.author_id === userId || p.author_id === 1) && !existingPostIds.has(p.id))
      .map((p) => {
        const squad = inMemoryStore.groups.find((g) => g.id === p.group_id) || { name: 'Trip Squad ✈️' };
        return {
          id: `comp-${p.id}`,
          postId: p.id,
          title: p.title || p.badge_label || 'Milestone Conquered',
          category: (p.category || p.badge_label || 'ADVENTURE').toUpperCase(),
          squad: p.squadName || squad.name,
          completedDate: new Date(p.completed_at || Date.now()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          image:
            (p.proof_images && p.proof_images[0]) ||
            (p.proofImages && p.proofImages[0]) ||
            p.image ||
            'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
          stat: p.stat_badge || p.statBadge || 'Milestone Conquered',
          note: p.caption,
          isPrivate: p.visibility === 'personal',
          xp: p.xp_earned || p.xpEarned || p.xp || 250,
        };
      });

    let items = [...ALEX_LIFETIME_CONQUESTS, ...newlyCreated];

    if (category !== 'ALL') {
      items = items.filter((i) => i.category.toUpperCase().includes(category.toUpperCase()));
    }

    const allAlexQuests = [...ALEX_LIFETIME_CONQUESTS, ...newlyCreated];
    const totalXpNum = allAlexQuests.reduce((sum, p) => sum + (p.xp || p.xp_earned || 0), 0);
    const totalConquestsNum = allAlexQuests.length;

    const completedWeeks = new Set(
      allAlexQuests.map((q) => {
        const d = new Date(q.completedDate || q.completed_at || Date.now());
        return Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
      })
    );
    const streakWeeks = Math.max(1, Math.min(8, completedWeeks.size));

    let currentRank = '#2';
    if (totalXpNum > 2250) currentRank = '#1';
    else if (totalXpNum >= 1800) currentRank = '#2';
    else currentRank = '#3';

    res.json({
      success: true,
      stats: {
        totalQuests: totalConquestsNum,
        totalXp: `${totalXpNum.toLocaleString()} XP`,
        currentRank,
        streakWeeks,
        squadCount: inMemoryStore.groups.length || 3,
      },
      badges: inMemoryStore.badges.map((b) => {
        const ub = inMemoryStore.user_badges.find((u) => u.badge_id === b.id && u.user_id === userId);
        return {
          id: b.id,
          title: b.title,
          category: b.category,
          icon: b.icon,
          desc: b.description,
          bg: b.bg,
          locked: !ub,
          progress: b.progress || null,
          unlockedAt: ub ? ub.unlocked_at : 'Locked 🔒',
        };
      }),
      completedItems: items,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyTrophyRoom,
};
