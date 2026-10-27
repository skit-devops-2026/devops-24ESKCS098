const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joined_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    cover_url: { type: String, default: '' },
    join_code: { type: String, unique: true, uppercase: true, trim: true },
    is_private: { type: Boolean, default: true },
    admin_id: { type: Number, required: true },
    members: [memberSchema],
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);

module.exports = Group;

