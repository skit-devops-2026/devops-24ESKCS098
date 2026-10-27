const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    owner_id: { type: Number, required: true, index: true },
    group_id: { type: Number, default: null, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'ADVENTURE', uppercase: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    visibility: { type: String, enum: ['personal', 'shared'], default: 'shared' },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' },
    deadline: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

itemSchema.index({ owner_id: 1, status: 1 });
itemSchema.index({ group_id: 1, status: 1 });
itemSchema.index({ owner_id: 1, created_at: -1 });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

module.exports = Item;

