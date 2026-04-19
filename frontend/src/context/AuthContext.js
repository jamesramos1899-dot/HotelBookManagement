import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login for now - replace with API call later
    const mockUser = { _id: '1', name: 'Test User', email, role: 'user' };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    return { success: true, data: mockUser };
  };

  const register = async (name, email, password, phone) => {
    const mockUser = { _id: '1', name, email, role: 'user' };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    return { success: true, data: mockUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);