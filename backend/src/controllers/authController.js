'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { isMongoConnected, inMemoryStore } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'lifequest_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Helper to strip sensitive fields (password_hash) from user object.
 */
function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password_hash;
  delete obj.__v;
  return {
    id: obj.id,
    name: obj.name,
    email: obj.email,
    avatar_url: obj.avatar_url || '',
    bio: obj.bio || '',
    vibe: obj.vibe || 'TRAVEL',
    createdAt: obj.created_at || obj.createdAt || new Date().toISOString(),
  };
}

/**
 * Generate a JWT token for a user.
 */
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * POST /api/auth/signup
 * Register a new user with name, email, and password.
 */
async function signup(req, res, next) {
  try {
    const { name, email, password, vibe, avatar_url } = req.body;

    // Validation: Name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must be at least 2 characters.',
      });
    }

    // Validation: Email
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    // Validation: Password
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check for duplicate email in MongoDB or in-memory store
    if (isMongoConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }
    } else {
      const existingUser = inMemoryStore.users.find(
        (u) => u.email && u.email.toLowerCase() === normalizedEmail
      );
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }
    }

    // Hash password securely with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

const CURATED_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80',
];

function getStableAvatar(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return CURATED_AVATARS[Math.abs(hash) % CURATED_AVATARS.length];
}

    // Determine default avatar if not provided
    const defaultAvatar =
      avatar_url && avatar_url.trim()
        ? avatar_url.trim()
        : getStableAvatar(cleanName + normalizedEmail);

    const userVibe = vibe && ['TRAVEL', 'ADVENTURE', 'SKILLS', 'FITNESS'].includes(vibe.toUpperCase())
      ? vibe.toUpperCase()
      : 'TRAVEL';

    let createdUser;

    if (isMongoConnected()) {
      // Find highest existing numeric ID
      const maxUser = await User.findOne().sort({ id: -1 });
      const nextId = maxUser && typeof maxUser.id === 'number' ? maxUser.id + 1 : 1;

      createdUser = await User.create({
        id: nextId,
        name: cleanName,
        email: normalizedEmail,
        password_hash,
        avatar_url: defaultAvatar,
        bio: '',
        vibe: userVibe,
        created_at: new Date(),
      });

      // Keep in-memory store synchronized as fallback
      inMemoryStore.users.push({
        id: nextId,
        name: cleanName,
        email: normalizedEmail,
        password_hash,
        avatar_url: defaultAvatar,
        bio: '',
        vibe: userVibe,
      });
    } else {
      const maxId = inMemoryStore.users.reduce(
        (m, u) => Math.max(m, typeof u.id === 'number' ? u.id : 0),
        0
      );
      const nextId = maxId + 1;

      createdUser = {
        id: nextId,
        name: cleanName,
        email: normalizedEmail,
        password_hash,
        avatar_url: defaultAvatar,
        bio: '',
        vibe: userVibe,
        created_at: new Date().toISOString(),
      };
      inMemoryStore.users.push(createdUser);
    }

    const token = signToken(createdUser);
    const sanitized = sanitizeUser(createdUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to LifeQuest.',
      token,
      user: sanitized,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticate with email and password.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = null;

    if (isMongoConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    }

    // Check in-memory store if not found in MongoDB or if in fallback mode
    if (!user) {
      user = inMemoryStore.users.find(
        (u) => u.email && u.email.toLowerCase() === normalizedEmail
      );
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password with bcrypt
    let isMatch = false;
    if (user.password_hash) {
      try {
        isMatch = await bcrypt.compare(password, user.password_hash);
      } catch (e) {
        isMatch = false;
      }
    }

    // Demo user fallback: if user is one of the initial seed users without a real hash
    if (!isMatch && (!user.password_hash || user.password_hash.startsWith('$2a$10$e8wZ...'))) {
      if (password === 'password123' || password === 'alex123') {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = signToken(user);
    const sanitized = sanitizeUser(user);

    return res.status(200).json({
      success: true,
      message: 'Welcome back, Adventurer!',
      token,
      user: sanitized,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user profile using token from authMiddleware.
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    let user = null;
    if (isMongoConnected()) {
      user = await User.findOne({ id: userId });
    }

    if (!user) {
      user = inMemoryStore.users.find((u) => u.id === userId);
    }

    if (!user) {
      // User decoded from token but not found in DB
      return res.status(200).json({
        success: true,
        user: {
          id: req.user.id,
          name: req.user.name || 'Adventurer',
          email: req.user.email,
          avatar_url: getStableAvatar(req.user.name || 'Adventurer'),
          bio: '',
          vibe: 'TRAVEL',
        },
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Stateless token logout endpoint.
 */
async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

module.exports = {
  signup,
  login,
  getMe,
  logout,
};
