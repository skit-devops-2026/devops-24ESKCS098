/**
 * BucketList Controller
 *
 * Handles personal goals (items with group_id = NULL owned by req.user.id)
 * and team goals (items tied to a group the user belongs to).
 *
 * Status mapping:
 *   Frontend value   ↔  DB value
 *   'not-started'    ↔  'not_started'
 *   'in-progress'    ↔  'in_progress'
 *   'completed'      ↔  'completed'
 *
 * Visibility mapping:
 *   Frontend value   ↔  DB value
 *   'public'         ↔  'shared'
 *   'private'        ↔  'personal'
 *
 * Auth: uses req.user set by authMiddleware (JWT or dev fallback).
 * In dev mode the fallback user id is 1 (Alex Rivero) unless x-dev-user-id
 * header is sent. Do NOT trust any user id from the request body.
 */

'use strict';

const { pool, isPgConnected, inMemoryStore } = require('../config/db');

// ── value maps ────────────────────────────────────────────────────────────────

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
const ALLOWED_CATEGORIES = new Set(['ADVENTURE', 'SKILLS', 'TRAVEL', 'FITNESS', 'CAREER']);
const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const ALLOWED_PRIORITIES = new Set(['HIGH', 'MEDIUM', 'LOW']);

// ── helpers ───────────────────────────────────────────────────────────────────

