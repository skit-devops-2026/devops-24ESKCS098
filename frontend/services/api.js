// Frontend API service for LifeQuest Wall of Fame
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('lifequest_token') : null;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  // Auth
  register: async ({ name, email, password, vibe }) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, vibe }),
    });
  },

  login: async ({ email, password }) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async () => {
    return request('/auth/me');
  },

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
    const token = typeof window !== 'undefined' ? localStorage.getItem('lifequest_token') : null;

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Image upload failed');
    return data;
  },

  // ── BucketList ─────────────────────────────────────────────────────────────
  /** Return headers with JWT bearer token or fallback dev header */
  _bucketlistHeaders(devUserId) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lifequest_token') : null;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return devUserId ? { 'x-dev-user-id': String(devUserId) } : {};
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

  /**
   * Update the current user's individual contribution toward a team goal.
   * This records per-member progress without overwriting other members' data.
   * The backend recalculates the overall goal progress from all contributions.
   */
  updateMemberContribution: async (squadId, goalId, { progress, note }, { devUserId } = {}) => {
    return request(`/bucketlist/squads/${squadId}/goals/${goalId}/contribution`, {
      method: 'PATCH',
      headers: api._bucketlistHeaders(devUserId),
      body: JSON.stringify({ progress, note }),
    });
  },
};

export default api;
