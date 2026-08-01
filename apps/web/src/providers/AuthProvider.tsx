'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { getToken, setToken, clearToken } from '@/lib/auth';
import type { AdminProfile } from '@vt/shared';

interface AuthContextValue {
  admin: AdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, admin: AdminProfile) => void;
  logout: (redirect?: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((token: string, adminData: AdminProfile) => {
    setToken(token);
    setAdmin(adminData);
  }, []);

  const logout = useCallback((redirect = true) => {
    clearToken();
    setAdmin(null);
    if (redirect) {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { setIsLoading(false); return; }

    apiClient.get<AdminProfile>('/auth/me')
      .then((data) => setAdmin(data))
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ admin, isLoading, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
