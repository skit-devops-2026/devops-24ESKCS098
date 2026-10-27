'use strict';

/**
 * Mongoose models for LifeQuest BucketList feature.
 *
 * Collections:
 *   - goals        Personal goals and team goals (group_id present for team goals)
 *   - groups       Squads / groups
 *   - group_members (embedded in Group as members array)
 *   - contributions  Per-member progress on a team goal
 *
 * Status values are stored as-is in MongoDB (no underscore mapping needed).
 * The controller maps frontend hyphenated values ↔ MongoDB values via constants.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Goal (personal + team) ────────────────────────────────────────────────────

const GoalSchema = new Schema(
  {
    ownerId: { type: Number, required: true, index: true }, // numeric user id (dev int or future ObjectId)
    groupId: { type: mongoose.Schema.Types.Mixed, default: null, index: true }, // null = personal, string/ObjectId = team
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    category: {
      type: String,
      enum: ['ADVENTURE', 'SKILLS', 'TRAVEL', 'FITNESS', 'CAREER'],
      default: 'ADVENTURE',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    visibility: {
      type: String,
      enum: ['shared', 'personal'],
      default: 'shared',
    },
    status: {
      type: String,
      // DB values (no hyphens) — mapped from frontend hyphenated values in controller
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
    },
    deadline: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'goals',
  }
);

// Indexes for common query patterns
GoalSchema.index({ ownerId: 1, groupId: 1, createdAt: -1 });
GoalSchema.index({ groupId: 1, status: 1 });

const Goal = mongoose.models.Goal || mongoose.model('Goal', GoalSchema);

// ── Group Member (subdocument) ────────────────────────────────────────────────

const MemberSchema = new Schema(
  {
    userId: { type: Number, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Group (Squad) ─────────────────────────────────────────────────────────────

const GroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    coverUrl: { type: String, default: null },
    joinCode: { type: String, required: true, unique: true, index: true, uppercase: true },
    isPrivate: { type: Boolean, default: false },
    adminId: { type: Number, required: true },
    members: { type: [MemberSchema], default: [] },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'groups',
  }
);

GroupSchema.index({ 'members.userId': 1 });

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);

// ── Contribution (per-member progress on a team goal) ─────────────────────────

const ContributionSchema = new Schema(
  {
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: Number, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    note: { type: String, default: '', maxlength: 300 },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'contributions',
  }
);

ContributionSchema.index({ goalId: 1, userId: 1 }, { unique: true });

const Contribution =
  mongoose.models.Contribution || mongoose.model('Contribution', ContributionSchema);

module.exports = { Goal, Group, Contribution };
