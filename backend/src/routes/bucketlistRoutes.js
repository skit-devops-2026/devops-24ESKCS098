'use strict';

const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/bucketlistControllerMongo');

// ── Overall Stats (Public + Authenticated) ──────────────────────────────────
// GET    /api/bucketlist/stats              – get overall bucketlist stats
router.get('/stats', optionalAuth, ctrl.getBucketlistStats);

// All subsequent bucketlist routes require authentication
router.use(auth);

// ── Personal Goals ────────────────────────────────────────────────────────────
// GET    /api/bucketlist/goals              – list personal goals (filter by ?status=&category=)
// POST   /api/bucketlist/goals              – create personal goal
// GET    /api/bucketlist/goals/:id          – get single personal goal
// PUT    /api/bucketlist/goals/:id          – update personal goal fields
// PATCH  /api/bucketlist/goals/:id/status   – update status + progress
// DELETE /api/bucketlist/goals/:id          – delete personal goal

router.get('/goals', ctrl.getPersonalGoals);
router.post('/goals', ctrl.createPersonalGoal);
router.get('/goals/:id', ctrl.getPersonalGoalById);
router.put('/goals/:id', ctrl.updatePersonalGoal);
router.patch('/goals/:id/status', ctrl.updateGoalStatus);
router.delete('/goals/:id', ctrl.deletePersonalGoal);

// ── Squads ────────────────────────────────────────────────────────────────────
// GET    /api/bucketlist/squads                  – list user's squads
// POST   /api/bucketlist/squads                  – create a squad
// POST   /api/bucketlist/squads/join             – join a squad by join_code
// POST   /api/bucketlist/squads/:squadId/leave   – leave a squad
// GET    /api/bucketlist/squads/:squadId/members – list members in a squad
// PUT    /api/bucketlist/squads/:squadId         – update squad description/cover (admin only)

router.get('/squads', ctrl.getSquads);
router.post('/squads', ctrl.createSquad);
router.post('/squads/join', ctrl.joinSquad);
router.post('/squads/:squadId/leave', ctrl.leaveSquad);
router.get('/squads/:squadId/members', ctrl.getSquadMembers);
router.put('/squads/:squadId', ctrl.updateSquad);

// ── Team Goals ────────────────────────────────────────────────────────────────
// GET    /api/bucketlist/squads/:squadId/goals                      – list team goals
// POST   /api/bucketlist/squads/:squadId/goals                      – create team goal
// PUT    /api/bucketlist/squads/:squadId/goals/:id                  – update team goal (creator only)
// PATCH  /api/bucketlist/squads/:squadId/goals/:id/status           – update overall status (member)
// PATCH  /api/bucketlist/squads/:squadId/goals/:id/contribution     – update MY contribution (member)
// DELETE /api/bucketlist/squads/:squadId/goals/:id                  – delete team goal (creator only)

router.get('/squads/:squadId/goals', ctrl.getTeamGoals);
router.post('/squads/:squadId/goals', ctrl.createTeamGoal);
router.put('/squads/:squadId/goals/:id', ctrl.updateTeamGoal);
router.patch('/squads/:squadId/goals/:id/status', ctrl.updateTeamGoalStatus);
router.patch('/squads/:squadId/goals/:id/contribution', ctrl.updateMemberContribution);
router.delete('/squads/:squadId/goals/:id', ctrl.deleteTeamGoal);

module.exports = router;
