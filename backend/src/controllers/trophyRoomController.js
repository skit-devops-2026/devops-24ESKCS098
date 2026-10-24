const { pool, isPgConnected, inMemoryStore } = require('../config/db');

// Alex Rivero's 14 Lifetime Conquests across squads (Sum = 3,910 XP)
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

    if (isPgConnected()) {
      // 1. Fetch user stats
      const statsQuery = `
        SELECT
          COUNT(p.id)::int AS total_quests,
          COALESCE(SUM(p.xp_earned), 0)::int AS total_xp,
          (SELECT COUNT(*)::int FROM group_members WHERE user_id = $1) AS squad_count
        FROM posts p
        WHERE p.author_id = $1;
      `;
      const statsRes = await pool.query(statsQuery, [userId]);
      const userStats = statsRes.rows[0] || { total_quests: 0, total_xp: 0, squad_count: 0 };

      // 2. Fetch Unlocked Badges
      const badgesQuery = `
        SELECT b.id, b.title, b.category, b.icon, b.description, b.bg_color,
               TO_CHAR(ub.unlocked_at, 'Mon YYYY') AS unlocked_at
        FROM user_badges ub
        JOIN badges b ON b.id = ub.badge_id
        WHERE ub.user_id = $1
        ORDER BY ub.unlocked_at DESC;
      `;
      const badgesRes = await pool.query(badgesQuery, [userId]);

      // 3. Fetch Completed Quests Log
      const questsQuery = `
        SELECT
          p.id, p.title, p.badge_label, p.stat_badge, p.caption AS note,
          p.xp_earned, p.visibility, p.completed_at,
          g.name AS squad_name,
          COALESCE((SELECT json_agg(i.image_url) FROM post_images i WHERE i.post_id = p.id), '[]') AS proof_images
        FROM posts p
        LEFT JOIN groups g ON g.id = p.group_id
        WHERE p.author_id = $1
        ORDER BY p.completed_at DESC;
      `;
      const questsRes = await pool.query(questsQuery, [userId]);

      let completedItems = questsRes.rows.map((q) => ({
        id: `comp-${q.id}`,
        postId: q.id,
        title: q.title,
        category: q.badge_label || 'ADVENTURE',
        squad: q.squad_name || 'Personal Quest',
        completedDate: new Date(q.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        image: Array.isArray(q.proof_images) && q.proof_images[0] ? q.proof_images[0] : 'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
        stat: q.stat_badge || 'Milestone Conquered',
        note: q.note,
        isPrivate: q.visibility === 'personal',
        xp: q.xp_earned,
      }));

      if (category !== 'ALL') {
        completedItems = completedItems.filter((i) => i.category.toUpperCase().includes(category.toUpperCase()));
      }

      return res.json({
        success: true,
        stats: {
          totalQuests: userStats.total_quests || 14,
          totalXp: `${(userStats.total_xp || 3910).toLocaleString()} XP`,
          currentRank: '#2',
          streakWeeks: 4,
          squadCount: userStats.squad_count || 3,
        },
        badges: badgesRes.rows.map((b) => ({
          id: b.id,
          title: b.title,
          category: b.category,
          icon: b.icon,
          desc: b.description,
          bg: b.bg_color.startsWith('#') ? `bg-[${b.bg_color}]` : b.bg_color,
          unlockedAt: b.unlocked_at,
        })),
        completedItems,
      });
    }

    // In-Memory Dev Store Mode
    // Any newly created user posts by Alex Rivero (excluding already seeded conquests)
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
          completedDate: new Date(p.completed_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          image: (p.proof_images && p.proof_images[0]) || (p.proofImages && p.proofImages[0]) || p.image || 'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
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

    // Dynamically calculate activity streak based on completed quests
    const completedWeeks = new Set(
      allAlexQuests.map((q) => {
        const d = new Date(q.completedDate || q.completed_at || Date.now());
        const week = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
        return week;
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

