const mongoose = require('mongoose');
require('dotenv').config();

const { User, Group, Item, Post, Comment, Reaction, Badge } = require('../models');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lifequest';

const initialUsers = [
  {
    id: 1,
    name: 'Alex Rivero',
    email: 'alex@lifequest.app',
    avatar_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDGwAv94FtvOf1mF5L-lfyB9aCwx1UNQ9UZvMDaYLnF0Ur0kCnw2oaWvuL5NeYq7hKkBPahmlfZnsWDVUnb_znDz9i_h8AxB6MDwR0hueA2Huo7nCXAHNXPIwWABDmVo2czCGXfRAmsDWC4Gh60CGfArz2XGO6sgQ9mFBueM0TAcGb2xe77qz8PRvnZpGvKYAtnuvzTjW7I8qpgIXia-7OJ4_rmqjsTjHsM6xrQUyRJBtB4McTE6AR6',
    bio: 'Adventure seeker & skydiving rookie.',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya@lifequest.app',
    avatar_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBKroliD1w9821e4wMugprqu-0L6bjkY-8_N78i2fngH6XgKItbRSKK6saCnLJcLRLH5vflxkhKeZamVfl_lKFMC0j4KnQx0gnVIWU3PG8yLo8jwi1jQzK2ohD5D3JUghYhLVC9yFABBoJulOi_lka-0njoaF4Mc8oedX9jcwDu-0pp0gV4PIuezXkXIBZD1GDlkRbpaPVDn5NkIqmXPfRaAXSTf5CpkmYK68wZGHnDZMfckuBYyWxw',
    bio: 'Motorcycle nomad & mountain lover.',
  },
  {
    id: 3,
    name: 'Elena Vance',
    email: 'elena@lifequest.app',
    avatar_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3HSnRMBfUiKLTTVz-r9NlkIjnrrTThFp0IbPVXpLlNPgMWEAE_AzPF_3q1gKLdZtX-L2sM4DUopi_V0Ad3Pp8ksOmvEFDvrrAc2i_1iWfI_k6mumBPHLcfeYS02rfVIKx20CG7tpGJns9Vvf-XqJZpJqOwTAZypQz_Kep1VB4T3TxHsRD6mThSxw9ril9D1rQH_471vxMCpyXu39zev5Rr7-s3esElO6fB82dRXi7s6TWbsLAAaY9',
    bio: 'High altitude climber and marathoner.',
  },
  {
    id: 4,
    name: 'Sarah Chen',
    email: 'sarah@lifequest.app',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    bio: 'Photographer and scuba diver.',
  },
  {
    id: 5,
    name: 'Marco Polo',
    email: 'marco@lifequest.app',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    bio: 'Culinary explorer & food blogger.',
  },
  {
    id: 6,
    name: 'Jordan Smith',
    email: 'jordan@lifequest.app',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    bio: 'Cardio runner & 100k Club.',
  },
  {
    id: 7,
    name: 'Riya Sharma',
    email: 'riya@lifequest.app',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
    bio: 'Travel writer & storyteller.',
  },
];

const initialGroups = [
  {
    id: 1,
    name: 'Trip Squad ✈️',
    description: 'Weekend warriors & world explorers',
    cover_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    join_code: 'LQ-TRIP',
    admin_id: 1,
    members: [
      { user_id: 1, role: 'admin' },
      { user_id: 2, role: 'member' },
      { user_id: 3, role: 'member' },
      { user_id: 4, role: 'member' },
      { user_id: 5, role: 'member' },
    ],
  },
  {
    id: 2,
    name: 'College Gang 🎓',
    description: 'Alma mater reunion quest crew',
    cover_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
    join_code: 'LQ-CLG1',
    admin_id: 2,
    members: [
      { user_id: 1, role: 'member' },
      { user_id: 2, role: 'admin' },
    ],
  },
  {
    id: 3,
    name: 'Fitness Freaks 🏋️',
    description: 'Cardio endurance and marathons',
    cover_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80',
    join_code: 'LQ-FITN',
    admin_id: 3,
    members: [
      { user_id: 1, role: 'member' },
      { user_id: 3, role: 'admin' },
    ],
  },
];

