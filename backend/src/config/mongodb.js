'use strict';

/**
 * MongoDB connection module for LifeQuest BucketList feature.
 *
 * Uses MONGODB_URI environment variable (never hardcoded credentials).
 * If MongoDB is unavailable the module clearly signals failure — it does NOT
 * silently fall back to in-memory storage in production.  The in-memory
 * fallback is an explicit development convenience guarded by NODE_ENV.
 *
 * Usage:
 *   const { connectMongo, isMongoConnected } = require('./config/mongodb');
 *   await connectMongo();   // call once from server.js
 */

const mongoose = require('mongoose');

let _connected = false;
let _connecting = false;

/**
 * Attempt to connect to MongoDB using the MONGODB_URI env var.
 * Safe to call multiple times — subsequent calls are no-ops if already connected.
 */
async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    _connected = true;
    return;
  }

  // If connection is already in progress, await it
  if (mongoose.connection.readyState === 2) {
    try {
      await mongoose.connection.asPromise();
      _connected = true;
      return;
    } catch (err) {
      _connected = false;
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `[MongoDB] Connection failed: ${err.message}\n` +
          'Verify MONGODB_URI, network access, and IP whitelist on your MongoDB Atlas cluster.\n' +
          'BucketList features will not work until a MongoDB connection is established.'
        );
      }
      console.warn(`⚠️  [MongoDB] Connection failed (${err.message}) — using in-memory dev store.`);
      return;
    }
  }

  if (_connected || _connecting) return;
  _connecting = true;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    _connecting = false;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[MongoDB] MONGODB_URI is not set.\n' +
        'Set MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname> ' +
        'in your environment variables and restart the server.\n' +
        'BucketList features will not work without a MongoDB connection.'
      );
    }
    console.warn('⚠️  [MongoDB] MONGODB_URI not set — BucketList will use in-memory dev store.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });
    _connected = true;
    _connecting = false;
    console.log('✅ Connected to MongoDB database successfully.');
  } catch (err) {
    _connecting = false;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `[MongoDB] Connection failed: ${err.message}\n` +
        'Verify MONGODB_URI, network access, and IP whitelist on your MongoDB Atlas cluster.\n' +
        'BucketList features will not work until a MongoDB connection is established.'
      );
    }
    console.warn(`⚠️  [MongoDB] Connection failed (${err.message}) — using in-memory dev store.`);
  }
}

/**
 * Returns true if mongoose is currently connected.
 */
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Keep _connected in sync with mongoose connection events
mongoose.connection.on('connected', () => { _connected = true; });
mongoose.connection.on('disconnected', () => { _connected = false; });
mongoose.connection.on('error', (err) => {
  _connected = false;
  console.error('[MongoDB] Connection error:', err.message);
});

module.exports = { connectMongo, isMongoConnected };