function mapItemToFrontend(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'ADVENTURE',
    difficulty: row.difficulty || 'medium',
    visibility: VIS_TO_FRONTEND[row.visibility] || 'public',
    status: STATUS_TO_FRONTEND[row.status] || 'not-started',
    progress: row.progress ?? 0,
    priority: row.priority || 'HIGH',
    deadline: row.deadline ? row.deadline.toISOString().split('T')[0] : '',
    createdAt: row.created_at,
    completedAt: row.completed_at || null,
    ownerId: row.owner_id,
    groupId: row.group_id || null,
    // squad / team goal extras
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

// ── in-memory helpers (used when PostgreSQL is unavailable) ───────────────────

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
    // Pre-populate from the seed data already in inMemoryStore
    _inMemItems = [
      {
        id: 1,
        owner_id: 1,
        group_id: null,
        title: 'Summit Mount Fuji at Sunrise',
        description: 'An epic 2-day trek to catch the dawn from the highest peak in Japan.',
        category: 'ADVENTURE',
        difficulty: 'hard',
        visibility: 'shared',
        status: 'in_progress',
        progress: 40,
        priority: 'HIGH',
        deadline: new Date('2027-07-01'),
        created_at: new Date('2026-09-10T08:00:00.000Z'),
        completed_at: null,
      },
      {
        id: 2,
        owner_id: 1,
        group_id: null,
        title: 'Master 5 Authentic Pasta Recipes',
        description: 'Weekly cooking workshop to learn carbonara and more from scratch.',
        category: 'SKILLS',
        difficulty: 'medium',
        visibility: 'shared',
        status: 'not_started',
        progress: 0,
        priority: 'MEDIUM',
        deadline: null,
        created_at: new Date('2026-10-01T10:30:00.000Z'),
        completed_at: null,
      },
      {
        id: 3,
        owner_id: 1,
        group_id: null,
        title: 'Road Trip Through the Amalfi Coast',
        description: '7 days, 3 friends, and an open-top vintage car. Done last summer.',
        category: 'TRAVEL',
        difficulty: 'easy',
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

  if (isPgConnected()) {
    try {
      const sql = `
        SELECT
          COUNT(*)::int AS total_goals,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_goals,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::int AS in_progress_goals,
          COUNT(CASE WHEN status = 'not_started' THEN 1 END)::int AS not_started_goals
        FROM items
        WHERE owner_id = $1 AND group_id IS NULL
      `;
      const { rows } = await pool.query(sql, [userId]);
      const s = rows[0] || {};
      const total = s.total_goals || 0;
      const completed = s.completed_goals || 0;
      const inProgress = s.in_progress_goals || 0;
      const notStarted = s.not_started_goals || 0;
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

// ── Personal Goals ─────────────────────────────────────────────────────────────

/**
 * GET /api/bucketlist/goals
 * Returns personal goals for the authenticated user.
 * Supports ?status=in-progress&category=ADVENTURE
 */
async function getPersonalGoals(req, res, next) {
  const userId = req.user.id;
  const { status, category } = req.query;

  if (isPgConnected()) {
    try {
      const conditions = ['i.owner_id = $1', 'i.group_id IS NULL'];
      const params = [userId];
      let idx = 2;

      if (status && STATUS_TO_DB[status]) {
        conditions.push(`i.status = $${idx++}`);
        params.push(STATUS_TO_DB[status]);
      }
      if (category && ALLOWED_CATEGORIES.has(category.toUpperCase())) {
        conditions.push(`i.category = $${idx++}`);
        params.push(category.toUpperCase());
      }

      const sql = `
        SELECT i.*
        FROM items i
        WHERE ${conditions.join(' AND ')}
        ORDER BY i.created_at DESC
      `;
      const { rows } = await pool.query(sql, params);
      return res.json({ success: true, goals: rows.map(mapItemToFrontend) });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback
  let items = getInMemItems().filter(
    (i) => i.owner_id === userId && i.group_id === null
  );
  if (status && STATUS_TO_DB[status]) {
    items = items.filter((i) => i.status === STATUS_TO_DB[status]);
  }
  if (category && ALLOWED_CATEGORIES.has(category.toUpperCase())) {
    items = items.filter((i) => i.category === category.toUpperCase());
  }
  return res.json({ success: true, goals: items.map(mapItemToFrontend) });
}

/**
 * POST /api/bucketlist/goals
 * Create a new personal goal.
 */
async function createPersonalGoal(req, res, next) {
  const userId = req.user.id;
  const { title, description, category, difficulty, visibility, deadline, priority } =
    req.body;

  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = ALLOWED_CATEGORIES.has((category || '').toUpperCase())
    ? category.toUpperCase()
    : 'ADVENTURE';
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbVisibility = VIS_TO_DB[visibility] || 'shared';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline || null;

  if (isPgConnected()) {
    try {
      const sql = `
        INSERT INTO items
          (owner_id, group_id, title, description, category, difficulty,
           visibility, status, progress, priority, deadline)
        VALUES ($1, NULL, $2, $3, $4, $5, $6, 'not_started', 0, $7, $8)
        RETURNING *
      `;
      const { rows } = await pool.query(sql, [
        userId,
        title.trim(),
        (description || '').trim(),
        dbCategory,
        dbDifficulty,
        dbVisibility,
        dbPriority,
        dbDeadline,
      ]);
      return res.status(201).json({ success: true, goal: mapItemToFrontend(rows[0]) });
    } catch (err) {
      return next(err);
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

  if (isPgConnected()) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM items WHERE id = $1 AND owner_id = $2',
        [goalId, userId]
      );
      if (!rows[0]) {
        return res.status(404).json({ success: false, message: 'Goal not found.' });
      }
      return res.json({ success: true, goal: mapItemToFrontend(rows[0]) });
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

  const { title, description, category, difficulty, visibility, deadline, priority } =
    req.body;

  const err = validateRequired(title, description);
  if (err) return res.status(400).json({ success: false, message: err });

  const dbCategory = ALLOWED_CATEGORIES.has((category || '').toUpperCase())
    ? category.toUpperCase()
    : 'ADVENTURE';
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbVisibility = VIS_TO_DB[visibility] || 'shared';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline || null;

  if (isPgConnected()) {
    try {
      const sql = `
        UPDATE items
        SET title=$3, description=$4, category=$5, difficulty=$6,
            visibility=$7, priority=$8, deadline=$9
        WHERE id=$1 AND owner_id=$2 AND group_id IS NULL
        RETURNING *
      `;
      const { rows } = await pool.query(sql, [
        goalId,
        userId,
        title.trim(),
        (description || '').trim(),
        dbCategory,
        dbDifficulty,
        dbVisibility,
        dbPriority,
        dbDeadline,
      ]);
      if (!rows[0]) {
        return res.status(404).json({ success: false, message: 'Goal not found.' });
      }
      return res.json({ success: true, goal: mapItemToFrontend(rows[0]) });
    } catch (err) {
      return next(err);
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

  const now = dbStatus === 'completed' ? new Date() : null;

  if (isPgConnected()) {
    try {
      const sql = `
        UPDATE items
        SET status=$3,
            progress=COALESCE($4, progress),
            completed_at=COALESCE($5, completed_at)
        WHERE id=$1 AND owner_id=$2
        RETURNING *
      `;
      const { rows } = await pool.query(sql, [goalId, userId, dbStatus, dbProgress, now]);
      if (!rows[0]) {
        return res.status(404).json({ success: false, message: 'Goal not found.' });
      }
      return res.json({ success: true, goal: mapItemToFrontend(rows[0]) });
    } catch (err) {
      return next(err);
    }
  }

  const items = getInMemItems();
  const idx = items.findIndex((i) => i.id === goalId && i.owner_id === userId);
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
 * DELETE /api/bucketlist/goals/:id
 * Delete a personal goal (owner-only).
 */
async function deletePersonalGoal(req, res, next) {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id, 10);
  if (!Number.isInteger(goalId)) {
    return res.status(400).json({ success: false, message: 'Invalid goal ID.' });
  }

  if (isPgConnected()) {
    try {
      const { rowCount } = await pool.query(
        'DELETE FROM items WHERE id=$1 AND owner_id=$2 AND group_id IS NULL',
        [goalId, userId]
      );
      if (rowCount === 0) {
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

// ── Team Goals ─────────────────────────────────────────────────────────────────

/**
 * GET /api/bucketlist/squads
 * Returns groups (squads) where the current user is a member.
 */
async function getSquads(req, res, next) {
  const userId = req.user.id;

  if (isPgConnected()) {
    try {
      const sql = `
        SELECT g.id, g.name, g.description, g.cover_url, g.join_code, g.is_private,
               gm.role AS user_role,
               COUNT(DISTINCT gm2.user_id)::int AS members,
               COUNT(DISTINCT i.id)::int AS active_quests
        FROM groups g
        JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
        LEFT JOIN group_members gm2 ON gm2.group_id = g.id
        LEFT JOIN items i ON i.group_id = g.id AND i.status IN ('not_started','in_progress')
        GROUP BY g.id, g.name, g.description, g.cover_url, g.join_code, g.is_private, gm.role
        ORDER BY g.name
      `;
      const { rows } = await pool.query(sql, [userId]);
      return res.json({ success: true, squads: rows });
    } catch (err) {
      return next(err);
    }
  }

  // In-memory fallback: return user's squads
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
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Squad name is required.' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Name must be 100 chars or fewer.' });
  }

  // Generate a simple join code
  const joinCode = `LQ-${name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  if (isPgConnected()) {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(
          `INSERT INTO groups (name, description, join_code, admin_id, is_private)
           VALUES ($1, $2, $3, $4, false) RETURNING *`,
          [name.trim(), (description || '').trim(), joinCode, userId]
        );
        const group = rows[0];
        await client.query(
          `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin')`,
          [group.id, userId]
        );
        await client.query('COMMIT');
        return res.status(201).json({ success: true, squad: { ...group, user_role: 'admin', members: 1, active_quests: 0 } });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
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

  if (isPgConnected()) {
    try {
      const { rows: groupRows } = await pool.query(
        'SELECT * FROM groups WHERE UPPER(join_code) = $1',
        [normalizedCode]
      );
      if (!groupRows.length) {
        return res.status(404).json({ success: false, message: 'Invalid squad join code.' });
      }
      const group = groupRows[0];

      // Check if already a member
      const { rows: memRows } = await pool.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [group.id, userId]
      );
      if (memRows.length) {
        return res.json({
          success: true,
          message: 'Already a member of this squad.',
          squad: { ...group, user_role: memRows[0].role },
        });
      }

      await pool.query(
        `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')`,
        [group.id, userId]
      );

      return res.status(200).json({
        success: true,
        message: `Successfully joined ${group.name}!`,
        squad: { ...group, user_role: 'member' },
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

  if (isPgConnected()) {
    try {
      const { rowCount } = await pool.query(
        'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
        [squadId, userId]
      );
      if (rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Not a member of this squad.' });
      }
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

  if (isPgConnected()) {
    try {
      const { rows: check } = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [squadId, userId]
      );
      if (!check.length) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const sql = `
        SELECT u.id, u.name, u.avatar_url, gm.role, gm.joined_at,
               COALESCE(SUM(p.xp_earned), 0)::int AS xp_contributed
        FROM group_members gm
        JOIN users u ON u.id = gm.user_id
        LEFT JOIN posts p ON p.author_id = u.id AND p.group_id = gm.group_id
        WHERE gm.group_id = $1
        GROUP BY u.id, u.name, u.avatar_url, gm.role, gm.joined_at
        ORDER BY (gm.role = 'admin') DESC, gm.joined_at ASC
      `;
      const { rows } = await pool.query(sql, [squadId]);
      return res.json({ success: true, members: rows });
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

  if (isPgConnected()) {
    try {
      const { rows: adminCheck } = await pool.query(
        `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [squadId, userId]
      );
      if (!adminCheck.length || adminCheck[0].role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only squad admins can edit squad details.' });
      }

      const sql = `
        UPDATE groups
        SET description = COALESCE($2, description),
            cover_url = COALESCE($3, cover_url),
            name = COALESCE($4, name)
        WHERE id = $1
        RETURNING *
      `;
      const { rows } = await pool.query(sql, [squadId, description, coverUrl, name]);
      return res.json({ success: true, squad: rows[0] });
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

  if (isPgConnected()) {
    try {
      // Verify user is a member of this squad
      const { rows: memberRows } = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2',
        [squadId, userId]
      );
      if (!memberRows.length) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const conditions = ['i.group_id = $1'];
      const params = [squadId];
      let idx = 2;

      if (status && STATUS_TO_DB[status]) {
        conditions.push(`i.status = $${idx++}`);
        params.push(STATUS_TO_DB[status]);
      }
      if (category && ALLOWED_CATEGORIES.has(category.toUpperCase())) {
        conditions.push(`i.category = $${idx++}`);
        params.push(category.toUpperCase());
      }

      const sql = `
        SELECT i.*,
          (
            SELECT json_agg(json_build_object(
              'id', u.id, 'name', u.name, 'role', gm.role, 'avatar_url', u.avatar_url
            ))
            FROM group_members gm
            JOIN users u ON u.id = gm.user_id
            WHERE gm.group_id = i.group_id
          ) AS members
        FROM items i
        WHERE ${conditions.join(' AND ')}
        ORDER BY i.created_at DESC
      `;
      const { rows } = await pool.query(sql, params);
      return res.json({ success: true, goals: rows.map(mapItemToFrontend) });
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
  if (category && ALLOWED_CATEGORIES.has(category.toUpperCase())) {
    items = items.filter((i) => i.category === category.toUpperCase());
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

  const dbCategory = ALLOWED_CATEGORIES.has((category || '').toUpperCase())
    ? category.toUpperCase()
    : 'ADVENTURE';
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline || null;

  if (isPgConnected()) {
    try {
      // Verify user is a member
      const { rows: memberRows } = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2',
        [squadId, userId]
      );
      if (!memberRows.length) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }

      const sql = `
        INSERT INTO items
          (owner_id, group_id, title, description, category, difficulty,
           visibility, status, progress, priority, deadline)
        VALUES ($1, $2, $3, $4, $5, $6, 'shared', 'not_started', 0, $7, $8)
        RETURNING *
      `;
      const { rows } = await pool.query(sql, [
        userId,
        squadId,
        title.trim(),
        (description || '').trim(),
        dbCategory,
        dbDifficulty,
        dbPriority,
        dbDeadline,
      ]);
      return res.status(201).json({ success: true, goal: mapItemToFrontend(rows[0]) });
    } catch (err) {
      return next(err);
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

  const dbCategory = ALLOWED_CATEGORIES.has((category || '').toUpperCase())
    ? category.toUpperCase()
    : 'ADVENTURE';
  const dbDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
  const dbPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'HIGH';
  const dbDeadline = deadline || null;

  if (isPgConnected()) {
    try {
      const sql = `
        UPDATE items
        SET title=$4, description=$5, category=$6, difficulty=$7, priority=$8, deadline=$9
        WHERE id=$1 AND group_id=$2 AND owner_id=$3
        RETURNING *
      `;
      const { rows } = await pool.query(sql, [
        goalId, squadId, userId,
        title.trim(), (description || '').trim(),
        dbCategory, dbDifficulty, dbPriority, dbDeadline,
      ]);
      if (!rows[0]) {
        return res.status(404).json({ success: false, message: 'Goal not found or not authorized.' });
      }
      return res.json({ success: true, goal: mapItemToFrontend(rows[0]) });
    } catch (err) {
      return next(err);
    }
  }

  const items = getInMemItems();
  const idx = items.findIndex((i) => i.id === goalId && i.group_id === squadId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Goal not found.' });
  items[idx] = { ...items[idx], title: title.trim(), description: (description || '').trim(), category: dbCategory, difficulty: dbDifficulty, priority: dbPriority, deadline: dbDeadline ? new Date(dbDeadline) : null };
  return res.json({ success: true, goal: mapItemToFrontend(items[idx]) });
}

/**
 * PATCH /api/bucketlist/squads/:squadId/goals/:id/status
 * Update status/progress of a team goal (any member).
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
  const now = dbStatus === 'completed' ? new Date() : null;

  if (isPgConnected()) {
    try {
      // Verify membership
      const { rows: memberRows } = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2',
        [squadId, userId]
      );
      if (!memberRows.length) {
        return res.status(403).json({ success: false, message: 'Not a member of this squad.' });
      }
      const sql = `
        UPDATE items
        SET status=$3,
            progress=COALESCE($4, progress),
            completed_at=COALESCE($5, completed_at)
        WHERE id=$1 AND group_id=$2
        RETURNING *
      `;
      const { rows } = await pool.query(sql, [goalId, squadId, dbStatus, dbProgress, now]);
      if (!rows[0]) return res.status(404).json({ success: false, message: 'Goal not found.' });
      return res.json({ success: true, goal: mapItemToFrontend(rows[0]) });
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
  items[idx] = { ...items[idx], status: dbStatus, progress: dbProgress !== null ? dbProgress : items[idx].progress, completed_at: dbStatus === 'completed' ? new Date() : items[idx].completed_at };
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

  if (isPgConnected()) {
    try {
      const { rowCount } = await pool.query(
        'DELETE FROM items WHERE id=$1 AND group_id=$2 AND owner_id=$3',
        [goalId, squadId, userId]
      );
      if (rowCount === 0) return res.status(404).json({ success: false, message: 'Goal not found or not authorized.' });
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
