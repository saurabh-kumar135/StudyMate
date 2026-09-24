export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) {
      return 'https://studymate1-dquv.onrender.com';
    }
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3011';
};

export const API_URL = getApiUrl();

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return API_URL + '/' + path;
};

export default { API_URL, getImageUrl };
