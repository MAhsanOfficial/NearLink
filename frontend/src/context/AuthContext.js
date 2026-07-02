'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('quickfix_token');
    const userData = localStorage.getItem('quickfix_user');
    if (token && userData) {
      try {

        setUser(JSON.parse(userData));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('quickfix_token', res.token);
    localStorage.setItem('quickfix_user', JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const signup = async (name, email, password, phone, userType = 'customer', area = null, address = null, latitude = null, longitude = null) => {
    const signupData = { 
      name, 
      email, 
      password, 
      phone, 
      user_type: userType 
    };
    
    // Add location fields if provided (for customers)
    if (area) signupData.area = area;
    if (address) signupData.address = address;
    if (latitude) signupData.latitude = latitude;
    if (longitude) signupData.longitude = longitude;
    
    const res = await authAPI.signup(signupData);
    localStorage.setItem('quickfix_token', res.token);
    localStorage.setItem('quickfix_user', JSON.stringify(res.user));
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('quickfix_token');
    localStorage.removeItem('quickfix_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
