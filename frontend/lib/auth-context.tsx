'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken, tryRefresh, ApiError } from './api-client';
import { AuthenticatedUser } from './types';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const restored = await tryRefresh();
      if (restored) {
        try {
          const me = await api.get<AuthenticatedUser>('/auth/me');
          setUser(me);
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  async function login(email: string, motDePasse: string) {
    const data = await api.post<{ accessToken: string; user: AuthenticatedUser }>('/auth/login', {
      email,
      motDePasse,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore - we're logging out regardless
    }
    setAccessToken(null);
    setUser(null);
    router.push('/login');
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
