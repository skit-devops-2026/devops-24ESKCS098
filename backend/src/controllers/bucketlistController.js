/**
 * Bucketlist Controller (MongoDB Mongoose + In-Memory Fallback)
 *
 * Implements:
 *   - Overall bucketlist statistics
 *   - Personal goals CRUD
 *   - Goal status & progress transitions
 *   - Squads (groups) CRUD & membership (join/leave)
 *   - Squad/team goals CRUD
 */

'use strict';

const { Item, Group, User, Post } = require('../models');
const { isMongoConnected, inMemoryStore } = require('../config/db');

// ── Value Maps ────────────────────────────────────────────────────────────────

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

const ALLOWED_STATUSES_DB = new Set(['not_started', 'in_progress', 'completed']);
const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const ALLOWED_PRIORITIES = new Set(['HIGH', 'MEDIUM', 'LOW']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapItemToFrontend(row) {
  if (!row) return null;
  const deadlineStr = row.deadline
    ? (row.deadline instanceof Date ? row.deadline.toISOString().split('T')[0] : String(row.deadline).split('T')[0])
    : '';

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: (row.category || 'ADVENTURE').toUpperCase(),
    difficulty: row.difficulty || 'medium',
    visibility: VIS_TO_FRONTEND[row.visibility] || 'public',
    status: STATUS_TO_FRONTEND[row.status] || 'not-started',
    progress: row.progress ?? 0,
    priority: row.priority || 'HIGH',
    deadline: deadlineStr,
    createdAt: row.created_at || row.createdAt,
    completedAt: row.completed_at || row.completedAt || null,
    ownerId: row.owner_id || row.ownerId,
    groupId: row.group_id || row.groupId || null,
    members: row.members || null,
  };
}

function validateRequired(title, description) {
  if (!title || !title.trim()) return 'Title is required.';
  if (title.trim().length > 200) return 'Title must be 200 characters or fewer.';
  if (description && description.length > 500)
    return 'Description must be 500 characters or fewer.';
  return null;
}

// ── In-Memory Helpers (Fallback when MongoDB is disconnected) ─────────────────

let _inMemItems = null;
let _inMemIdCounter = 100;

let _inMemGroupMembers = [
  { group_id: 1, user_id: 1, role: 'admin' },
  { group_id: 1, user_id: 2, role: 'member' },
  { group_id: 1, user_id: 3, role: 'member' },
  { group_id: 2, user_id: 1, role: 'member' },
  { group_id: 2, user_id: 2, role: 'admin' },
  { group_id: 3, user_id: 1, role: 'admin' },
  { group_id: 3, user_id: 3, role: 'member' },
];

function getInMemItems() {
  if (!_inMemItems) {
    _inMemItems = [
      {
        id: 1,
        owner_id: 1,
        group_id: null,
        title: 'Climb Mount Kilimanjaro',
        description: 'Reach the summit of Uhuru Peak at 5,895 meters above sea level.',
        category: 'ADVENTURE',
        difficulty: 'hard',
        visibility: 'shared',
        status: 'in_progress',
        progress: 45,
        priority: 'HIGH',
        deadline: new Date('2026-11-30'),
        created_at: new Date('2026-01-10T10:00:00.000Z'),
        completed_at: null,
      },
      {
        id: 2,
        owner_id: 1,
        group_id: null,
        title: 'Learn Japanese to Conversational Fluency',
        description: 'Complete JLPT N4 level curriculum and practice weekly with native speakers.',
        category: 'SKILLS',
        difficulty: 'medium',
        visibility: 'personal',
        status: 'not_started',
        progress: 0,
        priority: 'MEDIUM',
        deadline: new Date('2026-12-31'),
        created_at: new Date('2026-03-01T12:00:00.000Z'),
        completed_at: null,
      },
      {
        id: 3,
        owner_id: 1,
        group_id: null,
        title: 'Backpack Across Southeast Asia',
        description: 'Spend six weeks traveling through Thailand, Vietnam, and Cambodia.',
        category: 'TRAVEL',
        difficulty: 'medium',
        visibility: 'shared',
        status: 'completed',
        progress: 100,
        priority: 'HIGH',
        deadline: null,
        created_at: new Date('2026-06-15T14:00:00.000Z'),
        completed_at: new Date('2026-07-01T18:00:00.000Z'),
      },
      {
        id: 4,
        owner_id: 1,
        group_id: null,
        title: 'Run a Half Marathon',
        description: 'Train for and complete a 21 km race within the next six months.',
        category: 'FITNESS',
        difficulty: 'hard',
        visibility: 'personal',
        status: 'in_progress',
        progress: 65,
        priority: 'HIGH',
        deadline: new Date('2027-02-15'),
        created_at: new Date('2026-08-20T09:00:00.000Z'),
        completed_at: null,
      },
      {
        id: 200,
        owner_id: 1,
        group_id: 1,
        title: 'Complete a Charity 5K Together',
        description: 'Sign up and run a charity 5K as a group to raise funds for local shelters.',
        category: 'FITNESS',
        difficulty: 'medium',
        visibility: 'shared',
        status: 'in_progress',
        progress: 30,
        priority: 'HIGH',
        deadline: new Date('2026-12-01'),
        created_at: new Date('2026-09-01T08:00:00.000Z'),
        completed_at: null,
      },
    ];
    _inMemIdCounter = 200;
  }
  return _inMemItems;
}

