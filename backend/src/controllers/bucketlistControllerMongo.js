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
const { isMongoConnected } = require('../config/mongodb');
const { Goal, Group, Contribution } = require('../models/bucketlistModels');
const User = require('../models/User');

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

function isUserGroupMember(group, userId) {
  if (!group || !group.members) return false;
  return group.members.some((m) => String(m.userId ?? m.user_id) === String(userId));
}

function isUserGroupAdmin(group, userId) {
  if (!group) return false;
  if (String(group.adminId ?? group.admin_id) === String(userId)) return true;
  if (!group.members) return false;
  return group.members.some(
    (m) => String(m.userId ?? m.user_id) === String(userId) && m.role === 'admin'
  );
}

async function findGroupByIdOrKey(squadId) {
  if (!squadId) return null;
  if (mongoose.Types.ObjectId.isValid(squadId)) {
    const g = await Group.findById(squadId);
    if (g) return g;
  }
  const numId = Number(squadId);
  const query = !isNaN(numId)
    ? { $or: [{ id: numId }, { id: String(numId) }, { _id: squadId }] }
    : { $or: [{ id: squadId }, { _id: squadId }] };
  return await Group.findOne(query);
}

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
  const membership = (obj.members || []).find((m) => String(m.userId ?? m.user_id) === String(userId));
  const totalMembers = (obj.members || []).length;
  const code = obj.joinCode || obj.join_code || '';
  return {
    id: obj._id ? obj._id.toString() : String(obj.id),
    name: obj.name,
    description: obj.description || '',
    cover_url: obj.coverUrl || obj.cover_url || null,
    join_code: code,
    joinCode: code,
    is_private: Boolean(obj.isPrivate ?? obj.is_private),
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
  const userId = req.user?.id;

  if (isMongoConnected()) {
    try {
      const matchCriteria = userId ? { ownerId: userId, groupId: null } : { groupId: null };
      const results = await Goal.aggregate([
        { $match: matchCriteria },
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
  const items = userId
    ? _inMemGoals.filter((g) => g.ownerId === userId && g.groupId == null)
    : _inMemGoals.filter((g) => g.groupId == null);
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
      const numUserId = Number(userId);
      const orConditions = [
        { 'members.userId': userId },
        { 'members.user_id': userId },
        { adminId: userId },
        { admin_id: userId },
      ];
      if (!isNaN(numUserId)) {
        orConditions.push(
          { 'members.userId': numUserId },
          { 'members.user_id': numUserId },
          { adminId: numUserId },
          { admin_id: numUserId }
        );
      }
      const groups = await Group.find({ $or: orConditions });

      // Get active quest counts per group
      const groupKeySets = groups.flatMap((g) => [
        String(g._id),
        ...(g.id !== undefined && g.id !== null ? [g.id, String(g.id)] : []),
      ]);

      const questCounts = await Goal.aggregate([
        {
          $match: {
            groupId: { $in: groupKeySets },
            status: { $in: ['not_started', 'in_progress'] },
          },
        },
        { $group: { _id: '$groupId', count: { $sum: 1 } } },
      ]);
      const questMap = Object.fromEntries(
        questCounts.map((q) => [String(q._id), q.count])
      );

      const squads = groups.map((g) => {
        const key = String(g._id);
        const altKey = g.id !== undefined && g.id !== null ? String(g.id) : null;
        const count = (questMap[key] || 0) + (altKey && questMap[altKey] ? questMap[altKey] : 0);
        return {
          ...mapGroupToFrontend(g, userId),
          active_quests: count,
        };
      });
      return res.json({ success: true, squads });
    } catch (err) {
      return next(err);
    }
  }

  const squads = _inMemGroups
    .filter(
      (g) =>
        (g.members || []).some((m) => String(m.userId ?? m.user_id) === String(userId)) ||
        String(g.adminId ?? g.admin_id) === String(userId)
    )
    .map((g) => mapGroupToFrontend(g, userId));
  return res.json({ success: true, squads });
}

async function createSquad(req, res, next) {
  const userId = req.user.id;
  const { name, description, coverUrl, isPrivate } = req.body;
  const requestedCode = (req.body.joinCode || req.body.join_code || '').trim().toUpperCase();

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Squad name is required.' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Name must be 100 chars or fewer.' });
  }

  const squadIsPrivate = isPrivate !== undefined ? Boolean(isPrivate) : true;
  let joinCode;
  if (isMongoConnected()) {
    try {
      if (requestedCode) {
        const escaped = requestedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exists = await Group.findOne({
          $or: [
            { joinCode: requestedCode },
            { join_code: requestedCode },
            { joinCode: new RegExp(`^${escaped}$`, 'i') },
            { join_code: new RegExp(`^${escaped}$`, 'i') },
          ],
        });
        if (!exists) {
          joinCode = requestedCode;
        }
      }

      if (!joinCode) {
        let attempts = 0;
        do {
          joinCode = generateJoinCode(name);
          const exists = await Group.findOne({
            $or: [{ joinCode }, { join_code: joinCode }],
          });
          if (!exists) break;
          attempts++;
        } while (attempts < 5);
      }

      const numUserId = Number(userId);
      const finalUserId = !isNaN(numUserId) ? numUserId : userId;

      const group = await Group.create({
        name: name.trim(),
        description: (description || '').trim(),
        coverUrl: coverUrl || null,
        cover_url: coverUrl || null,
        joinCode,
        join_code: joinCode,
        isPrivate: squadIsPrivate,
        is_private: squadIsPrivate,
        adminId: finalUserId,
        admin_id: finalUserId,
        members: [
          {
            userId: finalUserId,
            user_id: finalUserId,
            role: 'admin',
            joinedAt: new Date(),
            joined_at: new Date(),
          },
        ],
      });

      return res.status(201).json({ success: true, squad: mapGroupToFrontend(group, userId) });
    } catch (err) {
      return next(err);
    }
  }

  if (
    requestedCode &&
    !_inMemGroups.some((g) => (g.joinCode || g.join_code || '').toUpperCase() === requestedCode)
  ) {
    joinCode = requestedCode;
  } else {
    joinCode = generateJoinCode(name);
  }

  const numUserId = Number(userId);
  const finalUserId = !isNaN(numUserId) ? numUserId : userId;

  const newGroup = {
    _id: `g${_inMemIdCounter++}`,
    id: `g${_inMemIdCounter}`,
    name: name.trim(),
    description: (description || '').trim(),
    coverUrl: coverUrl || null,
    cover_url: coverUrl || null,
    joinCode,
    join_code: joinCode,
    isPrivate: squadIsPrivate,
    is_private: squadIsPrivate,
    adminId: finalUserId,
    admin_id: finalUserId,
    members: [
      {
        userId: finalUserId,
        user_id: finalUserId,
        role: 'admin',
        joinedAt: new Date(),
        joined_at: new Date(),
      },
    ],
    createdAt: new Date(),
  };
  _inMemGroups.push(newGroup);
  return res.status(201).json({ success: true, squad: mapGroupToFrontend(newGroup, userId) });
}

