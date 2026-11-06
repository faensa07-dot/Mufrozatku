const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Tidak dapat terhubung ke server.');
  return data;
}

export const api = {
  health: () => request('/health'),
  categories: () => request('/categories'),
  vocabulary: (category) => request(`/vocabulary${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  stats: () => request('/stats'),
  leaderboard: (limit = 5) => request(`/leaderboard?limit=${limit}`),
  scores: (student) => request(`/scores${student ? `?student=${encodeURIComponent(student)}` : ''}`),
  saveScore: (payload) => request('/scores', { method: 'POST', body: JSON.stringify(payload) })
};
