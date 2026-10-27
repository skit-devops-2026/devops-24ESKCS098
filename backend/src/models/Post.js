const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    type: { type: String, enum: ['solo', 'group'], default: 'solo' },
    item_id: { type: Number, default: null },
    author_id: { type: Number, required: true, index: true },
    group_id: { type: Number, required: true, index: true },
    title: { type: String, required: true, trim: true },
    caption: { type: String, default: '' },
    badge_label: { type: String, default: 'Quest Conquered' },
    stat_badge: { type: String, default: '' },
    xp_earned: { type: Number, default: 100 },
    visibility: { type: String, enum: ['personal', 'shared'], default: 'shared' },
    images: [{ type: String }],
    members: [{ type: Number }],
    tagged_friends: [{ type: Number }],
    completed_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.index({ group_id: 1, completed_at: -1 });
postSchema.index({ author_id: 1, completed_at: -1 });
postSchema.index({ completed_at: -1 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

module.exports = Post;

