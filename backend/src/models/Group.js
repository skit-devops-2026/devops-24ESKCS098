const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user_id: { type: Number },
    userId: { type: Number },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joined_at: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

memberSchema.pre('validate', function () {
  if (this.userId && !this.user_id) this.user_id = this.userId;
  if (this.user_id && !this.userId) this.userId = this.user_id;
});

const groupSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.Mixed },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    cover_url: { type: String, default: '' },
    coverUrl: { type: String, default: null },
    join_code: { type: String, uppercase: true, trim: true },
    joinCode: { type: String, uppercase: true, trim: true },
    is_private: { type: Boolean, default: true },
    isPrivate: { type: Boolean, default: true },
    admin_id: { type: Number },
    adminId: { type: Number },
    members: [memberSchema],
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'groups',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

groupSchema.pre('validate', function () {
  if (this.adminId && !this.admin_id) this.admin_id = this.adminId;
  if (this.admin_id && !this.adminId) this.adminId = this.admin_id;
  if (this.joinCode && !this.join_code) this.join_code = this.joinCode;
  if (this.join_code && !this.joinCode) this.joinCode = this.join_code;
  if (this.coverUrl && !this.cover_url) this.cover_url = this.coverUrl;
  if (this.cover_url && !this.coverUrl) this.coverUrl = this.cover_url;
  if (this.isPrivate !== undefined && this.is_private === undefined) this.is_private = this.isPrivate;
  if (this.is_private !== undefined && this.isPrivate === undefined) this.isPrivate = this.is_private;
  if (!this.id && this._id) this.id = this._id.toString();
});

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);

module.exports = Group;
