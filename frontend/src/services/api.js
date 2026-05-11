import axios from 'axios';

const api = axios.create({
  // This is the magic part:
  // In production, it uses the relative path '/api' to trigger the Vercel rewrite.
  // In local development, it uses your local server.
  baseURL: process.env.NODE_ENV === 'production'
  ? process.env.VITE_API_URL || 'https://hotelbookmanagement-copy-production.up.railway.app/api'
  : 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;