// ── Overall Stats ─────────────────────────────────────────────────────────────

/**
 * GET /api/bucketlist/stats
 * Returns aggregated statistics for the current user's bucketlist.
 */
async function getBucketlistStats(req, res, next) {
  const userId = req.user.id;

  if (isMongoConnected()) {
    try {
      const userItems = await Item.find({ owner_id: userId, group_id: null }).lean();
      const total = userItems.length;
      const completed = userItems.filter((i) => i.status === 'completed').length;
      const inProgress = userItems.filter((i) => i.status === 'in_progress').length;
      const notStarted = userItems.filter((i) => i.status === 'not_started').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return res.json({
        success: true,
        stats: {
          total,
          completed,
          inProgress,
          notStarted,
          completionRate: rate,
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const userItems = getInMemItems().filter((i) => i.owner_id === userId && i.group_id === null);
  const total = userItems.length;
  const completed = userItems.filter((i) => i.status === 'completed').length;
  const inProgress = userItems.filter((i) => i.status === 'in_progress').length;
  const notStarted = userItems.filter((i) => i.status === 'not_started').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return res.json({
    success: true,
    stats: {
      total,
      completed,
      inProgress,
      notStarted,
      completionRate: rate,
    },
  });
}

// ── Personal Goals CRUD ────────────────────────────────────────────────────────

/**
 * GET /api/bucketlist/goals
 * Returns personal goals for the authenticated user.
 */
async function getPersonalGoals(req, res, next) {
  const userId = req.user.id;
  const { status, category } = req.query;

  if (isMongoConnected()) {
    try {
      const query = { owner_id: userId, group_id: null };
      if (status && STATUS_TO_DB[status]) {
        query.status = STATUS_TO_DB[status];
      }
      if (category) {
        query.category = category.toUpperCase().trim();
      }

      const rows = await Item.find(query).sort({ created_at: -1 }).lean();
      return res.json({ success: true, goals: rows.map(mapItemToFrontend) });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  let items = getInMemItems().filter((i) => i.owner_id === userId && i.group_id === null);
  if (status && STATUS_TO_DB[status]) {
    items = items.filter((i) => i.status === STATUS_TO_DB[status]);
  }
  if (category) {
    items = items.filter((i) => (i.category || '').toUpperCase() === category.toUpperCase());
  }
  return res.json({ success: true, goals: items.map(mapItemToFrontend) });
}

/**
 * POST /api/bucketlist/goals
 * Create a new personal goal.
 */
async function createPersonalGoal(req, res, next) {
  const userId = req.user.id;
  const { title, description, category, difficulty, visibility, deadline, priority } = req.body;

  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = (category || 'ADVENTURE').toUpperCase().trim();
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbVisibility = VIS_TO_DB[visibility] || 'shared';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline ? new Date(deadline) : null;

  if (isMongoConnected()) {
    try {
      const lastItem = await Item.findOne().sort({ id: -1 });
      const newId = lastItem ? lastItem.id + 1 : 1;

      const newItem = await Item.create({
        id: newId,
        owner_id: userId,
        group_id: null,
        title: title.trim(),
        description: (description || '').trim(),
        category: dbCategory,
        difficulty: dbDifficulty,
        visibility: dbVisibility,
        status: 'not_started',
        progress: 0,
        priority: dbPriority,
        deadline: dbDeadline,
        created_at: new Date(),
        completed_at: null,
      });

      return res.status(201).json({ success: true, goal: mapItemToFrontend(newItem) });
    } catch (e) {
      return next(e);
    }
  }

  // In-memory fallback
  _inMemIdCounter += 1;
  const newItem = {
    id: _inMemIdCounter,
    owner_id: userId,
    group_id: null,
    title: title.trim(),
    description: (description || '').trim(),
    category: dbCategory,
    difficulty: dbDifficulty,
    visibility: dbVisibility,
    status: 'not_started',
    progress: 0,
    priority: dbPriority,
    deadline: dbDeadline ? new Date(dbDeadline) : null,
    created_at: new Date(),
    completed_at: null,
  };
  getInMemItems().push(newItem);
  return res.status(201).json({ success: true, goal: mapItemToFrontend(newItem) });
}

/**
 * GET /api/bucketlist/goals/:id
 * Get a single personal goal by ID (owner-only).
 */
async function getPersonalGoalById(req, res, next) {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id, 10);
  if (!Number.isInteger(goalId)) {
    return res.status(400).json({ success: false, message: 'Invalid goal ID.' });
  }

  if (isMongoConnected()) {
    try {
      const item = await Item.findOne({ id: goalId, owner_id: userId, group_id: null }).lean();
      if (!item) {
        return res.status(404).json({ success: false, message: 'Goal not found.' });
      }
      return res.json({ success: true, goal: mapItemToFrontend(item) });
    } catch (err) {
      return next(err);
    }
  }

  const item = getInMemItems().find((i) => i.id === goalId && i.owner_id === userId);
  if (!item) return res.status(404).json({ success: false, message: 'Goal not found.' });
  return res.json({ success: true, goal: mapItemToFrontend(item) });
}

/**
 * PUT /api/bucketlist/goals/:id
 * Full update of a personal goal (owner-only).
 */
async function updatePersonalGoal(req, res, next) {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id, 10);
  if (!Number.isInteger(goalId)) {
    return res.status(400).json({ success: false, message: 'Invalid goal ID.' });
  }

  const { title, description, category, difficulty, visibility, deadline, priority } = req.body;

  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = (category || 'ADVENTURE').toUpperCase().trim();
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbVisibility = VIS_TO_DB[visibility] || 'shared';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline ? new Date(deadline) : null;

  if (isMongoConnected()) {
    try {
      const updated = await Item.findOneAndUpdate(
        { id: goalId, owner_id: userId, group_id: null },
        {
          title: title.trim(),
          description: (description || '').trim(),
          category: dbCategory,
          difficulty: dbDifficulty,
          visibility: dbVisibility,
          priority: dbPriority,
          deadline: dbDeadline,
        },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Goal not found.' });
      }
      return res.json({ success: true, goal: mapItemToFrontend(updated) });
    } catch (e) {
      return next(e);
    }
  }

  const items = getInMemItems();
  const idx = items.findIndex((i) => i.id === goalId && i.owner_id === userId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  items[idx] = {
    ...items[idx],
    title: title.trim(),
    description: (description || '').trim(),
    category: dbCategory,
    difficulty: dbDifficulty,
    visibility: dbVisibility,
    priority: dbPriority,
    deadline: dbDeadline ? new Date(dbDeadline) : null,
  };
  return res.json({ success: true, goal: mapItemToFrontend(items[idx]) });
}

/**
 * PATCH /api/bucketlist/goals/:id/status
 * Update status and progress of a personal goal.
 */
async function updateGoalStatus(req, res, next) {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id, 10);
  if (!Number.isInteger(goalId)) {
    return res.status(400).json({ success: false, message: 'Invalid goal ID.' });
  }

  const { status, progress } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'status is required.' });

  const dbStatus = STATUS_TO_DB[status];
  if (!dbStatus) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: not-started, in-progress, completed`,
    });
  }

  let dbProgress = dbStatus === 'completed' ? 100 : dbStatus === 'not_started' ? 0 : (progress ?? null);
  if (dbProgress !== null) {
    dbProgress = Math.max(0, Math.min(100, Number(dbProgress) || 0));
  }
  const completedAt = dbStatus === 'completed' ? new Date() : null;

  if (isMongoConnected()) {
    try {
      const updateData = {
        status: dbStatus,
        completed_at: completedAt,
      };
      if (dbProgress !== null) {
        updateData.progress = dbProgress;
      }

      const updated = await Item.findOneAndUpdate(
        { id: goalId, owner_id: userId, group_id: null },
        updateData,
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Goal not found.' });
      }
      return res.json({ success: true, goal: mapItemToFrontend(updated) });
    } catch (e) {
      return next(e);
    }
  }

  const items = getInMemItems();
  const idx = items.findIndex((i) => i.id === goalId && i.owner_id === userId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });

  items[idx] = {
    ...items[idx],
    status: dbStatus,
    progress: dbProgress !== null ? dbProgress : items[idx].progress,
    completed_at: completedAt !== null ? completedAt : items[idx].completed_at,
  };
  return res.json({ success: true, goal: mapItemToFrontend(items[idx]) });
}

/**
 * DELETE /api/bucketlist/goals/:id
 * Delete a personal goal (owner-only).
 */
async function deletePersonalGoal(req, res, next) {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id, 10);
  if (!Number.isInteger(goalId)) {
    return res.status(400).json({ success: false, message: 'Invalid goal ID.' });
  }

  if (isMongoConnected()) {
    try {
      const deleted = await Item.findOneAndDelete({ id: goalId, owner_id: userId, group_id: null });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Goal not found.' });
      }
      return res.json({ success: true, message: 'Goal deleted.' });
    } catch (err) {
      return next(err);
    }
  }

  const items = getInMemItems();
  const idx = items.findIndex((i) => i.id === goalId && i.owner_id === userId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  items.splice(idx, 1);
  return res.json({ success: true, message: 'Goal deleted.' });
}

// ── Squads (Groups) CRUD & Membership ──────────────────────────────────────────

/**
 * GET /api/bucketlist/squads
 * Returns groups (squads) where the current user is a member.
 */
async function getSquads(req, res, next) {
  const userId = req.user.id;

  if (isMongoConnected()) {
    try {
      const groups = await Group.find({ 'members.user_id': userId }).lean();
      const squadIds = groups.map((g) => g.id);

      const activeQuestsRaw = await Item.aggregate([
        {
          $match: {
            group_id: { $in: squadIds },
            status: { $in: ['not_started', 'in_progress'] },
          },
        },
        { $group: { _id: '$group_id', count: { $sum: 1 } } },
      ]);

      const activeQuestsMap = new Map(activeQuestsRaw.map((a) => [a._id, a.count]));

      const squads = groups.map((g) => {
        const mem = (g.members || []).find((m) => m.user_id === userId);
        return {
          id: g.id,
          name: g.name,
          description: g.description,
          cover_url: g.cover_url,
          join_code: g.join_code,
          is_private: g.is_private,
          user_role: mem ? mem.role : 'member',
          members: (g.members || []).length,
          active_quests: activeQuestsMap.get(g.id) || 0,
        };
      });

      return res.json({ success: true, squads });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const userGroupIds = new Set(
    _inMemGroupMembers.filter((gm) => gm.user_id === userId).map((gm) => gm.group_id)
  );
  const squads = (inMemoryStore.groups || [])
    .filter((g) => userGroupIds.has(g.id))
    .map((g) => {
      const membership = _inMemGroupMembers.find((gm) => gm.group_id === g.id && gm.user_id === userId);
      const totalMembers = _inMemGroupMembers.filter((gm) => gm.group_id === g.id).length;
      return {
        ...g,
        user_role: membership ? membership.role : 'member',
        members: totalMembers || 1,
        active_quests: 3,
      };
    });
  return res.json({ success: true, squads });
}

/**
 * POST /api/bucketlist/squads
 * Create a new squad and make the creator admin.
 */
async function createSquad(req, res, next) {
  const userId = req.user.id;
  const { name, description, cover_url } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Squad name is required.' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Name must be 100 chars or fewer.' });
  }

  const joinCode = `LQ-${name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  if (isMongoConnected()) {
    try {
      const lastGroup = await Group.findOne().sort({ id: -1 });
      const newId = lastGroup ? lastGroup.id + 1 : 1;

      const group = await Group.create({
        id: newId,
        name: name.trim(),
        description: (description || '').trim(),
        cover_url: cover_url ? cover_url.trim() : null,
        join_code: joinCode,
        admin_id: userId,
        is_private: false,
        members: [{ user_id: userId, role: 'admin', joined_at: new Date() }],
        created_at: new Date(),
      });

      return res.status(201).json({
        success: true,
        squad: {
          id: group.id,
          name: group.name,
          description: group.description,
          cover_url: group.cover_url,
          join_code: group.join_code,
          admin_id: group.admin_id,
          is_private: group.is_private,
          user_role: 'admin',
          members: 1,
          active_quests: 0,
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const newId = (inMemoryStore.groups.length + 1) * 100;
  const newGroup = {
    id: newId,
    name: name.trim(),
    description: (description || '').trim(),
    cover_url: cover_url ? cover_url.trim() : null,
    join_code: joinCode,
    is_private: false,
    admin_id: userId,
    user_role: 'admin',
    members: 1,
    active_quests: 0,
  };
  inMemoryStore.groups.push(newGroup);
  _inMemGroupMembers.push({ group_id: newId, user_id: userId, role: 'admin' });
  return res.status(201).json({ success: true, squad: newGroup });
}

/**
 * POST /api/bucketlist/squads/join
 * Join an existing squad using its join_code.
 */
async function joinSquad(req, res, next) {
  const userId = req.user.id;
  const { code, joinCode } = req.body;
  const rawCode = (code || joinCode || '').trim();

  if (!rawCode) {
    return res.status(400).json({ success: false, message: 'Join code is required.' });
  }

  const normalizedCode = rawCode.toUpperCase();

  if (isMongoConnected()) {
    try {
      const group = await Group.findOne({ join_code: normalizedCode });
      if (!group) {
        return res.status(404).json({ success: false, message: 'Invalid squad join code.' });
      }

      const existingMember = (group.members || []).find((m) => m.user_id === userId);
      if (existingMember) {
        return res.json({
          success: true,
          message: 'Already a member of this squad.',
          squad: {
            id: group.id,
            name: group.name,
            description: group.description,
            join_code: group.join_code,
            user_role: existingMember.role,
          },
        });
      }

      group.members.push({ user_id: userId, role: 'member', joined_at: new Date() });
      await group.save();

      return res.status(200).json({
        success: true,
        message: `Successfully joined ${group.name}!`,
        squad: {
          id: group.id,
          name: group.name,
          description: group.description,
          join_code: group.join_code,
          user_role: 'member',
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const group = (inMemoryStore.groups || []).find(
    (g) => (g.join_code || '').toUpperCase() === normalizedCode
  );
  if (!group) {
    return res.status(404).json({ success: false, message: 'Invalid squad join code.' });
  }

  const already = _inMemGroupMembers.some(
    (gm) => gm.group_id === group.id && gm.user_id === userId
  );
  if (already) {
    return res.json({
      success: true,
      message: 'Already a member of this squad.',
      squad: { ...group, user_role: 'member' },
    });
  }

  _inMemGroupMembers.push({ group_id: group.id, user_id: userId, role: 'member' });
  return res.status(200).json({
    success: true,
    message: `Successfully joined ${group.name}!`,
    squad: { ...group, user_role: 'member' },
  });
}

/**
 * POST /api/bucketlist/squads/:squadId/leave
 * Leave a squad.
 */
async function leaveSquad(req, res, next) {
  const userId = req.user.id;
  const squadId = parseInt(req.params.squadId, 10);
  if (!Number.isInteger(squadId)) {
    return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
  }

  if (isMongoConnected()) {
    try {
      const group = await Group.findOne({ id: squadId, 'members.user_id': userId });
      if (!group) {
        return res.status(404).json({ success: false, message: 'Not a member of this squad.' });
      }

      group.members = group.members.filter((m) => m.user_id !== userId);
      await group.save();

      return res.json({ success: true, message: 'Successfully left the squad.' });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const idx = _inMemGroupMembers.findIndex(
    (gm) => gm.group_id === squadId && gm.user_id === userId
  );
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Not a member of this squad.' });
  }
  _inMemGroupMembers.splice(idx, 1);
  return res.json({ success: true, message: 'Successfully left the squad.' });
}

/**
 * GET /api/bucketlist/squads/:squadId/members
 * Return members of a squad.
 */
async function getSquadMembers(req, res, next) {
  const userId = req.user.id;
  const squadId = parseInt(req.params.squadId, 10);
  if (!Number.isInteger(squadId)) {
    return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
  }

  if (isMongoConnected()) {
    try {
      const group = await Group.findOne({ id: squadId }).lean();
      if (!group || !(group.members || []).some((m) => m.user_id === userId)) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const memberUserIds = group.members.map((m) => m.user_id);
      const users = await User.find({ id: { $in: memberUserIds } }).lean();
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Aggregate XP contributed by squad members
      const xpAgg = await Post.aggregate([
        { $match: { group_id: squadId } },
        { $group: { _id: '$author_id', totalXp: { $sum: '$xp_earned' } } },
      ]);
      const xpMap = new Map(xpAgg.map((x) => [x._id, x.totalXp]));

      const members = group.members.map((m) => {
        const u = userMap.get(m.user_id) || {};
        return {
          id: m.user_id,
          name: u.name || `User ${m.user_id}`,
          avatar_url: u.avatar_url || null,
          role: m.role,
          joined_at: m.joined_at,
          xp_contributed: xpMap.get(m.user_id) || 100,
        };
      });

      // Sort admin first
      members.sort((a, b) => (b.role === 'admin' ? 1 : 0) - (a.role === 'admin' ? 1 : 0));

      return res.json({ success: true, members });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const mems = _inMemGroupMembers.filter((gm) => gm.group_id === squadId);
  const members = mems.map((gm) => {
    const user = (inMemoryStore.users || []).find((u) => u.id === gm.user_id) || {
      id: gm.user_id,
      name: `User ${gm.user_id}`,
      avatar_url: null,
    };
    return {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      role: gm.role,
      joined_at: new Date('2026-09-01T00:00:00.000Z'),
      xp_contributed: 1500,
    };
  });
  return res.json({ success: true, members });
}

/**
 * PUT /api/bucketlist/squads/:squadId
 * Update squad description/cover/name (admin only).
 */
async function updateSquad(req, res, next) {
  const userId = req.user.id;
  const squadId = parseInt(req.params.squadId, 10);
  if (!Number.isInteger(squadId)) {
    return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
  }

  const { description, coverUrl, name } = req.body;

  if (isMongoConnected()) {
    try {
      const group = await Group.findOne({ id: squadId });
      if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });

      const isAdmin = (group.members || []).some((m) => m.user_id === userId && m.role === 'admin');
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Only squad admins can edit squad details.' });
      }

      if (description !== undefined) group.description = description;
      if (coverUrl !== undefined) group.cover_url = coverUrl;
      if (name !== undefined) group.name = name;
      await group.save();

      return res.json({ success: true, squad: group });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const group = (inMemoryStore.groups || []).find((g) => g.id === squadId);
  if (!group) return res.status(404).json({ success: false, message: 'Squad not found.' });
  if (description !== undefined) group.description = description;
  if (coverUrl !== undefined) group.cover_url = coverUrl;
  if (name !== undefined) group.name = name;
  return res.json({ success: true, squad: group });
}

// ── Squad Team Goals CRUD ──────────────────────────────────────────────────────

/**
 * GET /api/bucketlist/squads/:squadId/goals
 * Returns team goals for a squad the user belongs to.
 */
async function getTeamGoals(req, res, next) {
  const userId = req.user.id;
  const squadId = parseInt(req.params.squadId, 10);
  if (!Number.isInteger(squadId)) {
    return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
  }
  const { status, category } = req.query;

  if (isMongoConnected()) {
    try {
      const group = await Group.findOne({ id: squadId, 'members.user_id': userId }).lean();
      if (!group) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const query = { group_id: squadId };
      if (status && STATUS_TO_DB[status]) {
        query.status = STATUS_TO_DB[status];
      }
      if (category) {
        query.category = category.toUpperCase().trim();
      }

      const rows = await Item.find(query).sort({ created_at: -1 }).lean();

      // Attach member details
      const memberUserIds = (group.members || []).map((m) => m.user_id);
      const users = await User.find({ id: { $in: memberUserIds } }).lean();
      const userMap = new Map(users.map((u) => [u.id, u]));

      const squadMembers = (group.members || []).map((m) => {
        const u = userMap.get(m.user_id) || {};
        return { id: m.user_id, name: u.name || `User ${m.user_id}`, role: m.role, avatar_url: u.avatar_url };
      });

      return res.json({
        success: true,
        goals: rows.map((r) => ({ ...mapItemToFrontend(r), members: squadMembers })),
      });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const isMember = _inMemGroupMembers.some((gm) => gm.group_id === squadId && gm.user_id === userId);
  if (!isMember) {
    return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
  }

  const squadMembers = _inMemGroupMembers
    .filter((gm) => gm.group_id === squadId)
    .map((gm) => {
      const u = (inMemoryStore.users || []).find((user) => user.id === gm.user_id) || {
        id: gm.user_id,
        name: `User ${gm.user_id}`,
      };
      return { id: u.id, name: u.name, role: gm.role };
    });

  let items = getInMemItems().filter((i) => i.group_id === squadId);
  if (status && STATUS_TO_DB[status]) {
    items = items.filter((i) => i.status === STATUS_TO_DB[status]);
  }
  if (category) {
    items = items.filter((i) => (i.category || '').toUpperCase() === category.toUpperCase());
  }
  return res.json({
    success: true,
    goals: items.map((i) => ({ ...mapItemToFrontend(i), members: squadMembers })),
  });
}

/**
 * POST /api/bucketlist/squads/:squadId/goals
 * Create a team goal for a squad.
 */
async function createTeamGoal(req, res, next) {
  const userId = req.user.id;
  const squadId = parseInt(req.params.squadId, 10);
  if (!Number.isInteger(squadId)) {
    return res.status(400).json({ success: false, message: 'Invalid squad ID.' });
  }

  const { title, description, category, difficulty, deadline, priority } = req.body;
  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = (category || 'ADVENTURE').toUpperCase().trim();
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline ? new Date(deadline) : null;

  if (isMongoConnected()) {
    try {
      const group = await Group.findOne({ id: squadId, 'members.user_id': userId });
      if (!group) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const lastItem = await Item.findOne().sort({ id: -1 });
      const newId = lastItem ? lastItem.id + 1 : 1;

      const newTeamItem = await Item.create({
        id: newId,
        owner_id: userId,
        group_id: squadId,
        title: title.trim(),
        description: (description || '').trim(),
        category: dbCategory,
        difficulty: dbDifficulty,
        visibility: 'shared',
        status: 'not_started',
        progress: 0,
        priority: dbPriority,
        deadline: dbDeadline,
        created_at: new Date(),
        completed_at: null,
      });

      return res.status(201).json({ success: true, goal: mapItemToFrontend(newTeamItem) });
    } catch (e) {
      return next(e);
    }
  }

  // In-memory fallback
  const isMember = _inMemGroupMembers.some((gm) => gm.group_id === squadId && gm.user_id === userId);
  if (!isMember) {
    return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
  }

  _inMemIdCounter += 1;
  const newTeamItem = {
    id: _inMemIdCounter,
    owner_id: userId,
    group_id: squadId,
    title: title.trim(),
    description: (description || '').trim(),
    category: dbCategory,
    difficulty: dbDifficulty,
    visibility: 'shared',
    status: 'not_started',
    progress: 0,
    priority: dbPriority,
    deadline: dbDeadline ? new Date(dbDeadline) : null,
    created_at: new Date(),
    completed_at: null,
    members: null,
  };
  getInMemItems().push(newTeamItem);
  return res.status(201).json({ success: true, goal: mapItemToFrontend(newTeamItem) });
}

/**
 * PUT /api/bucketlist/squads/:squadId/goals/:id
 * Update a team goal (creator only).
 */
async function updateTeamGoal(req, res, next) {
  const userId = req.user.id;
  const squadId = parseInt(req.params.squadId, 10);
  const goalId = parseInt(req.params.id, 10);
  if (!Number.isInteger(squadId) || !Number.isInteger(goalId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID.' });
  }

  const { title, description, category, difficulty, deadline, priority } = req.body;
  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = (category || 'ADVENTURE').toUpperCase().trim();
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline ? new Date(deadline) : null;

  if (isMongoConnected()) {
    try {
      const updated = await Item.findOneAndUpdate(
        { id: goalId, group_id: squadId, owner_id: userId },
        {
          title: title.trim(),
          description: (description || '').trim(),
          category: dbCategory,
          difficulty: dbDifficulty,
          priority: dbPriority,
          deadline: dbDeadline,
        },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Goal not found or not authorized.' });
      }
      return res.json({ success: true, goal: mapItemToFrontend(updated) });
    } catch (e) {
      return next(e);
    }
  }

  const items = getInMemItems();
  const idx = items.findIndex((i) => i.id === goalId && i.group_id === squadId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  items[idx] = {
    ...items[idx],
    title: title.trim(),
    description: (description || '').trim(),
    category: dbCategory,
    difficulty: dbDifficulty,
    priority: dbPriority,
    deadline: dbDeadline ? new Date(dbDeadline) : null,
  };
  return res.json({ success: true, goal: mapItemToFrontend(items[idx]) });
}

/**
 * PATCH /api/bucketlist/squads/:squadId/goals/:id/status
 * Update status/progress of a team goal (any squad member).
 */
async function updateTeamGoalStatus(req, res, next) {
  const userId = req.user.id;
  const squadId = parseInt(req.params.squadId, 10);
  const goalId = parseInt(req.params.id, 10);
  if (!Number.isInteger(squadId) || !Number.isInteger(goalId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID.' });
  }

  const { status, progress } = req.body;
  const dbStatus = STATUS_TO_DB[status];
  if (!dbStatus) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }

  let dbProgress = dbStatus === 'completed' ? 100 : dbStatus === 'not_started' ? 0 : (progress ?? null);
  if (dbProgress !== null) dbProgress = Math.max(0, Math.min(100, Number(dbProgress) || 0));
  const completedAt = dbStatus === 'completed' ? new Date() : null;

  if (isMongoConnected()) {
    try {
      const group = await Group.findOne({ id: squadId, 'members.user_id': userId });
      if (!group) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const updateData = {
        status: dbStatus,
        completed_at: completedAt,
      };
      if (dbProgress !== null) {
        updateData.progress = dbProgress;
      }

      const updated = await Item.findOneAndUpdate(
        { id: goalId, group_id: squadId },
        updateData,
        { returnDocument: 'after' }
      );

      if (!updated) return res.status(404).json({ success: false, message: 'Goal not found.' });
      return res.json({ success: true, goal: mapItemToFrontend(updated) });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  const isMember = _inMemGroupMembers.some((gm) => gm.group_id === squadId && gm.user_id === userId);
  if (!isMember) {
    return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
  }

  const items = getInMemItems();
  const idx = items.findIndex((i) => i.id === goalId && i.group_id === squadId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  items[idx] = {
    ...items[idx],
    status: dbStatus,
    progress: dbProgress !== null ? dbProgress : items[idx].progress,
    completed_at: dbStatus === 'completed' ? new Date() : items[idx].completed_at,
  };
  return res.json({ success: true, goal: mapItemToFrontend(items[idx]) });
}

/**
 * DELETE /api/bucketlist/squads/:squadId/goals/:id
 * Delete a team goal (creator only).
 */
async function deleteTeamGoal(req, res, next) {
  const userId = req.user.id;
  const squadId = parseInt(req.params.squadId, 10);
  const goalId = parseInt(req.params.id, 10);
  if (!Number.isInteger(squadId) || !Number.isInteger(goalId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID.' });
  }

  if (isMongoConnected()) {
    try {
      const deleted = await Item.findOneAndDelete({ id: goalId, group_id: squadId, owner_id: userId });
      if (!deleted) return res.status(404).json({ success: false, message: 'Goal not found or not authorized.' });
      return res.json({ success: true, message: 'Team goal deleted.' });
    } catch (err) {
      return next(err);
    }
  }

  const items = getInMemItems();
  const idx = items.findIndex((i) => i.id === goalId && i.group_id === squadId && i.owner_id === userId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  items.splice(idx, 1);
  return res.json({ success: true, message: 'Team goal deleted.' });
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
};
