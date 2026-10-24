/**
 * localStorage persistence layer for BucketList goals.
 *
 * Storage keys:
 *   lifequest_personal_goals  – personal goals array
 *   lifequest_team_goals      – team goals array
 *   lifequest_team_requests   – join-request queue (demo)
 *
 * Every public function is a plain read/write so the data layer
 * can later be swapped for fetch() calls with minimal changes.
 */

// ── helpers ────────────────────────────────────────────────────

const PERSONAL_KEY = 'lifequest_personal_goals';
const TEAM_KEY = 'lifequest_team_goals_v2';
const TEAM_REQUESTS_KEY = 'lifequest_team_requests_v2';

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function safeWrite(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded — silently fail for now
  }
}

// ── seed data ──────────────────────────────────────────────────

const SEED_PERSONAL_GOALS = [
  {
    id: 'p-seed-1',
    title: 'Summit Mount Fuji at Sunrise',
    description:
      'An epic 2-day trek to catch the dawn from the highest peak in Japan.',
    category: 'ADVENTURE',
    status: 'in-progress',
    progress: 40,
    visibility: 'public',
    createdAt: '2026-09-10T08:00:00.000Z',
    deadline: '2027-07-01',
  },
  {
    id: 'p-seed-2',
    title: 'Master 5 Authentic Pasta Recipes',
    description:
      'Weekly cooking workshop to learn carbonara and more from scratch.',
    category: 'SKILLS',
    status: 'not-started',
    progress: 0,
    visibility: 'public',
    createdAt: '2026-10-01T10:30:00.000Z',
    deadline: '',
  },
  {
    id: 'p-seed-3',
    title: 'Road Trip Through the Amalfi Coast',
    description:
      '7 days, 3 friends, and an open-top vintage car. Done last summer.',
    category: 'TRAVEL',
    status: 'completed',
    progress: 100,
    visibility: 'public',
    createdAt: '2026-06-15T14:00:00.000Z',
    deadline: '',
  },
  {
    id: 'p-seed-4',
    title: 'Run a Half Marathon',
    description:
      'Train for and complete a 21 km race within the next six months.',
    category: 'FITNESS',
    status: 'in-progress',
    progress: 65,
    visibility: 'private',
    createdAt: '2026-08-20T09:00:00.000Z',
    deadline: '2027-02-15',
  },
];

const SEED_TEAM_GOALS = [
  {
    id: 't-seed-1',
    title: 'Complete a Charity 5K Together',
    description:
      'Sign up and run a charity 5K as a group to raise funds for local shelters.',
    category: 'FITNESS',
    status: 'in-progress',
    progress: 30,
    visibility: 'public',
    createdAt: '2026-09-01T08:00:00.000Z',
    deadline: '2026-12-01',
    createdBy: 'demo-user',
    members: [
      { id: 'demo-user', name: 'You (Demo)', role: 'admin' },
      { id: 'member-1', name: 'Alice', role: 'member' },
      { id: 'member-2', name: 'Bob', role: 'member' },
    ],
  },
  {
    id: 't-seed-2',
    title: 'Weekend Camping Trip',
    description:
      'Plan and execute a two-night camping adventure in the mountains.',
    category: 'ADVENTURE',
    status: 'not-started',
    progress: 0,
    visibility: 'public',
    createdAt: '2026-10-05T12:00:00.000Z',
    deadline: '2027-04-01',
    createdBy: 'member-1',
    members: [
      { id: 'member-1', name: 'Alice', role: 'admin' },
      { id: 'demo-user', name: 'You (Demo)', role: 'member' },
    ],
  },
  {
    id: 't-seed-3',
    title: 'Learn a New Language Together',
    description:
      'Dedicate 30 minutes daily as a group to learning conversational Japanese.',
    category: 'SKILLS',
    status: 'in-progress',
    progress: 15,
    visibility: 'public',
    createdAt: '2026-10-10T09:30:00.000Z',
    deadline: '',
    createdBy: 'demo-user',
    members: [
      { id: 'demo-user', name: 'You (Demo)', role: 'admin' },
      { id: 'member-3', name: 'Charlie', role: 'member' },
    ],
  },
  {
    id: 't-seed-4',
    title: 'Hackathon Weekend Project',
    description:
      'Build and launch an open-source productivity app as a squad in 48 hours.',
    category: 'CAREER',
    status: 'completed',
    progress: 100,
    visibility: 'public',
    createdAt: '2026-08-12T10:00:00.000Z',
    deadline: '2026-08-14',
    createdBy: 'member-2',
    members: [
      { id: 'member-2', name: 'Bob', role: 'admin' },
      { id: 'demo-user', name: 'You (Demo)', role: 'member' },
      { id: 'member-1', name: 'Alice', role: 'member' },
    ],
  },
];

const SEED_TEAM_REQUESTS = [
  {
    id: 'req-1',
    goalId: 't-seed-1',
    userId: 'member-4',
    userName: 'Diana',
    message: "I'd love to join the charity run!",
    createdAt: '2026-10-20T11:00:00.000Z',
  },
];

// ── public API ─────────────────────────────────────────────────

/** Load personal goals. Seeds sample data on first visit. */
export function loadPersonalGoals() {
  const stored = safeRead(PERSONAL_KEY);
  if (stored) return stored;
  safeWrite(PERSONAL_KEY, SEED_PERSONAL_GOALS);
  return SEED_PERSONAL_GOALS;
}

export function savePersonalGoals(goals) {
  safeWrite(PERSONAL_KEY, goals);
}

/** Load team goals. Seeds sample data on first visit. */
export function loadTeamGoals() {
  const stored = safeRead(TEAM_KEY);
  if (stored) return stored;
  safeWrite(TEAM_KEY, SEED_TEAM_GOALS);
  return SEED_TEAM_GOALS;
}

export function saveTeamGoals(goals) {
  safeWrite(TEAM_KEY, goals);
}

/** Load team join-requests. Seeds sample data on first visit. */
export function loadTeamRequests() {
  const stored = safeRead(TEAM_REQUESTS_KEY);
  if (stored) return stored;
  safeWrite(TEAM_REQUESTS_KEY, SEED_TEAM_REQUESTS);
  return SEED_TEAM_REQUESTS;
}

export function saveTeamRequests(requests) {
  safeWrite(TEAM_REQUESTS_KEY, requests);
}

// ── ID generator ───────────────────────────────────────────────

let _counter = 0;
export function generateId(prefix = 'g') {
  _counter += 1;
  return `${prefix}-${Date.now()}-${_counter}`;
}
