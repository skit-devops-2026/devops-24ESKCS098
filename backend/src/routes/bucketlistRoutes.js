'use strict';

import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import ctrl from '../controllers/bucketlistController.js';

const router = express.Router();

// Overall stats (guest-friendly preview)
router.get('/stats', optionalAuth, ctrl.getBucketlistStats);

// Authentication barrier for private goal and squad modifications
router.use(auth);

// Personal goals
router.get('/goals', ctrl.getPersonalGoals);
router.post('/goals', ctrl.createPersonalGoal);
router.get('/goals/:id', ctrl.getPersonalGoalById);
router.put('/goals/:id', ctrl.updatePersonalGoal);
router.patch('/goals/:id/status', ctrl.updateGoalStatus);
router.delete('/goals/:id', ctrl.deletePersonalGoal);

// Squads & membership
router.get('/squads', ctrl.getSquads);
router.post('/squads', ctrl.createSquad);
router.post('/squads/join', ctrl.joinSquad);
router.post('/squads/:squadId/leave', ctrl.leaveSquad);
router.get('/squads/:squadId/members', ctrl.getSquadMembers);
router.put('/squads/:squadId', ctrl.updateSquad);

// Squad collaborative goals & member contributions
router.get('/squads/:squadId/goals', ctrl.getTeamGoals);
router.post('/squads/:squadId/goals', ctrl.createTeamGoal);
router.put('/squads/:squadId/goals/:id', ctrl.updateTeamGoal);
router.patch('/squads/:squadId/goals/:id/status', ctrl.updateTeamGoalStatus);
router.patch('/squads/:squadId/goals/:id/contribution', ctrl.updateMemberContribution);
router.delete('/squads/:squadId/goals/:id', ctrl.deleteTeamGoal);

export default router;