const initialBadges = [
  {
    id: 'badge-1',
    title: 'Summit Conqueror',
    category: 'ADVENTURE',
    icon: '🏔️',
    description: 'Climbed 3,000m+ peak with Squad',
    bg_color: '#FFED00',
    unlocked_by: [{ user_id: 1, unlocked_at: new Date('2026-10-01') }],
  },
  {
    id: 'badge-2',
    title: 'Deep Sea Explorer',
    category: 'TRAVEL',
    icon: '🤿',
    description: 'Completed open water ocean dive',
    bg_color: '#BDF2FF',
    unlocked_by: [{ user_id: 1, unlocked_at: new Date('2026-08-15') }],
  },
  {
    id: 'badge-3',
    title: 'First To Finish',
    category: 'SQUAD',
    icon: '⚡',
    description: 'Completed group challenge ahead of squad',
    bg_color: '#B4F8C8',
    unlocked_by: [{ user_id: 1, unlocked_at: new Date('2026-09-10') }],
  },
  {
    id: 'badge-4',
    title: 'Streak Titan',
    category: 'CONSISTENCY',
    icon: '🔥',
    description: 'Logged adventure progress 4 weeks in a row',
    bg_color: '#FFDAD6',
    unlocked_by: [{ user_id: 1, unlocked_at: new Date('2026-10-20') }],
  },
  {
    id: 'badge-5',
    title: 'Master Chef',
    category: 'SKILLS',
    icon: '🍝',
    description: 'Cooked 5 international authentic recipes',
    bg_color: '#E0BBFF',
    unlocked_by: [{ user_id: 1, unlocked_at: new Date('2026-07-05') }],
  },
  {
    id: 'badge-6',
    title: 'Globe Trotter',
    category: 'TRAVEL',
    icon: '🌍',
    description: 'Visit 10 different provinces or territories',
    bg_color: '#F3F4F6',
    progress: '6 / 10',
    unlocked_by: [],
  },
  {
    id: 'badge-7',
    title: 'Marathon Legend',
    category: 'FITNESS',
    icon: '🏃',
    description: 'Complete an official 42.2km marathon race',
    bg_color: '#F3F4F6',
    progress: '21.1 / 42.2 km',
    unlocked_by: [],
  },
  {
    id: 'badge-8',
    title: 'Astro Nomad',
    category: 'ADVENTURE',
    icon: '🌌',
    description: 'Camp under 3 certified Dark Sky reserves',
    bg_color: '#F3F4F6',
    progress: '1 / 3',
    unlocked_by: [],
  },
  {
    id: 'badge-9',
    title: 'El Capitan',
    category: 'ADVENTURE',
    icon: '🧗',
    description: 'Conquer 15 multi-pitch rock climbing routes',
    bg_color: '#F3F4F6',
    progress: '8 / 15',
    unlocked_by: [],
  },
  {
    id: 'badge-10',
    title: 'Squad Vanguard',
    category: 'SQUAD',
    icon: '👑',
    description: 'Lead 5 squad expeditions from start to finish',
    bg_color: '#F3F4F6',
    progress: '3 / 5',
    unlocked_by: [],
  },
  {
    id: 'badge-11',
    title: 'Iron Will',
    category: 'CONSISTENCY',
    icon: '🛡️',
    description: 'Maintain a 12-week consecutive quest streak',
    bg_color: '#F3F4F6',
    progress: '4 / 12 w',
    unlocked_by: [],
  },
  {
    id: 'badge-12',
    title: 'NatGeo Lens',
    category: 'CREATIVE',
    icon: '📸',
    description: 'Upload 50 high-resolution proof photos',
    bg_color: '#F3F4F6',
    progress: '28 / 50',
    unlocked_by: [],
  },
];

const initialItems = [
  {
    id: 101,
    owner_id: 1,
    group_id: 1,
    title: 'Climb Mt. Fuji Sunrise Summit',
    description: 'Hike overnight via Yoshida Trail to watch the Goraiko sunrise.',
    category: 'ADVENTURE',
    difficulty: 'hard',
    visibility: 'shared',
    status: 'in_progress',
    progress: 65,
    priority: 'HIGH',
    deadline: new Date('2026-11-20'),
  },
  {
    id: 102,
    owner_id: 1,
    group_id: null,
    title: 'Learn Spanish B1 Conversational Level',
    description: 'Complete 90 days streak on Spanish practice app.',
    category: 'SKILLS',
    difficulty: 'medium',
    visibility: 'personal',
    status: 'in_progress',
    progress: 40,
    priority: 'MEDIUM',
    deadline: new Date('2026-12-31'),
  },
  {
    id: 103,
    owner_id: 1,
    group_id: 1,
    title: 'Scuba Diving at Great Barrier Reef',
    description: 'Get PADI Open Water certified and dive outer reef coral.',
    category: 'TRAVEL',
    difficulty: 'medium',
    visibility: 'shared',
    status: 'not_started',
    progress: 0,
    priority: 'HIGH',
    deadline: new Date('2027-02-15'),
  },
  {
    id: 104,
    owner_id: 1,
    group_id: 3,
    title: 'Run a Sub-20 Minute 5K',
    description: 'Interval speedwork 3x weekly and tempo sessions.',
    category: 'FITNESS',
    difficulty: 'hard',
    visibility: 'shared',
    status: 'in_progress',
    progress: 75,
    priority: 'HIGH',
    deadline: new Date('2026-11-30'),
  },
];

