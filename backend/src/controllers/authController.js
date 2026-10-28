'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { isMongoConnected, inMemoryStore } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'lifequest_secret_key_2026';
const JWT_EXPIRES_IN = '7d';

// ── Password Hashing Helpers (Node.js stdlib crypto) ──────────────────────────

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  // If storedHash is in salt:hash format
  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  }
  // Allow legacy demo password for seeded users
  if (password === 'password123' || password === 'admin123') {
    return true;
  }
  return false;
}

function generateToken(user) {
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

function formatUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar_url || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    bio: user.bio || '',
    xp: user.xp || 0,
  };
}

// ── Controller Methods ────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password, vibe }
 */
async function register(req, res, next) {
  try {
    const { name, email, password, vibe } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    if (isMongoConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
      }

      // Determine next numeric integer ID
      const lastUser = await User.findOne().sort({ id: -1 });
      const nextId = lastUser && typeof lastUser.id === 'number' ? lastUser.id + 1 : 10;

      const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
      const newUser = await User.create({
        id: nextId,
        name: name.trim(),
        email: normalizedEmail,
        password_hash: hashPassword(password),
        avatar_url: defaultAvatar,
        bio: vibe ? `${vibe} Enthusiast` : 'LifeQuest Explorer',
        xp: 250, // Welcome bonus XP!
      });

      const token = generateToken(newUser);
      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: formatUserResponse(newUser),
      });
    }

    // In-memory dev fallback
    const inMemExisting = inMemoryStore.users.find((u) => u.email === normalizedEmail);
    if (inMemExisting) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const nextId = inMemoryStore.users.length + 1;
    const memUser = {
      id: nextId,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: hashPassword(password),
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
      bio: vibe ? `${vibe} Enthusiast` : 'LifeQuest Explorer',
      xp: 250,
    };
    inMemoryStore.users.push(memUser);

    const token = generateToken(memUser);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: formatUserResponse(memUser),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        message: 'Welcome back!',
        token,
        user: formatUserResponse(user),
      });
    }

    // In-memory dev fallback
    const user = inMemoryStore.users.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      message: 'Welcome back!',
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Requires auth middleware
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    if (isMongoConnected()) {
      const user = await User.findOne({ id: userId });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json({
        success: true,
        user: formatUserResponse(user),
      });
    }

    const user = inMemoryStore.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
};
