export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}/${path}`;
};

export default { API_URL, getImageUrl };
