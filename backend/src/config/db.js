const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

// Fix Windows DNS SRV lookup for MongoDB Atlas
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

// In-Memory Dev Store Fallback
const inMemoryStore = {
  users: [
    { id: 1, name: 'Alex Rivero', email: 'alex@lifequest.app', avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGwAv94FtvOf1mF5L-lfyB9aCwx1UNQ9UZvMDaYLnF0Ur0kCnw2oaWvuL5NeYq7hKkBPahmlfZnsWDVUnb_znDz9i_h8AxB6MDwR0hueA2Huo7nCXAHNXPIwWABDmVo2czCGXfRAmsDWC4Gh60CGfArz2XGO6sgQ9mFBueM0TAcGb2xe77qz8PRvnZpGvKYAtnuvzTjW7I8qpgIXia-7OJ4_rmqjsTjHsM6xrQUyRJBtB4McTE6AR6', bio: 'Adventure seeker & skydiving rookie.' },
    { id: 2, name: 'Priya Sharma', email: 'priya@lifequest.app', avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKroliD1w9821e4wMugprqu-0L6bjkY-8_N78i2fngH6XgKItbRSKK6saCnLJcLRLH5vflxkhKeZamVfl_lKFMC0j4KnQx0gnVIWU3PG8yLo8jwi1jQzK2ohD5D3JUghYhLVC9yFABBoJulOi_lka-0njoaF4Mc8oedX9jcwDu-0pp0gV4PIuezXkXIBZD1GDlkRbpaPVDn5NkIqmXPfRaAXSTf5CpkmYK68wZGHnDZMfckuBYyWxw', bio: 'Motorcycle nomad.' },
    { id: 3, name: 'Elena Vance', email: 'elena@lifequest.app', avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3HSnRMBfUiKLTTVz-r9NlkIjnrrTThFp0IbPVXpLlNPgMWEAE_AzPF_3q1gKLdZtX-L2sM4DUopi_V0Ad3Pp8ksOmvEFDvrrAc2i_1iWfI_k6mumBPHLcfeYS02rfVIKx20CG7tpGJns9Vvf-XqJZpJqOwTAZypQz_Kep1VB4T3TxHsRD6mThSxw9ril9D1rQH_471vxMCpyXu39zev5Rr7-s3esElO6fB82dRXi7s6TWbsLAAaY9', bio: 'High altitude climber.' },
    { id: 4, name: 'Sarah Chen', email: 'sarah@lifequest.app', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80', bio: 'Photographer.' },
    { id: 5, name: 'Marco Polo', email: 'marco@lifequest.app', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80', bio: 'Culinary explorer.' },
    { id: 6, name: 'Jordan Smith', email: 'jordan@lifequest.app', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80', bio: 'Cardio runner & 100k Club.' },
    { id: 7, name: 'Riya Sharma', email: 'riya@lifequest.app', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80', bio: 'Travel writer & storyteller.' }
  ],
  groups: [
    {
      id: 1,
      name: 'Trip Squad ✈️',
      description: 'Weekend warriors & world explorers',
      cover_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
      join_code: 'LQ-TRIP',
    },
    {
      id: 2,
      name: 'College Gang 🎓',
      description: 'Alma mater reunion quest crew',
      cover_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
      join_code: 'LQ-CLG1',
    },
    {
      id: 3,
      name: 'Fitness Freaks 🏋️',
      description: 'Cardio endurance and marathons',
      cover_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80',
      join_code: 'LQ-FITN',
    },
  ],
  posts: [
    {
      id: 1,
      type: 'solo',
      author_id: 1,
      group_id: 1,
      title: 'First Solo Skydive from 15,000 ft',
      caption: 'Just finished my first solo skydive! 🪂 The freefall adrenaline was absolute madness.',
      badge_label: 'Marathon Finisher',
      stat_badge: '15,000 ft altitude',
      xp_earned: 350,
      visibility: 'shared',
      completed_at: new Date(Date.now() - 3600000).toISOString(),
      proof_images: ['https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces'],
      tagged_friends: [{ id: 4, name: 'Sarah Chen' }, { id: 5, name: 'Marco Polo' }]
    },
    {
      id: 2,
      type: 'solo',
      author_id: 2,
      group_id: 2,
      title: 'Solo Bike Odyssey to Ladakh (Khardung La)',
      caption: 'Solo bike trip to Ladakh done and dusted! 🏍️ Cold winds, warm hearts, and unforgettable passes.',
      badge_label: 'Solo Trip Done',
      stat_badge: '7 days • 900 km',
      xp_earned: 500,
      visibility: 'shared',
      completed_at: new Date(Date.now() - 18000000).toISOString(),
      proof_images: ['https://wanderon-images.gumlet.io/blogs/new/2025/01/best-time-for-leh-ladakh-solo-bike-trip.jpg'],
      tagged_friends: [{ id: 1, name: 'Alex Rivero' }]
    },
    {
      id: 3,
      type: 'solo',
      author_id: 3,
      group_id: 3,
      title: 'Run a Half Marathon under 2 hours',
      caption: 'Crossed the finish line in 1h 54m! Trained 16 weeks through rain and shine.',
      badge_label: 'Cardio Beast',
      stat_badge: '21.1 km • 1h 54m',
      xp_earned: 400,
      visibility: 'shared',
      completed_at: new Date(Date.now() - 172800000).toISOString(),
      proof_images: ['https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80'],
      tagged_friends: []
    }
  ],
  reactions: [
    { post_id: 1, user_id: 2, type: 'fire' },
    { post_id: 1, user_id: 3, type: 'clap' },
    { post_id: 1, user_id: 4, type: 'party' },
    { post_id: 1, user_id: 5, type: 'epic' },
    { post_id: 2, user_id: 1, type: 'fire' },
    { post_id: 2, user_id: 3, type: 'clap' },
    { post_id: 2, user_id: 4, type: 'like' }
  ],
  comments: [
    { id: 1, post_id: 1, author_id: 4, author_name: 'Sarah Chen', color: 'text-[#e4006c]', text: 'Amazing job Alex, you crushed it! 🚀', created_at: new Date(Date.now() - 2700000).toISOString() },
    { id: 2, post_id: 1, author_id: 5, author_name: 'Marco Polo', color: 'text-[#686000]', text: "Total inspiration. Which summit or jump is next? 🌏", created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 3, post_id: 2, author_id: 3, author_name: 'Elena Vance', color: 'text-[#006877]', text: 'That mountain pass view is unreal Priya! Proud of you!', created_at: new Date(Date.now() - 7200000).toISOString() }
  ],
  badges: [
    { id: 'badge-1', title: 'Summit Conqueror', category: 'ADVENTURE', icon: '🏔️', description: 'Climbed 3,000m+ peak with Squad', bg: 'bg-[#ffed00]' },
    { id: 'badge-2', title: 'Deep Sea Explorer', category: 'TRAVEL', icon: '🤿', description: 'Completed open water ocean dive', bg: 'bg-[#bdf2ff]' },
    { id: 'badge-3', title: 'First To Finish', category: 'SQUAD', icon: '⚡', description: 'Completed group challenge ahead of squad', bg: 'bg-[#b4f8c8]' },
    { id: 'badge-4', title: 'Streak Titan', category: 'CONSISTENCY', icon: '🔥', description: 'Logged adventure progress 4 weeks in a row', bg: 'bg-[#ffdad6]' },
    { id: 'badge-5', title: 'Master Chef', category: 'SKILLS', icon: '🍝', description: 'Cooked 5 international authentic recipes', bg: 'bg-[#e0bbff]' },
    { id: 'badge-6', title: 'Globe Trotter', category: 'TRAVEL', icon: '🌍', description: 'Visit 10 different provinces or territories', bg: 'bg-gray-100', progress: '6 / 10' },
    { id: 'badge-7', title: 'Marathon Legend', category: 'FITNESS', icon: '🏃', description: 'Complete an official 42.2km marathon race', bg: 'bg-gray-100', progress: '21.1 / 42.2 km' },
    { id: 'badge-8', title: 'Astro Nomad', category: 'ADVENTURE', icon: '🌌', description: 'Camp under 3 certified Dark Sky reserves', bg: 'bg-gray-100', progress: '1 / 3' },
    { id: 'badge-9', title: 'El Capitan', category: 'ADVENTURE', icon: '🧗', description: 'Conquer 15 multi-pitch rock climbing routes', bg: 'bg-gray-100', progress: '8 / 15' },
    { id: 'badge-10', title: 'Squad Vanguard', category: 'SQUAD', icon: '👑', description: 'Lead 5 squad expeditions from start to finish', bg: 'bg-gray-100', progress: '3 / 5' },
    { id: 'badge-11', title: 'Iron Will', category: 'CONSISTENCY', icon: '🛡️', description: 'Maintain a 12-week consecutive quest streak', bg: 'bg-gray-100', progress: '4 / 12 w' },
    { id: 'badge-12', title: 'NatGeo Lens', category: 'CREATIVE', icon: '📸', description: 'Upload 50 high-resolution proof photos', bg: 'bg-gray-100', progress: '28 / 50' },
  ],
  user_badges: [
    { user_id: 1, badge_id: 'badge-1', unlocked_at: 'Oct 2026' },
    { user_id: 1, badge_id: 'badge-2', unlocked_at: 'Aug 2026' },
    { user_id: 1, badge_id: 'badge-3', unlocked_at: 'Sep 2026' },
    { user_id: 1, badge_id: 'badge-4', unlocked_at: 'Active Now' },
    { user_id: 1, badge_id: 'badge-5', unlocked_at: 'Jul 2026' }
  ]
};

module.exports = {
  mongoose,
  connectMongo,
  isMongoConnected,
  inMemoryStore,
};
