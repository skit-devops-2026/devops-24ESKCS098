'use strict';

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    bio: { type: String, default: '' },
    vibe: { type: String, default: 'TRAVEL' },
    xp: { type: Number, default: 1950 },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password_hash;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password_hash;
        return ret;
      },
    },
  }
);

userSchema.index({ xp: -1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
