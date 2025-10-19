import { useState, useEffect, useCallback } from 'react';
import { apiLoginUser } from '../lib/api';

const AUTH_STORAGE_KEY = 'user_auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    try {
      const userData = await apiLoginUser({ email, password });
      
      if (userData.access_token) {
        localStorage.setItem('authToken', userData.access_token);
      }
      
      const userInfo = {
        name: userData.full_name,
        email: userData.email,
        role: userData.user_role,
        id: userData.user_id
      };
      setUser(userInfo);
      return userInfo;
    } catch (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback((userData) => {
    if (userData.access_token) {
      localStorage.setItem('authToken', userData.access_token);
    }
    
    const userInfo = {
      name: userData.full_name,
      email: userData.email,
      role: userData.user_role,
      id: userData.user_id
    };
    setUser(userInfo);
    return userInfo;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    signUp,
    logout,
    isAuthenticated: !!user
  };
}
