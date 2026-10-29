import mongoose from 'mongoose';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Windows DNS SRV lookup workaround for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

let _connected = false;
let _connecting = false;

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    _connected = true;
    return;
  }

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
          'Verify MONGODB_URI, network access, and IP whitelist on your MongoDB Atlas cluster.'
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
        'Set MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname> in your environment variables.'
      );
    }
    console.warn('⚠️  [MongoDB] MONGODB_URI not set — using in-memory dev store.');
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
        'Verify MONGODB_URI, network access, and IP whitelist on your MongoDB Atlas cluster.'
      );
    }
    console.warn(`⚠️  [MongoDB] Connection failed (${err.message}) — using in-memory dev store.`);
  }
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

mongoose.connection.on('connected', () => { _connected = true; });
mongoose.connection.on('disconnected', () => { _connected = false; });
mongoose.connection.on('error', (err) => {
  _connected = false;
  console.error('[MongoDB] Connection error:', err.message);
});

// Fallback store when running without persistent DB
const inMemoryStore = {
  users: [],
  groups: [],
  posts: [],
  comments: [],
  reactions: [],
  badges: [],
  user_badges: [],
};


export {
  mongoose,
  connectMongo,
  isMongoConnected,
  inMemoryStore,
};

export default {
  mongoose,
  connectMongo,
  isMongoConnected,
  inMemoryStore,
};
