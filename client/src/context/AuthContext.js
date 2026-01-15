import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ เพิ่ม

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedUserId = localStorage.getItem('userId');

    if (token) {
      setIsAuthenticated(true);
      setRole(savedRole);
      setUserId(savedUserId);
    }

    setLoading(false); // ✅ สำคัญมาก
  }, []);

  const login = (token, userRole, id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', userRole);
    localStorage.setItem('userId', id);

    setIsAuthenticated(true);
    setRole(userRole);
    setUserId(id);
  };

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setRole(null);
    setUserId(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, role, userId, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
