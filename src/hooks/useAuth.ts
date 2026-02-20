import { useState, useCallback, useEffect } from 'react';
import { apiClient, type AuthResponse } from '../api/client';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  roleId: number;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

/**
 * Hook untuk manage authentication state
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user sudah login saat component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const response: AuthResponse = await apiClient.login(username, password);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiClient.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await apiClient.register(email, password, name);
      // Setelah register, user perlu login
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
  };
}

/**
 * Hook untuk data fetching dengan loading, error, dan retry logic
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch,
  };
}