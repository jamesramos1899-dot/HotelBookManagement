const API_URL = 'http://localhost:5001/api';

const authService = {
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.data));
    }
    return data;
  },

  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.data));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  updateProfile: async (userData, token) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (data.success) {
      // Update local storage with new user data while preserving token
      const currentUser = authService.getCurrentUser();
      const updatedUser = { ...currentUser, ...data.data, token: currentUser.token };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return data;
  },

  getMe: async (token) => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  }
};

export default authService;