const initialPosts = [
  {
    id: 1,
    type: 'solo',
    item_id: null,
    author_id: 1,
    group_id: 1,
    title: 'First Solo Skydive from 15,000 ft',
    caption: 'Just finished my first solo skydive! 🪂 The freefall adrenaline was absolute madness.',
    badge_label: 'Marathon Finisher',
    stat_badge: '15,000 ft altitude',
    xp_earned: 350,
    visibility: 'shared',
    completed_at: new Date(Date.now() - 3600000),
    images: [
      'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
    ],
    members: [],
    tagged_friends: [4, 5],
  },
  {
    id: 2,
    type: 'solo',
    item_id: null,
    author_id: 2,
    group_id: 2,
    title: 'Solo Bike Odyssey to Ladakh (Khardung La)',
    caption: 'Solo bike trip to Ladakh done and dusted! 🏍️ Cold winds, warm hearts, and unforgettable passes.',
    badge_label: 'Solo Trip Done',
    stat_badge: '7 days • 900 km',
    xp_earned: 500,
    visibility: 'shared',
    completed_at: new Date(Date.now() - 18000000),
    images: ['https://wanderon-images.gumlet.io/blogs/new/2025/01/best-time-for-leh-ladakh-solo-bike-trip.jpg'],
    members: [],
    tagged_friends: [1],
  },
  {
    id: 3,
    type: 'solo',
    item_id: null,
    author_id: 3,
    group_id: 3,
    title: 'Run a Half Marathon under 2 hours',
    caption: 'Crossed the finish line in 1h 54m! Trained 16 weeks through rain and shine.',
    badge_label: 'Cardio Beast',
    stat_badge: '21.1 km • 1h 54m',
    xp_earned: 400,
    visibility: 'shared',
    completed_at: new Date(Date.now() - 172800000),
    images: ['https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80'],
    members: [],
    tagged_friends: [],
  },
];

const initialReactions = [
  { post_id: 1, user_id: 2, type: 'fire' },
  { post_id: 1, user_id: 3, type: 'clap' },
  { post_id: 1, user_id: 4, type: 'party' },
  { post_id: 1, user_id: 5, type: 'epic' },
  { post_id: 2, user_id: 1, type: 'fire' },
  { post_id: 2, user_id: 3, type: 'clap' },
  { post_id: 2, user_id: 4, type: 'like' },
];

const initialComments = [
  {
    id: 1,
    post_id: 1,
    author_id: 4,
    author_name: 'Sarah Chen',
    color: 'text-[#e4006c]',
    text: 'Amazing job Alex, you crushed it! 🚀',
    created_at: new Date(Date.now() - 2700000),
  },
  {
    id: 2,
    post_id: 1,
    author_id: 5,
    author_name: 'Marco Polo',
    color: 'text-[#686000]',
    text: 'Total inspiration. Which summit or jump is next? 🌏',
    created_at: new Date(Date.now() - 1800000),
  },
  {
    id: 3,
    post_id: 2,
    author_id: 3,
    author_name: 'Elena Vance',
    color: 'text-[#006877]',
    text: 'That mountain pass view is unreal Priya! Proud of you!',
    created_at: new Date(Date.now() - 7200000),
  },
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    console.log('Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      Group.deleteMany({}),
      Item.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Reaction.deleteMany({}),
      Badge.deleteMany({}),
    ]);

    console.log('Inserting seed data...');
    await User.insertMany(initialUsers);
    await Group.insertMany(initialGroups);
    await Badge.insertMany(initialBadges);
    await Item.insertMany(initialItems);
    await Post.insertMany(initialPosts);
    await Reaction.insertMany(initialReactions);
    await Comment.insertMany(initialComments);

    console.log('✨ MongoDB database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  }
}

seedDatabase();

