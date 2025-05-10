'use client';

import { trpc } from '@/server/trpc/react';
import { logger } from '@/utils/logger';
import {
  type QueryObserverResult,
  type RefetchOptions,
} from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { TRPCClientErrorLike } from '@trpc/client';
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
  signIn: () => void;
  refetchUser: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<User | undefined, TRPCClientErrorLike<any>>>;
}

const log = logger.child({
  context: 'useAuth',
});

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isHydrated = useHydrated();
  const router = useRouter();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      window.location.href = data;
    },
  });

  const {
    data: queryData,
    refetch: refetchUserInternal,
    isLoading: queryLoading,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: isHydrated,
  });

  useEffect(() => {
    if (!isHydrated) return;

    if (queryData) {
      setUser(queryData);
      setIsAuthenticated(true);
    }

    setIsLoading(queryLoading);
  }, [queryData, queryLoading, isHydrated]);

  const signIn = useCallback(() => {
    if (user) {
      router.navigate({ to: '/home' });
      return;
    }
    loginMutation.mutate();
  }, [user, router]);

  const signOut = useCallback(async () => {
    window.location.href = '/auth/logout';
  }, []);

  const refetchUser = useCallback(refetchUserInternal, [refetchUserInternal]);

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
