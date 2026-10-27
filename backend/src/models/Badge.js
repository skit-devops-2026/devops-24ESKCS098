const mongoose = require('mongoose');

const badgeUnlockSchema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true },
    unlocked_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const badgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, uppercase: true },
    icon: { type: String, required: true },
    description: { type: String, default: '' },
    bg_color: { type: String, default: '#FFED00' },
    progress: { type: String, default: null },
    unlocked_by: [badgeUnlockSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Badge = mongoose.models.Badge || mongoose.model('Badge', badgeSchema);

module.exports = Badge;

