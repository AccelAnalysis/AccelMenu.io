const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY;

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}

// Slides
export const fetchSlides = () => request('/api/slides');
export const createSlide = (payload) => request('/api/slides', { method: 'POST', body: JSON.stringify(payload) });
export const updateSlide = (id, payload) => request(`/api/slides/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteSlide = (id) => request(`/api/slides/${id}`, { method: 'DELETE' });

// Screens
export const fetchScreens = () => request('/api/screens');
export const createScreen = (payload) => request('/api/screens', { method: 'POST', body: JSON.stringify(payload) });
export const updateScreen = (id, payload) => request(`/api/screens/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteScreen = (id) => request(`/api/screens/${id}`, { method: 'DELETE' });

// Playlists
export const fetchPlaylist = (screenId) => request(`/api/screens/${screenId}/playlist`);
export const addToPlaylist = (screenId, payload) =>
  request(`/api/screens/${screenId}/playlist`, { method: 'POST', body: JSON.stringify(payload) });
export const reorderPlaylist = (screenId, payload) =>
  request(`/api/screens/${screenId}/playlist/reorder`, { method: 'POST', body: JSON.stringify(payload) });
export const removeFromPlaylist = (screenId, itemId) =>
  request(`/api/screens/${screenId}/playlist/${itemId}`, { method: 'DELETE' });

// Data import/export
export const exportData = () => request('/api/export');
export const importData = (payload) => request('/api/import', { method: 'POST', body: JSON.stringify(payload) });
export const importLegacyData = (payload) => request('/api/import/legacy', { method: 'POST', body: JSON.stringify(payload) });
