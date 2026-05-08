import api from './api';

const authService = {
  // Register user (guest or hotel_admin)
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));

        // Set default auth header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
      }

      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Check user role
  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },

  // Check if system admin
  isSystemAdmin: () => {
    return authService.getUserRole() === 'system_admin';
  },

  // Check if hotel admin
  isHotelAdmin: () => {
    return authService.getUserRole() === 'hotel_admin';
  },

  // Check if guest/user
  isGuest: () => {
    const role = authService.getUserRole();
    return role === 'user' || role === null;
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await api.put('/auth/me', data);
      if (response.data.success) {
        // Update stored user
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, ...response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Update failed'
      };
    }
  },

  // Update avatar
  updateAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.put('/auth/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Avatar upload failed'
      };
    }
  }
};

// Initialize auth header on load
const token = authService.getToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default authService;