'use strict';

/**
 * BucketList Controller — MongoDB Edition
 *
 * Handles personal goals (groupId = null) and team goals (groupId = Group ObjectId).
 *
 * Database strategy:
 *   - Primary:  MongoDB via Mongoose (when isMongoConnected() returns true)
 *   - Fallback: In-memory dev store (development only, never in production)
 *
 * Status mapping (frontend ↔ MongoDB):
 *   'not-started'  ↔  'not_started'
 *   'in-progress'  ↔  'in_progress'
 *   'completed'    ↔  'completed'
 *
 * Visibility mapping (frontend ↔ MongoDB):
 *   'public'   ↔  'shared'
 *   'private'  ↔  'personal'
 *
 * Auth: req.user is set by authMiddleware (JWT or dev x-dev-user-id header).
 * User IDs are numeric integers from the dev system.
 * Do NOT trust any user id from the request body.
 */

const mongoose = require('mongoose');
const { isMongoConnected } = require('../config/db');
const { Goal, Group, Contribution } = require('../models/bucketlistModels');

// ── Value maps ────────────────────────────────────────────────────────────────

const STATUS_TO_DB = {
  'not-started': 'not_started',
  'in-progress': 'in_progress',
  completed: 'completed',
};

const STATUS_TO_FRONTEND = {
  not_started: 'not-started',
  in_progress: 'in-progress',
  completed: 'completed',
};

const VIS_TO_DB = {
  public: 'shared',
  private: 'personal',
  shared: 'shared',
  personal: 'personal',
};

const VIS_TO_FRONTEND = {
  shared: 'public',
  personal: 'private',
};

const ALLOWED_CATEGORIES = new Set(['ADVENTURE', 'SKILLS', 'TRAVEL', 'FITNESS', 'CAREER']);
const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const ALLOWED_PRIORITIES = new Set(['HIGH', 'MEDIUM', 'LOW']);
const ALLOWED_STATUSES_FRONTEND = new Set(['not-started', 'in-progress', 'completed']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapGoalToFrontend(doc) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: obj._id ? obj._id.toString() : obj.id,
    title: obj.title,
    description: obj.description || '',
    category: obj.category || 'ADVENTURE',
    difficulty: obj.difficulty || 'medium',
    visibility: VIS_TO_FRONTEND[obj.visibility] || 'public',
    status: STATUS_TO_FRONTEND[obj.status] || 'not-started',
    progress: obj.progress ?? 0,
    priority: obj.priority || 'HIGH',
    deadline: obj.deadline
      ? new Date(obj.deadline).toISOString().split('T')[0]
      : '',
    createdAt: obj.createdAt || obj.created_at || null,
    completedAt: obj.completedAt || obj.completed_at || null,
    ownerId: obj.ownerId ?? obj.owner_id,
    groupId: obj.groupId != null ? String(obj.groupId) : null,
    members: obj.members || null,
  };
}

function mapGroupToFrontend(doc, userId) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const membership = (obj.members || []).find((m) => m.userId === userId);
  const totalMembers = (obj.members || []).length;
  return {
    id: obj._id ? obj._id.toString() : String(obj.id),
    name: obj.name,
    description: obj.description || '',
    cover_url: obj.coverUrl || null,
    join_code: obj.joinCode,
    is_private: obj.isPrivate,
    user_role: membership ? membership.role : 'member',
    members: totalMembers,
    active_quests: obj.active_quests || 0,
  };
}

function validateRequired(title, description) {
  if (!title || !title.trim()) return 'Title is required.';
  if (title.trim().length > 200) return 'Title must be 200 characters or fewer.';
  if (description && description.length > 500)
    return 'Description must be 500 characters or fewer.';
  return null;
}

