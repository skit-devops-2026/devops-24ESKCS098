const { User, Group, Post } = require('../models');
const { isMongoConnected, inMemoryStore } = require('../config/db');

function getPeriodStartDate(period) {
  const now = new Date();
  if (period === 'weekly') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(0); // all-time
}

// GET /api/leaderboard - Top rankings + Current user rank
async function getLeaderboard(req, res, next) {
  try {
    const userId = req.user.id;
    const period = req.query.period || 'all-time';
    const groupId = req.query.groupId ? parseInt(req.query.groupId, 10) : null;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.search ? req.query.search.toLowerCase().trim() : '';

    // MongoDB Mode
    if (isMongoConnected()) {
      const periodStart = getPeriodStartDate(period);

      // Find user's squads
      const userGroups = await Group.find({ 'members.user_id': userId }).lean();
      let targetGroupIds = userGroups.map((g) => g.id);
      if (groupId) {
        targetGroupIds = targetGroupIds.filter((id) => id === groupId);
      }

      // Member registry: `${userId}_${groupId}`
      const memberSet = new Map();
      targetGroupIds.forEach((gid) => {
        const grp = userGroups.find((g) => g.id === gid);
        if (grp && grp.members) {
          grp.members.forEach((m) => {
            memberSet.set(`${m.user_id}_${gid}`, {
              userId: m.user_id,
              groupId: gid,
              squadName: grp.name,
            });
          });
        }
      });

      // Aggregate XP & completed quests from Post collection
      const postMatch = {
        group_id: { $in: targetGroupIds },
        completed_at: { $gte: periodStart },
      };

      const postAgg = await Post.aggregate([
        { $match: postMatch },
        {
          $group: {
            _id: { author_id: '$author_id', group_id: '$group_id' },
            xp: { $sum: '$xp_earned' },
            completedQuests: { $sum: 1 },
            firstCompleted: { $min: '$completed_at' },
          },
        },
      ]);

      const postStatsMap = new Map();
      postAgg.forEach((pa) => {
        postStatsMap.set(`${pa._id.author_id}_${pa._id.group_id}`, pa);
      });

      // Fetch user info
      const allUserIds = [...new Set([...memberSet.values()].map((m) => m.userId))];
      const users = await User.find({ id: { $in: allUserIds } }).lean();
      const userMap = new Map(users.map((u) => [u.id, u]));

      let scores = [];
      memberSet.forEach(({ userId: uid, groupId: gid, squadName }) => {
        const u = userMap.get(uid) || { name: `User ${uid}`, avatar_url: '' };
        const stat = postStatsMap.get(`${uid}_${gid}`) || { xp: 0, completedQuests: 0, firstCompleted: null };
        scores.push({
          id: uid,
          name: u.name,
          avatar_url: u.avatar_url,
          squad_name: squadName,
          xp: stat.xp,
          completed_quests: stat.completedQuests,
          first_completed: stat.firstCompleted,
        });
      });

      scores.sort((a, b) => {
        if (b.xp !== a.xp) return b.xp - a.xp;
        if (a.first_completed && b.first_completed) {
          return new Date(a.first_completed) - new Date(b.first_completed);
        }
        return 0;
      });

      let allRankings = scores.map((r, index) => {
        const rank = index + 1;
        let medal = null;
        if (rank === 1) medal = '🥇';
        else if (rank === 2) medal = '🥈';
        else if (rank === 3) medal = '🥉';

        return {
          rank,
          medal,
          name: r.name,
          squad: r.squad_name,
          xp: r.xp,
          completedQuests: r.completed_quests,
          badge: rank === 1 ? '🚀 Most Adventurous' : rank === 2 ? '⚡ First to Finish' : '🔥 Streak Titan',
          streak: `${Math.min(8, Math.max(2, r.completed_quests))}w 🔥`,
          isCurrentUser: r.id === userId,
          avatar: r.avatar_url,
        };
      });

      if (search) {
        allRankings = allRankings.filter(
          (item) => item.name.toLowerCase().includes(search) || item.squad.toLowerCase().includes(search)
        );
      }

      const topRankings = allRankings.slice(0, limit);
      const myRow = allRankings.find((r) => r.isCurrentUser) || {
        rank: 2,
        xp: 3910,
        name: 'You',
      };

      return res.json({
        success: true,
        period,
        top: topRankings,
        me: {
          rank: myRow.rank,
          xp: myRow.xp,
          name: myRow.name,
        },
      });
    }

    // In-Memory Dev Store Mode Fallback
    const isMonthly = period === 'monthly';
    const isWeekly = period === 'weekly';

    const baseScores = {
      3: {
        name: 'Elena Vance',
        xp: isWeekly ? 550 : isMonthly ? 1250 : 2250,
        quests: isWeekly ? 2 : isMonthly ? 4 : 7,
        squad: 'Trip Squad ✈️',
        badge: '🚀 Most Adventurous',
        streak: '6w 🔥',
      },
      1: {
        name: 'Alex Rivero',
        xp: isWeekly ? 450 : isMonthly ? 1150 : 1950,
        quests: isWeekly ? 2 : isMonthly ? 4 : 6,
        squad: 'Trip Squad ✈️',
        badge: '⚡ First to Finish',
        streak: '4w 🔥',
      },
      2: {
        name: 'Priya Sharma',
        xp: isWeekly ? 400 : isMonthly ? 950 : 1800,
        quests: isWeekly ? 2 : isMonthly ? 3 : 5,
        squad: 'College Gang 🎓',
        badge: '🏍️ Nomad Rider',
        streak: '5w 🔥',
      },
      4: {
        name: 'Sarah Chen',
        xp: isWeekly ? 300 : isMonthly ? 800 : 1550,
        quests: isWeekly ? 1 : isMonthly ? 3 : 5,
        squad: 'Trip Squad ✈️',
        badge: '🎨 Craft Specialist',
        streak: '3w 🔥',
      },
      5: {
        name: 'Marco Polo',
        xp: isWeekly ? 250 : isMonthly ? 700 : 1400,
        quests: isWeekly ? 1 : isMonthly ? 2 : 4,
        squad: 'Trip Squad ✈️',
        badge: '🍝 Master Chef',
        streak: '4w 🔥',
      },
      6: {
        name: 'Jordan Smith',
        xp: isWeekly ? 200 : isMonthly ? 600 : 1200,
        quests: isWeekly ? 1 : isMonthly ? 2 : 4,
        squad: 'Fitness Freaks 🏋️',
        badge: '🏃 100k Club',
        streak: '2w 🔥',
      },
      7: {
        name: 'Riya Sharma',
        xp: isWeekly ? 150 : isMonthly ? 500 : 1050,
        quests: isWeekly ? 1 : isMonthly ? 2 : 3,
        squad: 'College Gang 🎓',
        badge: '📸 Best Storyteller',
        streak: '3w 🔥',
      },
    };

    const userScores = inMemoryStore.users.map((u) => {
      const base = baseScores[u.id] || {
        name: u.name.replace(/\s*\(You\)/i, ''),
        xp: 2000,
        quests: 5,
        squad: 'Trip Squad ✈️',
        badge: '🌟 Quester',
        streak: '1w 🔥',
      };

      const newPosts = inMemoryStore.posts.filter((p) => p.author_id === u.id && p.id > 3);
      const postXp = newPosts.reduce((sum, p) => sum + (p.xp_earned || p.xp || 0), 0);

      return {
        id: u.id,
        name: base.name,
        squad: base.squad,
        xp: base.xp + postXp,
        completedQuests: base.quests + newPosts.length,
        badge: base.badge,
        streak: base.streak,
        avatar: u.avatar_url,
      };
    });

    userScores.sort((a, b) => b.xp - a.xp);

    let ranked = userScores.map((u, i) => {
      const rank = i + 1;
      let medal = null;
      if (rank === 1) medal = '🥇';
      else if (rank === 2) medal = '🥈';
      else if (rank === 3) medal = '🥉';

      return {
        rank,
        medal,
        name: u.name,
        squad: u.squad,
        xp: u.xp,
        completedQuests: u.completedQuests,
        badge: u.badge,
        streak: u.streak,
        isCurrentUser: u.id === userId,
        avatar: u.avatar,
      };
    });

    if (search) {
      ranked = ranked.filter(
        (r) => r.name.toLowerCase().includes(search) || r.squad.toLowerCase().includes(search)
      );
    }

    const top = ranked.slice(0, limit);
    const myRow = ranked.find((r) => r.isCurrentUser) || { rank: 2, xp: baseScores[1].xp, name: 'Alex Rivero' };

    res.json({
      success: true,
      period,
      top,
      me: {
        rank: myRow.rank,
        xp: myRow.xp,
        name: myRow.name,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLeaderboard,
};
