'use client';

import { fetchApi } from '@/utils/fetchApi';
import {
  type QueryObserverResult,
  type RefetchOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from 'lucia';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  signOut: () => Promise<void>;
  signIn: () => void; // Simplified: direct redirect
  refetchUser: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<{ user: User } | null, Error>>; // Adjusted return type slightly
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const queryClient = useQueryClient();
  const isHydrated = useHydrated();
  const router = useRouter();

  const {
    data: queryData,
    isLoading: queryLoading,
    refetch: refetchUserInternal,
  } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await fetchApi('/auth/me');
        if (!res.ok) {
          if (res.status === 401) {
            setUser(null);
            return null;
          }
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        const data = await res.json();
        setUser(data);
        setIsAuthenticated(true);
        return data;
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: isHydrated,
  });

  const signIn = useCallback(() => {
    if (user) {
      router.navigate({ to: '/home' });
      return;
    }
    window.location.href = '/api/auth/cas-login';
  }, [user, router]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchApi('/auth/signout');
      setUser(null);
      await queryClient.invalidateQueries({ queryKey: ['authUser'] });
      router.navigate({ to: '/' });
    } catch (error) {
      setUser(null);
      await queryClient.invalidateQueries({ queryKey: ['authUser'] });
    } finally {
      setIsLoading(false);
      setIsAuthenticated(false);
    }
  }, [queryClient, router]);

  const refetchUser: AuthContextProps['refetchUser'] = useCallback(
    refetchUserInternal,
    [refetchUserInternal],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      signIn,
      signOut,
      refetchUser,
    }),
    [user, isLoading, isAuthenticated, signIn, signOut, refetchUser],
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
