const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    post_id: { type: Number, required: true, index: true },
    user_id: { type: Number, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['like', 'fire', 'clap', 'party', 'epic', 'star'],
      default: 'like',
    },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Unique composite constraint: 1 reaction per user per post
reactionSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

const Reaction = mongoose.models.Reaction || mongoose.model('Reaction', reactionSchema);

module.exports = Reaction;

