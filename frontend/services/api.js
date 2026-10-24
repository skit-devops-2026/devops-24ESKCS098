// Frontend API service for LifeQuest Wall of Fame
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
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
};

export default api;
