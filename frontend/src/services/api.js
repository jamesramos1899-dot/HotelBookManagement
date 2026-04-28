import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  // Try multiple possible token locations
  let token = localStorage.getItem('token');
  
  if (!token) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    token = user.token || user.accessToken;
  }
  
  console.log('Sending token:', token ? 'yes' : 'no'); // Debug
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;