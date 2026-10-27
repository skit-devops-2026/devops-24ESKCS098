// Frontend API service for LifeQuest Wall of Fame
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`[LifeQuest API] Request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // Feed
  getFeed: async (filter = 'all', page = 1) => {
    return request(`/posts?filter=${encodeURIComponent(filter)}&page=${page}`);
  },

  // Create Post
  createPost: async (postData) => {
    return request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  // Delete Post
  deletePost: async (postId) => {
    return request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  // Toggle privacy
  updatePostVisibility: async (postId, visibility) => {
    return request(`/posts/${postId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visibility }),
    });
  },

  // Reactions
  upsertReaction: async (postId, type) => {
    return request(`/posts/${postId}/reaction`, {
      method: 'PUT',
      body: JSON.stringify({ type }),
    });
  },

  deleteReaction: async (postId) => {
    return request(`/posts/${postId}/reaction`, {
      method: 'DELETE',
    });
  },

  // Comments
  getComments: async (postId) => {
    return request(`/posts/${postId}/comments`);
  },

  addComment: async (postId, text) => {
    return request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  deleteComment: async (commentId) => {
    return request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Leaderboard
  getLeaderboard: async ({ period = 'all-time', search = '', limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (search) params.set('search', search);
    if (limit) params.set('limit', limit);
    return request(`/leaderboard?${params.toString()}`);
  },

  // Weekly Stats
  getWeeklyStats: async () => {
    return request('/posts/stats/weekly');
  },

  // Trophy Room
  getMyTrophyRoom: async (category = 'ALL') => {
    return request(`/trophy-room/me?category=${encodeURIComponent(category)}`);
  },

  // Upload proof photo
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Image upload failed');
    return data;
  },

  // ── BucketList ─────────────────────────────────────────────────────────────
  //
  // Auth note: In development, the backend accepts x-dev-user-id to simulate
  // a logged-in user (default user id = 1, Alex Rivero).
  // In production, swap _bucketlistHeaders() to return { Authorization: `Bearer ${token}` }.
  //
  // Status values sent to/from the API follow frontend convention:
  //   'not-started' | 'in-progress' | 'completed'
  // The backend maps these to the PostgreSQL CHECK constraint values automatically.

  /** Dev-mode headers. Replace with JWT in production. */
  _bucketlistHeaders(devUserId = 1) {
    return { 'x-dev-user-id': String(devUserId) };
  },

  // ── Personal Goals ──────────────────────────────────────────────────────────

  /** Fetch all personal goals. Optionally filter by status/category. */
  getPersonalGoals: async ({ status, category, devUserId } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (category && category !== 'all') params.set('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/bucketlist/goals${qs}`, {
      headers: api._bucketlistHeaders(devUserId),
    });
  },

  /** Create a new personal goal. */
  createPersonalGoal: async (goalData, { devUserId } = {}) => {
    return request('/bucketlist/goals', {
      method: 'POST',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify(goalData),
    });
  },

  /** Update goal metadata (title, description, category, priority, deadline, visibility). */
  updatePersonalGoal: async (goalId, goalData, { devUserId } = {}) => {
    return request(`/bucketlist/goals/${goalId}`, {
      method: 'PUT',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify(goalData),
    });
  },

  /** Update goal status and/or progress. */
  updateGoalStatus: async (goalId, { status, progress }, { devUserId } = {}) => {
    return request(`/bucketlist/goals/${goalId}/status`, {
      method: 'PATCH',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify({ status, progress }),
    });
  },

  /** Delete a personal goal (owner only). */
  deletePersonalGoal: async (goalId, { devUserId } = {}) => {
    return request(`/bucketlist/goals/${goalId}`, {
      method: 'DELETE',
      headers: api._bucketlistHeaders(devUserId),
    });
  },

  // ── Overall Stats ───────────────────────────────────────────────────────────

  /** Fetch bucketlist stats (total, completed, in-progress, not-started, rate). */
  getBucketlistStats: async ({ devUserId } = {}) => {
    return request('/bucketlist/stats', {
      headers: api._bucketlistHeaders(devUserId),
    });
  },

  // ── Squads ──────────────────────────────────────────────────────────────────

  /** Fetch squads the current user belongs to. */
  getSquads: async ({ devUserId } = {}) => {
    return request('/bucketlist/squads', {
      headers: api._bucketlistHeaders(devUserId),
    });
  },

  /** Create a new squad. */
  createSquad: async (squadData, { devUserId } = {}) => {
    return request('/bucketlist/squads', {
      method: 'POST',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify(squadData),
    });
  },

  /** Join an existing squad with a join_code. */
  joinSquad: async (code, { devUserId } = {}) => {
    return request('/bucketlist/squads/join', {
      method: 'POST',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify({ joinCode: code }),
    });
  },

  /** Leave a squad. */
  leaveSquad: async (squadId, { devUserId } = {}) => {
    return request(`/bucketlist/squads/${squadId}/leave`, {
      method: 'POST',
      headers: api._bucketlistHeaders(devUserId),
    });
  },

  /** Fetch member roster for a squad. */
  getSquadMembers: async (squadId, { devUserId } = {}) => {
    return request(`/bucketlist/squads/${squadId}/members`, {
      headers: api._bucketlistHeaders(devUserId),
    });
  },

  /** Update squad details (admin only). */
  updateSquad: async (squadId, squadData, { devUserId } = {}) => {
    return request(`/bucketlist/squads/${squadId}`, {
      method: 'PUT',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify(squadData),
    });
  },

  // ── Team Goals ──────────────────────────────────────────────────────────────

  /** Fetch team goals for a specific squad. */
  getTeamGoals: async (squadId, { status, category, devUserId } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (category && category !== 'all') params.set('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/bucketlist/squads/${squadId}/goals${qs}`, {
      headers: api._bucketlistHeaders(devUserId),
    });
  },

  /** Create a team goal inside a squad. */
  createTeamGoal: async (squadId, goalData, { devUserId } = {}) => {
    return request(`/bucketlist/squads/${squadId}/goals`, {
      method: 'POST',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify(goalData),
    });
  },

  /** Update a team goal's fields (creator only). */
  updateTeamGoal: async (squadId, goalId, goalData, { devUserId } = {}) => {
    return request(`/bucketlist/squads/${squadId}/goals/${goalId}`, {
      method: 'PUT',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify(goalData),
    });
  },

  /** Update status/progress of a team goal (any squad member). */
  updateTeamGoalStatus: async (squadId, goalId, { status, progress }, { devUserId } = {}) => {
    return request(`/bucketlist/squads/${squadId}/goals/${goalId}/status`, {
      method: 'PATCH',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify({ status, progress }),
    });
  },

  /** Delete a team goal (creator only). */
  deleteTeamGoal: async (squadId, goalId, { devUserId } = {}) => {
    return request(`/bucketlist/squads/${squadId}/goals/${goalId}`, {
      method: 'DELETE',
      headers: api._bucketlistHeaders(devUserId),
    });
  },
};

export default api;
