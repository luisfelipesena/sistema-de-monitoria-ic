'use client';

import { env } from '@/config/env';
import {
  type QueryObserverResult,
  type RefetchOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { User } from 'lucia';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import { apiClient } from '../../lib/api';
import logger from '../../lib/logger';

function useHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextProps extends AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  signIn: () => Promise<void>;
  refetchUser: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<User | null, Error>>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const queryClient = useQueryClient();
  const isHydrated = useHydrated();
  const navigate = useNavigate();

  const { refetch: refetchUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await apiClient.auth.me.$get();
        if (!res.ok) {
          if (res.status === 401) {
            setUser(null);
            setIsAuthenticated(false);
            return null;
          }
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        const userData = (await res.json()) as User;
        setUser(userData);
        setIsAuthenticated(!!userData);
        return userData;
      } catch (error) {
        logger.auth.error('Erro ao buscar usuário', { error });
        setUser(null);
        setIsAuthenticated(false);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on initial load failure (e.g., 401)
    enabled: isHydrated, // Only run the query after hydration
  });

  const signIn = useCallback(async () => {
    if (user) {
      navigate('/home');
      return;
    }

    setIsLoading(true);
    window.location.href = `${env.VITE_API_URL}/auth/cas-login`;
    setIsLoading(false);
  }, [navigate, user]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      await apiClient.auth.signout.$get();

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      logger.auth.error('Erro ao fazer logout', { error });
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      signOut,
      signIn,
      refetchUser,
    }),
    [user, isLoading, isAuthenticated, signOut, refetchUser, signIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