async function joinSquad(req, res, next) {
  const userId = req.user.id;
  const { code, joinCode } = req.body;
  const rawCode = (code || joinCode || '').trim();

  if (!rawCode) {
    return res.status(400).json({ success: false, message: 'Join code is required.' });
  }

  const upperCode = rawCode.toUpperCase();
  const escaped = rawCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const codeRegex = new RegExp(`^${escaped}$`, 'i');

  if (isMongoConnected()) {
    try {
      const group = await Group.findOne({
        $or: [
          { joinCode: upperCode },
          { join_code: upperCode },
          { joinCode: codeRegex },
          { join_code: codeRegex },
        ],
      });
      if (!group) {
        return res.status(404).json({ success: false, message: 'Invalid squad join code. Please check and try again.' });
      }

      const alreadyMember = isUserGroupMember(group, userId);
      if (alreadyMember) {
        return res.json({
          success: true,
          message: 'Already a member of this squad.',
          squad: mapGroupToFrontend(group, userId),
        });
      }

      const numUserId = Number(userId);
      const finalUserId = !isNaN(numUserId) ? numUserId : userId;

      group.members.push({
        userId: finalUserId,
        user_id: finalUserId,
        role: 'member',
        joinedAt: new Date(),
        joined_at: new Date(),
      });
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

  const group = _inMemGroups.find(
    (g) => (g.joinCode || g.join_code || '').toUpperCase() === upperCode
  );
  if (!group) {
    return res.status(404).json({ success: false, message: 'Invalid squad join code. Please check and try again.' });
  }

  const already = isUserGroupMember(group, userId);
  if (already) {
    return res.json({
      success: true,
      message: 'Already a member of this squad.',
      squad: mapGroupToFrontend(group, userId),
    });
  }

  const numUserId = Number(userId);
  const finalUserId = !isNaN(numUserId) ? numUserId : userId;

  group.members.push({
    userId: finalUserId,
    user_id: finalUserId,
    role: 'member',
    joinedAt: new Date(),
    joined_at: new Date(),
  });
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
      const group = await findGroupByIdOrKey(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      const memberIdx = (group.members || []).findIndex(
        (m) => (m.userId ?? m.user_id) === userId
      );
      if (memberIdx === -1) {
        return res.status(404).json({ success: false, message: 'Not a member of this squad.' });
      }

      const member = group.members[memberIdx];
      if (member.role === 'admin') {
        const otherMembers = (group.members || []).filter(
          (m) => (m.userId ?? m.user_id) !== userId
        );
        if (otherMembers.length > 0) {
          const newAdmin = otherMembers[0];
          const newAdminId = newAdmin.userId ?? newAdmin.user_id;
          const newAdminIdx = group.members.findIndex(
            (m) => (m.userId ?? m.user_id) === newAdminId
          );
          if (newAdminIdx !== -1) {
            group.members[newAdminIdx].role = 'admin';
          }
          group.adminId = newAdminId;
          group.admin_id = newAdminId;
        }
      }

      group.members.splice(memberIdx, 1);
      await group.save();
      return res.json({ success: true, message: 'Successfully left the squad.' });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find(
    (g) => String(g._id) === String(squadId) || String(g.id) === String(squadId)
  );
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  const idx = (group.members || []).findIndex(
    (m) => (m.userId ?? m.user_id) === userId
  );
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not a member.' });
  group.members.splice(idx, 1);
  return res.json({ success: true, message: 'Successfully left the squad.' });
}

async function getSquadMembers(req, res, next) {
  const userId = req.user?.id;
  const { squadId } = req.params;

  if (isMongoConnected()) {
    try {
      const group = await findGroupByIdOrKey(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      const isPrivate = Boolean(group.isPrivate ?? group.is_private);
      const isMember = isUserGroupMember(group, userId);

      if (isPrivate && !isMember) {
        return res.status(403).json({ success: false, message: 'This squad is private. Only members can view member details.' });
      }

      const memberIds = (group.members || []).map((m) => m.userId ?? m.user_id).filter((id) => id != null);
      const users = await User.find({ id: { $in: memberIds } }).lean();
      const userMap = new Map(users.map((u) => [u.id, u]));

      const members = (group.members || []).map((m) => {
        const mId = m.userId ?? m.user_id;
        const u = userMap.get(mId);
        return {
          id: mId,
          userId: mId,
          role: m.role || 'member',
          joinedAt: m.joinedAt || m.joined_at,
          name: u ? u.name : (mId === 1 ? 'Alex Rivero (You)' : `User ${mId}`),
          avatar_url: u ? u.avatar_url : null,
          xp_contributed: 0,
        };
      });

      return res.json({ success: true, members });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find(
    (g) => String(g._id) === String(squadId) || String(g.id) === String(squadId)
  );
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

  const isPrivate = Boolean(group.isPrivate ?? group.is_private);
  const isMember = (group.members || []).some((m) => (m.userId ?? m.user_id) === userId);
  if (isPrivate && !isMember) {
    return res.status(403).json({ success: false, message: 'This squad is private. Only members can view member details.' });
  }

  const members = (group.members || []).map((m) => {
    const mId = m.userId ?? m.user_id;
    return {
      id: mId,
      userId: mId,
      role: m.role || 'member',
      joinedAt: m.joinedAt || m.joined_at,
      name: mId === 1 ? 'Alex Rivero' : `User ${mId}`,
      avatar_url: null,
      xp_contributed: 0,
    };
  });
  return res.json({ success: true, members });
}

async function updateSquad(req, res, next) {
  const userId = req.user.id;
  const { squadId } = req.params;
  const { description, coverUrl, name } = req.body;

  if (isMongoConnected()) {
    try {
      const group = await findGroupByIdOrKey(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      if (!isUserGroupAdmin(group, userId)) {
        return res.status(403).json({ success: false, message: 'Only squad admins can edit squad details.' });
      }

      if (name !== undefined) group.name = name.trim();
      if (description !== undefined) group.description = description;
      if (coverUrl !== undefined) {
        group.coverUrl = coverUrl;
        group.cover_url = coverUrl;
      }
      await group.save();

      return res.json({ success: true, squad: mapGroupToFrontend(group, userId) });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find(
    (g) => String(g._id) === String(squadId) || String(g.id) === String(squadId)
  );
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  if (!isUserGroupAdmin(group, userId)) {
    return res.status(403).json({ success: false, message: 'Only squad admins can edit squad details.' });
  }
  if (name !== undefined) group.name = name;
  if (description !== undefined) group.description = description;
  if (coverUrl !== undefined) {
    group.coverUrl = coverUrl;
    group.cover_url = coverUrl;
  }
  return res.json({ success: true, squad: mapGroupToFrontend(group, userId) });
}

// ── Team Goals ─────────────────────────────────────────────────────────────────

async function getTeamGoals(req, res, next) {
  const userId = req.user?.id;
  const { squadId } = req.params;
  const { status, category } = req.query;

  if (isMongoConnected()) {
    try {
      const group = await findGroupByIdOrKey(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      const isPrivate = Boolean(group.isPrivate ?? group.is_private);
      const isMember = isUserGroupMember(group, userId);

      if (isPrivate && !isMember) {
        return res.status(403).json({ success: false, message: 'This squad is private. Only members can view team goals.' });
      }

      const targetKeys = [String(group._id)];
      if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

      const filter = { groupId: { $in: targetKeys } };
      if (status && STATUS_TO_DB[status]) filter.status = STATUS_TO_DB[status];
      if (category && ALLOWED_CATEGORIES.has(category.toUpperCase()))
        filter.category = category.toUpperCase();

      const goals = await Goal.find(filter).sort({ createdAt: -1 });

      const goalIds = goals.map((g) => g._id);
      const contributions = await Contribution.find({ goalId: { $in: goalIds } });

      const contribByGoal = {};
      for (const c of contributions) {
        const key = String(c.goalId);
        if (!contribByGoal[key]) contribByGoal[key] = [];
        contribByGoal[key].push(c);
      }

      const memberIds = (group.members || []).map((m) => m.userId ?? m.user_id).filter((id) => id != null);
      const users = await User.find({ id: { $in: memberIds } }).lean();
      const userMap = new Map(users.map((u) => [u.id, u]));

      const squadMembers = (group.members || []).map((m) => {
        const mId = m.userId ?? m.user_id;
        const u = userMap.get(mId);
        return {
          id: mId,
          userId: mId,
          role: m.role || 'member',
          name: u ? u.name : (mId === 1 ? 'Alex Rivero' : `User ${mId}`),
          avatar_url: u ? u.avatar_url : null,
        };
      });

      const mapped = goals.map((g) => {
        const contribs = contribByGoal[String(g._id)] || [];
        let overallProgress = g.progress;
        if (contribs.length > 0 && squadMembers.length > 0) {
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

  // in-memory fallback
  const group = _inMemGroups.find(
    (g) => String(g._id) === String(squadId) || String(g.id) === String(squadId)
  );
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

  const isPrivate = Boolean(group.isPrivate ?? group.is_private);
  const isMember = (group.members || []).some((m) => (m.userId ?? m.user_id) === userId);
  if (isPrivate && !isMember) {
    return res.status(403).json({ success: false, message: 'This squad is private. Only members can view team goals.' });
  }

  const targetKeys = [String(group._id)];
  if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

  let items = _inMemGoals.filter((g) => targetKeys.includes(String(g.groupId)));
  if (status && STATUS_TO_DB[status]) items = items.filter((g) => g.status === STATUS_TO_DB[status]);
  if (category && ALLOWED_CATEGORIES.has(category.toUpperCase()))
    items = items.filter((g) => g.category === category.toUpperCase());

  const squadMembers = (group.members || []).map((m) => {
    const mId = m.userId ?? m.user_id;
    return {
      id: mId,
      userId: mId,
      role: m.role || 'member',
      name: mId === 1 ? 'Alex Rivero' : `User ${mId}`,
      avatar_url: null,
    };
  });

  return res.json({
    success: true,
    goals: items.map((g) => ({
      ...mapGoalToFrontend(g),
      members: squadMembers,
      contributions: [],
      overallProgress: g.progress,
    })),
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
      const group = await findGroupByIdOrKey(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      if (!isUserGroupMember(group, userId)) {
        return res.status(403).json({ success: false, message: 'You must be a member of this squad to create team goals.' });
      }

      const canonicalGroupId = String(group._id);

      const goal = await Goal.create({
        ownerId: userId,
        groupId: canonicalGroupId,
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

  const group = _inMemGroups.find(
    (g) => String(g._id) === String(squadId) || String(g.id) === String(squadId)
  );
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  if (!isUserGroupMember(group, userId)) {
    return res.status(403).json({ success: false, message: 'You must be a member of this squad to create team goals.' });
  }

  _inMemIdCounter += 1;
  const newGoal = {
    _id: String(_inMemIdCounter), id: String(_inMemIdCounter),
    ownerId: userId, groupId: String(group._id),
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
      const group = await findGroupByIdOrKey(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      const targetKeys = [String(group._id)];
      if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

      const goal = await Goal.findOne({
        _id: mongoose.Types.ObjectId.isValid(id) ? id : null,
        groupId: { $in: targetKeys },
      });
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found in this squad.' });

      const isCreator = (goal.ownerId ?? goal.owner_id) === userId;
      const isAdmin = isUserGroupAdmin(group, userId);
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Only the creator or squad admin can edit this goal.' });
      }

      goal.title = title.trim();
      goal.description = (description || '').trim();
      goal.category = dbCategory;
      goal.difficulty = dbDifficulty;
      goal.priority = dbPriority;
      goal.deadline = dbDeadline;
      await goal.save();

      return res.json({ success: true, goal: mapGoalToFrontend(goal) });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find(
    (g) => String(g._id) === String(squadId) || String(g.id) === String(squadId)
  );
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

  const targetKeys = [String(group._id)];
  if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

  const goal = _inMemGoals.find((g) => String(g._id) === String(id) && targetKeys.includes(String(g.groupId)));
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found in this squad.' });

  const isCreator = (goal.ownerId ?? goal.owner_id) === userId;
  const isAdmin = isUserGroupAdmin(group, userId);
  if (!isCreator && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Only the creator or squad admin can edit this goal.' });
  }

  Object.assign(goal, {
    title: title.trim(), description: (description || '').trim(),
    category: dbCategory, difficulty: dbDifficulty, priority: dbPriority, deadline: dbDeadline,
  });
  return res.json({ success: true, goal: mapGoalToFrontend(goal) });
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
      const group = await findGroupByIdOrKey(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      if (!isUserGroupMember(group, userId)) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const targetKeys = [String(group._id)];
      if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

      const goal = await Goal.findOne({
        _id: mongoose.Types.ObjectId.isValid(id) ? id : null,
        groupId: { $in: targetKeys },
      });
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found in this squad.' });

      await Contribution.findOneAndUpdate(
        { goalId: goal._id, userId },
        {
          $set: {
            goalId: goal._id,
            groupId: String(group._id),
            userId,
            progress: dbProgress !== null ? dbProgress : 0,
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      const allContribs = await Contribution.find({ goalId: goal._id });
      const memberCount = (group.members || []).length;
      const overallProgress = memberCount > 0
        ? Math.round(allContribs.reduce((s, c) => s + c.progress, 0) / memberCount)
        : dbProgress || 0;

      goal.status = dbStatus;
      goal.progress = dbStatus === 'completed' ? 100 : overallProgress;
      if (dbStatus === 'completed') goal.completedAt = new Date();
      await goal.save();

      return res.json({ success: true, goal: mapGoalToFrontend(goal) });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find(
    (g) => String(g._id) === String(squadId) || String(g.id) === String(squadId)
  );
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  if (!isUserGroupMember(group, userId)) {
    return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
  }

  const targetKeys = [String(group._id)];
  if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

  const goal = _inMemGoals.find((g) => String(g._id) === String(id) && targetKeys.includes(String(g.groupId)));
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found in this squad.' });

  const updateData = { status: dbStatus };
  if (dbProgress !== null) updateData.progress = dbProgress;
  if (dbStatus === 'completed') updateData.completedAt = new Date();
  Object.assign(goal, updateData);
  return res.json({ success: true, goal: mapGoalToFrontend(goal) });
}

async function deleteTeamGoal(req, res, next) {
  const userId = req.user.id;
  const { squadId, id } = req.params;

  if (isMongoConnected()) {
    try {
      const group = await findGroupByIdOrKey(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      const targetKeys = [String(group._id)];
      if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

      const goal = await Goal.findOne({
        _id: mongoose.Types.ObjectId.isValid(id) ? id : null,
        groupId: { $in: targetKeys },
      });
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found in this squad.' });

      const isCreator = (goal.ownerId ?? goal.owner_id) === userId;
      const isAdmin = isUserGroupAdmin(group, userId);
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Only the creator or squad admin can delete this goal.' });
      }

      await Goal.deleteOne({ _id: goal._id });
      await Contribution.deleteMany({ goalId: goal._id });
      return res.json({ success: true, message: 'Team goal deleted.' });
    } catch (err) {
      return next(err);
    }
  }

  const group = _inMemGroups.find(
    (g) => String(g._id) === String(squadId) || String(g.id) === String(squadId)
  );
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

  const targetKeys = [String(group._id)];
  if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

  const goal = _inMemGoals.find((g) => String(g._id) === String(id) && targetKeys.includes(String(g.groupId)));
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found in this squad.' });

  const isCreator = (goal.ownerId ?? goal.owner_id) === userId;
  const isAdmin = isUserGroupAdmin(group, userId);
  if (!isCreator && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Only the creator or squad admin can delete this goal.' });
  }

  const idx = _inMemGoals.indexOf(goal);
  _inMemGoals.splice(idx, 1);
  return res.json({ success: true, message: 'Team goal deleted.' });
}

// ── Member Contribution Update ─────────────────────────────────────────────────

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
      const group = await findGroupByIdOrKey(squadId);
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      if (!isUserGroupMember(group, userId)) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const targetKeys = [String(group._id)];
      if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

      const goal = await Goal.findOne({
        _id: mongoose.Types.ObjectId.isValid(id) ? id : null,
        groupId: { $in: targetKeys },
      });
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found in this squad.' });

      const contrib = await Contribution.findOneAndUpdate(
        { goalId: goal._id, userId },
        {
          $set: {
            goalId: goal._id,
            groupId: String(group._id),
            userId,
            progress: dbProgress,
            note: note || '',
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      const allContribs = await Contribution.find({ goalId: goal._id });
      const memberCount = (group.members || []).length;
      const overallProgress = memberCount > 0
        ? Math.round(allContribs.reduce((s, c) => s + c.progress, 0) / memberCount)
        : dbProgress;

      goal.progress = overallProgress;
      await goal.save();

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

  const group = _inMemGroups.find(
    (g) => String(g._id) === String(squadId) || String(g.id) === String(squadId)
  );
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  if (!isUserGroupMember(group, userId)) {
    return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
  }

  const targetKeys = [String(group._id)];
  if (group.id !== undefined && group.id !== null) targetKeys.push(String(group.id));

  const goal = _inMemGoals.find((g) => String(g._id) === String(id) && targetKeys.includes(String(g.groupId)));
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found in this squad.' });

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