function generateJoinCode(name) {
  const base = (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'SQUD';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LQ-${base}${rand}`;
}

// ── In-memory dev store fallback ──────────────────────────────────────────────
// Used ONLY in development when MONGODB_URI is not set.
// In production isMongoConnected() will be true; if MongoDB is down, we
// return 503 errors rather than silently serving stale in-memory data.

let _inMemIdCounter = 1000;
const _inMemGoals = [
  {
    _id: '1', id: '1', ownerId: 1, groupId: null,
    title: 'Summit Mount Fuji at Sunrise',
    description: 'An epic 2-day trek to catch the dawn from the highest peak in Japan.',
    category: 'ADVENTURE', difficulty: 'hard', visibility: 'shared',
    status: 'in_progress', progress: 40, priority: 'HIGH',
    deadline: new Date('2027-07-01'), createdAt: new Date('2026-09-10'), completedAt: null,
  },
  {
    _id: '2', id: '2', ownerId: 1, groupId: null,
    title: 'Master 5 Authentic Pasta Recipes',
    description: 'Weekly cooking workshop to learn carbonara and more from scratch.',
    category: 'SKILLS', difficulty: 'medium', visibility: 'shared',
    status: 'not_started', progress: 0, priority: 'MEDIUM',
    deadline: null, createdAt: new Date('2026-10-01'), completedAt: null,
  },
  {
    _id: '3', id: '3', ownerId: 1, groupId: null,
    title: 'Road Trip Through the Amalfi Coast',
    description: '7 days, 3 friends, and an open-top vintage car.',
    category: 'TRAVEL', difficulty: 'easy', visibility: 'shared',
    status: 'completed', progress: 100, priority: 'HIGH',
    deadline: null, createdAt: new Date('2026-06-15'), completedAt: new Date('2026-07-01'),
  },
];

const _inMemGroups = [
  {
    _id: 'g1', id: 'g1',
    name: 'Trip Squad ✈️', description: 'Adventure seekers unite!',
    joinCode: 'LQ-TRIP', isPrivate: false, adminId: 1,
    members: [
      { userId: 1, role: 'admin', joinedAt: new Date('2026-09-01') },
      { userId: 2, role: 'member', joinedAt: new Date('2026-09-02') },
    ],
    createdAt: new Date('2026-09-01'),
  },
];

const _inMemContributions = [];

function inMemGoalFindById(id) {
  return _inMemGoals.find((g) => String(g._id) === String(id));
}

function inMemGroupFindById(id) {
  return _inMemGroups.find((g) => String(g._id) === String(id));
}

function requireMongo(res) {
  if (process.env.NODE_ENV === 'production') {
    res.status(503).json({
      success: false,
      message:
        'MongoDB is not connected. Set MONGODB_URI in your environment and restart the server. ' +
        'See backend/.env.example for the required variable name.',
    });
    return true;
  }
  return false;
}

// ── Overall Stats ─────────────────────────────────────────────────────────────

async function getBucketlistStats(req, res, next) {
  const userId = req.user.id;

  if (isMongoConnected()) {
    try {
      const results = await Goal.aggregate([
        { $match: { ownerId: userId, groupId: null } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            notStarted: { $sum: { $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0] } },
          },
        },
      ]);
      const s = results[0] || { total: 0, completed: 0, inProgress: 0, notStarted: 0 };
      const rate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      return res.json({ success: true, stats: { ...s, completionRate: rate } });
    } catch (err) {
      return next(err);
    }
  }

  // Dev in-memory fallback
  const items = _inMemGoals.filter((g) => g.ownerId === userId && g.groupId == null);
  const total = items.length;
  const completed = items.filter((g) => g.status === 'completed').length;
  const inProgress = items.filter((g) => g.status === 'in_progress').length;
  const notStarted = items.filter((g) => g.status === 'not_started').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return res.json({ success: true, stats: { total, completed, inProgress, notStarted, completionRate } });
}

// ── Personal Goals ─────────────────────────────────────────────────────────────

async function getPersonalGoals(req, res, next) {
  const userId = req.user.id;
  const { status, category } = req.query;

  if (isMongoConnected()) {
    try {
      const filter = { ownerId: userId, groupId: null };
      if (status && STATUS_TO_DB[status]) filter.status = STATUS_TO_DB[status];
      if (category && ALLOWED_CATEGORIES.has(category.toUpperCase()))
        filter.category = category.toUpperCase();

      const goals = await Goal.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, goals: goals.map(mapGoalToFrontend) });
    } catch (err) {
      return next(err);
    }
  }

  let items = _inMemGoals.filter((g) => g.ownerId === userId && g.groupId == null);
  if (status && STATUS_TO_DB[status]) items = items.filter((g) => g.status === STATUS_TO_DB[status]);
  if (category && ALLOWED_CATEGORIES.has(category.toUpperCase()))
    items = items.filter((g) => g.category === category.toUpperCase());
  return res.json({ success: true, goals: items.map(mapGoalToFrontend) });
}

async function createPersonalGoal(req, res, next) {
  const userId = req.user.id;
  const { title, description, category, difficulty, visibility, deadline, priority } = req.body;

  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = ALLOWED_CATEGORIES.has((category || '').toUpperCase()) ? category.toUpperCase() : 'ADVENTURE';
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbVisibility = VIS_TO_DB[visibility] || 'shared';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline ? new Date(deadline) : null;

  if (isMongoConnected()) {
    try {
      const goal = await Goal.create({
        ownerId: userId,
        groupId: null,
        title: title.trim(),
        description: (description || '').trim(),
        category: dbCategory,
        difficulty: dbDifficulty,
        visibility: dbVisibility,
        status: 'not_started',
        progress: 0,
        priority: dbPriority,
        deadline: dbDeadline,
      });
      return res.status(201).json({ success: true, goal: mapGoalToFrontend(goal) });
    } catch (err) {
      return next(err);
    }
  }

  _inMemIdCounter += 1;
  const newGoal = {
    _id: String(_inMemIdCounter), id: String(_inMemIdCounter),
    ownerId: userId, groupId: null,
    title: title.trim(), description: (description || '').trim(),
    category: dbCategory, difficulty: dbDifficulty, visibility: dbVisibility,
    status: 'not_started', progress: 0, priority: dbPriority,
    deadline: dbDeadline, createdAt: new Date(), completedAt: null,
  };
  _inMemGoals.push(newGoal);
  return res.status(201).json({ success: true, goal: mapGoalToFrontend(newGoal) });
}

async function getPersonalGoalById(req, res, next) {
  const userId = req.user.id;
  const { id } = req.params;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid goal ID.' });
      }
      const goal = await Goal.findOne({ _id: id, ownerId: userId });
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
      return res.json({ success: true, goal: mapGoalToFrontend(goal) });
    } catch (err) {
      return next(err);
    }
  }

  const goal = inMemGoalFindById(id);
  if (!goal || goal.ownerId !== userId) {
    return res.status(404).json({ success: false, message: 'Goal not found.' });
  }
  return res.json({ success: true, goal: mapGoalToFrontend(goal) });
}

async function updatePersonalGoal(req, res, next) {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, description, category, difficulty, visibility, deadline, priority } = req.body;

  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = ALLOWED_CATEGORIES.has((category || '').toUpperCase()) ? category.toUpperCase() : 'ADVENTURE';
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbVisibility = VIS_TO_DB[visibility] || 'shared';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline ? new Date(deadline) : null;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid goal ID.' });
      }
      const goal = await Goal.findOneAndUpdate(
        { _id: id, ownerId: userId, groupId: null },
        {
          $set: {
            title: title.trim(),
            description: (description || '').trim(),
            category: dbCategory,
            difficulty: dbDifficulty,
            visibility: dbVisibility,
            priority: dbPriority,
            deadline: dbDeadline,
          },
        },
        { returnDocument: 'after' }
      );
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
      return res.json({ success: true, goal: mapGoalToFrontend(goal) });
    } catch (err) {
      return next(err);
    }
  }

  const idx = _inMemGoals.findIndex((g) => String(g._id) === String(id) && g.ownerId === userId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  Object.assign(_inMemGoals[idx], {
    title: title.trim(), description: (description || '').trim(),
    category: dbCategory, difficulty: dbDifficulty, visibility: dbVisibility,
    priority: dbPriority, deadline: dbDeadline,
  });
  return res.json({ success: true, goal: mapGoalToFrontend(_inMemGoals[idx]) });
}

async function updateGoalStatus(req, res, next) {
  const userId = req.user.id;
  const { id } = req.params;
  const { status, progress } = req.body;

  if (!status) return res.status(400).json({ success: false, message: 'status is required.' });
  const dbStatus = STATUS_TO_DB[status];
  if (!dbStatus) {
    return res.status(400).json({
      success: false,
      message: 'status must be one of: not-started, in-progress, completed',
    });
  }

  let dbProgress =
    dbStatus === 'completed' ? 100 : dbStatus === 'not_started' ? 0 : progress ?? null;
  if (dbProgress !== null) dbProgress = Math.max(0, Math.min(100, Number(dbProgress) || 0));

  const updateData = { status: dbStatus };
  if (dbProgress !== null) updateData.progress = dbProgress;
  if (dbStatus === 'completed') updateData.completedAt = new Date();

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid goal ID.' });
      }
      const goal = await Goal.findOneAndUpdate(
        { _id: id, ownerId: userId },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
      return res.json({ success: true, goal: mapGoalToFrontend(goal) });
    } catch (err) {
      return next(err);
    }
  }

  const idx = _inMemGoals.findIndex((g) => String(g._id) === String(id) && g.ownerId === userId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  Object.assign(_inMemGoals[idx], updateData);
  return res.json({ success: true, goal: mapGoalToFrontend(_inMemGoals[idx]) });
}

async function deletePersonalGoal(req, res, next) {
  const userId = req.user.id;
  const { id } = req.params;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid goal ID.' });
      }
      const result = await Goal.deleteOne({ _id: id, ownerId: userId, groupId: null });
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: 'Goal not found.' });
      }
      return res.json({ success: true, message: 'Goal deleted.' });
    } catch (err) {
      return next(err);
    }
  }

  const idx = _inMemGoals.findIndex((g) => String(g._id) === String(id) && g.ownerId === userId && g.groupId == null);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  _inMemGoals.splice(idx, 1);
  return res.json({ success: true, message: 'Goal deleted.' });
}

// ── Squads ─────────────────────────────────────────────────────────────────────

async function getSquads(req, res, next) {
  const userId = req.user.id;

  if (isMongoConnected()) {
    try {
      const groups = await Group.find({ 'members.userId': userId });

      // Get active quest counts per group
      const groupIds = groups.map((g) => g._id);
      const questCounts = await Goal.aggregate([
        { $match: { groupId: { $in: groupIds.map(String) }, status: { $in: ['not_started', 'in_progress'] } } },
        { $group: { _id: '$groupId', count: { $sum: 1 } } },
      ]);
      const questMap = Object.fromEntries(questCounts.map((q) => [String(q._id), q.count]));

      const squads = groups.map((g) => ({
        ...mapGroupToFrontend(g, userId),
        active_quests: questMap[String(g._id)] || 0,
      }));
      return res.json({ success: true, squads });
    } catch (err) {
      return next(err);
    }
  }

  const squads = _inMemGroups
    .filter((g) => (g.members || []).some((m) => m.userId === userId))
    .map((g) => mapGroupToFrontend(g, userId));
  return res.json({ success: true, squads });
}

async function createSquad(req, res, next) {
  const userId = req.user.id;
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Squad name is required.' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Name must be 100 chars or fewer.' });
  }

  // Generate a unique join code (retry on collision)
  let joinCode;
  if (isMongoConnected()) {
    try {
      let attempts = 0;
      do {
        joinCode = generateJoinCode(name);
        const exists = await Group.findOne({ joinCode });
        if (!exists) break;
        attempts++;
      } while (attempts < 5);

      const group = await Group.create({
        name: name.trim(),
        description: (description || '').trim(),
        joinCode,
        isPrivate: false,
        adminId: userId,
        members: [{ userId, role: 'admin', joinedAt: new Date() }],
      });

      return res.status(201).json({ success: true, squad: mapGroupToFrontend(group, userId) });
    } catch (err) {
      return next(err);
    }
  }

  joinCode = generateJoinCode(name);
  const newGroup = {
    _id: `g${_inMemIdCounter++}`, id: `g${_inMemIdCounter}`,
    name: name.trim(), description: (description || '').trim(),
    joinCode, isPrivate: false, adminId: userId,
    members: [{ userId, role: 'admin', joinedAt: new Date() }],
    createdAt: new Date(),
  };
  _inMemGroups.push(newGroup);
  return res.status(201).json({ success: true, squad: mapGroupToFrontend(newGroup, userId) });
}

async function joinSquad(req, res, next) {
  const userId = req.user.id;
  const { code, joinCode } = req.body;
  const rawCode = ((code || joinCode || '')).trim().toUpperCase();

  if (!rawCode) {
    return res.status(400).json({ success: false, message: 'Join code is required.' });
  }

  if (isMongoConnected()) {
    try {
      const group = await Group.findOne({ joinCode: rawCode });
      if (!group) {
        return res.status(404).json({ success: false, message: 'Invalid squad join code.' });
      }

      const alreadyMember = group.members.some((m) => m.userId === userId);
      if (alreadyMember) {
        return res.json({
          success: true,
          message: 'Already a member of this squad.',
          squad: mapGroupToFrontend(group, userId),
        });
      }

      group.members.push({ userId, role: 'member', joinedAt: new Date() });
      await group.save();

      return res.status(200).json({
        success: true,
        message: `Successfully joined ${group.name}!`,
        squad: mapGroupToFrontend(group, userId),
      });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find((g) => (g.joinCode || '').toUpperCase() === rawCode);
  if (!group) return res.status(404).json({ success: false, message: 'Invalid squad join code.' });

  const already = (group.members || []).some((m) => m.userId === userId);
  if (already) {
    return res.json({
      success: true, message: 'Already a member of this squad.',
      squad: mapGroupToFrontend(group, userId),
    });
  }
  group.members.push({ userId, role: 'member', joinedAt: new Date() });
  return res.status(200).json({
    success: true,
    message: `Successfully joined ${group.name}!`,
    squad: mapGroupToFrontend(group, userId),
  });
}

async function leaveSquad(req, res, next) {
  const userId = req.user.id;
  const { squadId } = req.params;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(squadId)) {
        return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
      }
      const group = await Group.findById(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      const memberIdx = group.members.findIndex((m) => m.userId === userId);
      if (memberIdx === -1) {
        return res.status(404).json({ success: false, message: 'Not a member of this squad.' });
      }

      // Prevent admin from leaving without transferring ownership
      const member = group.members[memberIdx];
      if (member.role === 'admin') {
        const otherMembers = group.members.filter((m) => m.userId !== userId);
        if (otherMembers.length > 0) {
          // Transfer ownership to oldest other member
          const newAdmin = otherMembers[0];
          const newAdminIdx = group.members.findIndex((m) => m.userId === newAdmin.userId);
          group.members[newAdminIdx].role = 'admin';
          group.adminId = newAdmin.userId;
        }
        // If no other members, allow leaving (group will have no admin)
      }

      group.members.splice(memberIdx, 1);
      await group.save();
      return res.json({ success: true, message: 'Successfully left the squad.' });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find((g) => String(g._id) === String(squadId));
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const idx = (group.members || []).findIndex((m) => m.userId === userId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not a member.' });
  group.members.splice(idx, 1);
  return res.json({ success: true, message: 'Successfully left the squad.' });
}

async function getSquadMembers(req, res, next) {
  const userId = req.user.id;
  const { squadId } = req.params;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(squadId)) {
        return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
      }
      const group = await Group.findById(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      const isMember = group.members.some((m) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const members = group.members.map((m) => ({
        id: m.userId,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        // name/avatar would come from a users collection (not yet in MongoDB)
        // For now we return the userId and role; the frontend can enrich with user data
        name: m.userId === 1 ? 'Alex Rivero (You)' : `User ${m.userId}`,
        avatar_url: null,
        xp_contributed: 0,
      }));

      return res.json({ success: true, members });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find((g) => String(g._id) === String(squadId));
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const isMember = (group.members || []).some((m) => m.userId === userId);
  if (!isMember) return res.status(403).json({ success: false, message: 'Not a member.' });

  const members = (group.members || []).map((m) => ({
    id: m.userId, userId: m.userId, role: m.role, joinedAt: m.joinedAt,
    name: m.userId === 1 ? 'Alex Rivero' : `User ${m.userId}`,
    avatar_url: null, xp_contributed: 0,
  }));
  return res.json({ success: true, members });
}

async function updateSquad(req, res, next) {
  const userId = req.user.id;
  const { squadId } = req.params;
  const { description, coverUrl, name } = req.body;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(squadId)) {
        return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
      }
      const group = await Group.findById(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      const membership = group.members.find((m) => m.userId === userId);
      if (!membership || membership.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only squad admins can edit squad details.' });
      }

      if (name !== undefined) group.name = name.trim();
      if (description !== undefined) group.description = description;
      if (coverUrl !== undefined) group.coverUrl = coverUrl;
      await group.save();

      return res.json({ success: true, squad: mapGroupToFrontend(group, userId) });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find((g) => String(g._id) === String(squadId));
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const membership = (group.members || []).find((m) => m.userId === userId);
  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only squad admins can edit squad details.' });
  }
  if (name !== undefined) group.name = name;
  if (description !== undefined) group.description = description;
  if (coverUrl !== undefined) group.coverUrl = coverUrl;
  return res.json({ success: true, squad: mapGroupToFrontend(group, userId) });
}

// ── Team Goals ─────────────────────────────────────────────────────────────────

async function getTeamGoals(req, res, next) {
  const userId = req.user.id;
  const { squadId } = req.params;
  const { status, category } = req.query;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(squadId)) {
        return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
      }

      // Verify membership
      const group = await Group.findById(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
      const isMember = group.members.some((m) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const filter = { groupId: squadId };
      if (status && STATUS_TO_DB[status]) filter.status = STATUS_TO_DB[status];
      if (category && ALLOWED_CATEGORIES.has(category.toUpperCase()))
        filter.category = category.toUpperCase();

      const goals = await Goal.find(filter).sort({ createdAt: -1 });

      // Get contributions for each goal
      const goalIds = goals.map((g) => g._id);
      const contributions = await Contribution.find({ goalId: { $in: goalIds } });

      // Build per-goal contribution maps
      const contribByGoal = {};
      for (const c of contributions) {
        const key = String(c.goalId);
        if (!contribByGoal[key]) contribByGoal[key] = [];
        contribByGoal[key].push(c);
      }

      const squadMembers = group.members.map((m) => ({
        id: m.userId,
        userId: m.userId,
        role: m.role,
        name: m.userId === 1 ? 'Alex Rivero' : `User ${m.userId}`,
        avatar_url: null,
      }));

      const mapped = goals.map((g) => {
        const contribs = contribByGoal[String(g._id)] || [];
        // Calculate overall progress from contributions (average if any, else goal progress)
        let overallProgress = g.progress;
        if (contribs.length > 0) {
          overallProgress = Math.round(
            contribs.reduce((sum, c) => sum + c.progress, 0) / squadMembers.length
          );
        }
        return {
          ...mapGoalToFrontend(g),
          members: squadMembers,
          contributions: contribs.map((c) => ({
            userId: c.userId,
            progress: c.progress,
            note: c.note,
            updatedAt: c.updatedAt,
          })),
          overallProgress,
        };
      });

      return res.json({ success: true, goals: mapped });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const group = _inMemGroups.find((g) => String(g._id) === String(squadId));
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const isMember = (group.members || []).some((m) => m.userId === userId);
  if (!isMember) return res.status(403).json({ success: false, message: 'Not a member.' });

  let items = _inMemGoals.filter((g) => String(g.groupId) === String(squadId));
  if (status && STATUS_TO_DB[status]) items = items.filter((g) => g.status === STATUS_TO_DB[status]);
  if (category && ALLOWED_CATEGORIES.has(category.toUpperCase()))
    items = items.filter((g) => g.category === category.toUpperCase());

  const squadMembers = (group.members || []).map((m) => ({
    id: m.userId, userId: m.userId, role: m.role,
    name: m.userId === 1 ? 'Alex Rivero' : `User ${m.userId}`, avatar_url: null,
  }));
  return res.json({
    success: true,
    goals: items.map((g) => ({ ...mapGoalToFrontend(g), members: squadMembers, contributions: [], overallProgress: g.progress })),
  });
}

async function createTeamGoal(req, res, next) {
  const userId = req.user.id;
  const { squadId } = req.params;
  const { title, description, category, difficulty, deadline, priority } = req.body;

  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = ALLOWED_CATEGORIES.has((category || '').toUpperCase()) ? category.toUpperCase() : 'ADVENTURE';
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline ? new Date(deadline) : null;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(squadId)) {
        return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
      }

      // Verify membership
      const group = await Group.findById(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
      const isMember = group.members.some((m) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const goal = await Goal.create({
        ownerId: userId,
        groupId: squadId, // string ObjectId
        title: title.trim(),
        description: (description || '').trim(),
        category: dbCategory,
        difficulty: dbDifficulty,
        visibility: 'shared',
        status: 'not_started',
        progress: 0,
        priority: dbPriority,
        deadline: dbDeadline,
      });

      return res.status(201).json({ success: true, goal: mapGoalToFrontend(goal) });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const group = _inMemGroups.find((g) => String(g._id) === String(squadId));
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const isMember = (group.members || []).some((m) => m.userId === userId);
  if (!isMember) return res.status(403).json({ success: false, message: 'Not a member.' });

  _inMemIdCounter += 1;
  const newGoal = {
    _id: String(_inMemIdCounter), id: String(_inMemIdCounter),
    ownerId: userId, groupId: String(squadId),
    title: title.trim(), description: (description || '').trim(),
    category: dbCategory, difficulty: dbDifficulty, visibility: 'shared',
    status: 'not_started', progress: 0, priority: dbPriority,
    deadline: dbDeadline, createdAt: new Date(), completedAt: null,
  };
  _inMemGoals.push(newGoal);
  return res.status(201).json({ success: true, goal: mapGoalToFrontend(newGoal) });
}

async function updateTeamGoal(req, res, next) {
  const userId = req.user.id;
  const { squadId, id } = req.params;
  const { title, description, category, difficulty, deadline, priority } = req.body;

  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = ALLOWED_CATEGORIES.has((category || '').toUpperCase()) ? category.toUpperCase() : 'ADVENTURE';
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline ? new Date(deadline) : null;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(squadId) || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID.' });
      }

      // Only creator can edit the goal (goal-level); all members can update status
      const goal = await Goal.findOneAndUpdate(
        { _id: id, groupId: squadId, ownerId: userId },
        {
          $set: {
            title: title.trim(), description: (description || '').trim(),
            category: dbCategory, difficulty: dbDifficulty, priority: dbPriority, deadline: dbDeadline,
          },
        },
        { returnDocument: 'after' }
      );
      if (!goal) {
        return res.status(404).json({ success: false, message: 'Goal not found or not authorized.' });
      }
      return res.json({ success: true, goal: mapGoalToFrontend(goal) });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find((g) => String(g._id) === String(squadId));
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const isMember = (group.members || []).some((m) => m.userId === userId);
  if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this squad.' });

  const idx = _inMemGoals.findIndex((g) => String(g._id) === String(id) && String(g.groupId) === String(squadId) && g.ownerId === userId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found or not authorized.' });
  Object.assign(_inMemGoals[idx], {
    title: title.trim(), description: (description || '').trim(),
    category: dbCategory, difficulty: dbDifficulty, priority: dbPriority, deadline: dbDeadline,
  });
  return res.json({ success: true, goal: mapGoalToFrontend(_inMemGoals[idx]) });
}

async function updateTeamGoalStatus(req, res, next) {
  const userId = req.user.id;
  const { squadId, id } = req.params;
  const { status, progress } = req.body;

  const dbStatus = STATUS_TO_DB[status];
  if (!dbStatus) {
    return res.status(400).json({ success: false, message: 'Invalid status value. Use: not-started, in-progress, completed' });
  }

  let dbProgress = dbStatus === 'completed' ? 100 : dbStatus === 'not_started' ? 0 : progress ?? null;
  if (dbProgress !== null) dbProgress = Math.max(0, Math.min(100, Number(dbProgress) || 0));

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(squadId) || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID.' });
      }

      // Verify membership
      const group = await Group.findById(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
      const isMember = group.members.some((m) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      // Record this member's individual contribution
      const contribUpdate = {
        goalId: id,
        groupId: squadId,
        userId,
        progress: dbProgress !== null ? dbProgress : 0,
        updatedAt: new Date(),
      };
      await Contribution.findOneAndUpdate(
        { goalId: id, userId },
        { $set: contribUpdate },
        { upsert: true, returnDocument: 'after' }
      );

      // Recalculate overall goal progress from all contributions
      const allContribs = await Contribution.find({ goalId: id });
      const memberCount = group.members.length;
      const overallProgress = memberCount > 0
        ? Math.round(allContribs.reduce((s, c) => s + c.progress, 0) / memberCount)
        : dbProgress || 0;

      const updateData = {
        status: dbStatus,
        progress: overallProgress,
      };
      if (dbStatus === 'completed') updateData.completedAt = new Date();

      const goal = await Goal.findOneAndUpdate(
        { _id: id, groupId: squadId },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });

      return res.json({ success: true, goal: mapGoalToFrontend(goal) });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find((g) => String(g._id) === String(squadId));
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const isMember = (group.members || []).some((m) => m.userId === userId);
  if (!isMember) {
    return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
  }

  const idx = _inMemGoals.findIndex((g) => String(g._id) === String(id) && String(g.groupId) === String(squadId));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  const updateData = { status: dbStatus };
  if (dbProgress !== null) updateData.progress = dbProgress;
  if (dbStatus === 'completed') updateData.completedAt = new Date();
  Object.assign(_inMemGoals[idx], updateData);
  return res.json({ success: true, goal: mapGoalToFrontend(_inMemGoals[idx]) });
}

async function deleteTeamGoal(req, res, next) {
  const userId = req.user.id;
  const { squadId, id } = req.params;

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(squadId) || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID.' });
      }

      // Only creator can delete their team goal
      const result = await Goal.deleteOne({ _id: id, groupId: squadId, ownerId: userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: 'Goal not found or not authorized.' });
      }
      // Clean up contributions
      await Contribution.deleteMany({ goalId: id });
      return res.json({ success: true, message: 'Team goal deleted.' });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find((g) => String(g._id) === String(squadId));
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const isMember = (group.members || []).some((m) => m.userId === userId);
  if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this squad.' });

  const idx = _inMemGoals.findIndex(
    (g) => String(g._id) === String(id) && String(g.groupId) === String(squadId) && g.ownerId === userId
  );
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  _inMemGoals.splice(idx, 1);
  return res.json({ success: true, message: 'Team goal deleted.' });
}

// ── Member Contribution Update ─────────────────────────────────────────────────

/**
 * PATCH /api/bucketlist/squads/:squadId/goals/:id/contribution
 * Update the current user's individual contribution/progress toward a team goal.
 * This does NOT overwrite other members' contributions.
 */
async function updateMemberContribution(req, res, next) {
  const userId = req.user.id;
  const { squadId, id } = req.params;
  const { progress, note } = req.body;

  if (progress === undefined || progress === null) {
    return res.status(400).json({ success: false, message: 'progress (0-100) is required.' });
  }
  const dbProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  if (isMongoConnected()) {
    try {
      if (!mongoose.Types.ObjectId.isValid(squadId) || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID.' });
      }

      // Verify membership
      const group = await Group.findById(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
      const isMember = group.members.some((m) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      // Upsert this user's contribution — cannot overwrite others
      const contrib = await Contribution.findOneAndUpdate(
        { goalId: id, userId },
        { $set: { goalId: id, groupId: squadId, userId, progress: dbProgress, note: note || '', updatedAt: new Date() } },
        { upsert: true, returnDocument: 'after' }
      );

      // Recalculate overall goal progress
      const allContribs = await Contribution.find({ goalId: id });
      const memberCount = group.members.length;
      const overallProgress = memberCount > 0
        ? Math.round(allContribs.reduce((s, c) => s + c.progress, 0) / memberCount)
        : dbProgress;

      // Update goal progress but NOT status (status is separate)
      const goal = await Goal.findByIdAndUpdate(
        id,
        { $set: { progress: overallProgress } },
        { returnDocument: 'after' }
      );
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });

      return res.json({
        success: true,
        goal: mapGoalToFrontend(goal),
        myContribution: { progress: contrib.progress, note: contrib.note, updatedAt: contrib.updatedAt },
        overallProgress,
        allContributions: allContribs.map((c) => ({
          userId: c.userId, progress: c.progress, note: c.note, updatedAt: c.updatedAt,
        })),
      });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const group = _inMemGroups.find((g) => String(g._id) === String(squadId));
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const isMember = (group.members || []).some((m) => m.userId === userId);
  if (!isMember) {
    return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
  }
  const idx = _inMemGoals.findIndex((g) => String(g._id) === String(id) && String(g.groupId) === String(squadId));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  return res.json({ success: true, message: 'Contribution saved (dev mode)', overallProgress: dbProgress });
}

module.exports = {
  getBucketlistStats,
  getPersonalGoals,
  createPersonalGoal,
  getPersonalGoalById,
  updatePersonalGoal,
  updateGoalStatus,
  deletePersonalGoal,
  getSquads,
  createSquad,
  joinSquad,
  leaveSquad,
  getSquadMembers,
  updateSquad,
  getTeamGoals,
  createTeamGoal,
  updateTeamGoal,
  updateTeamGoalStatus,
  deleteTeamGoal,
  updateMemberContribution,
};
