'use client';

import { trpc } from '@/server/trpc/react';
import { fetchApi } from '@/utils/fetchApi';
import {
  type QueryObserverResult,
  type RefetchOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { TRPCClientErrorLike } from '@trpc/client';
import { DefaultErrorShape } from '@trpc/server/unstable-core-do-not-import';
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
  refetchUser: (options?: RefetchOptions) => Promise<
    QueryObserverResult<
      User,
      TRPCClientErrorLike<{
        input: void;
        output: User;
        transformer: true;
        errorShape: DefaultErrorShape;
      }>
    >
  >;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: userQuery, refetch: refetchUserInternal } =
    trpc.auth.me.useQuery();

  useEffect(() => {
    if (userQuery) {
      setUser(userQuery);
      setIsLoading(false);
    }
  }, [userQuery]);

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
    }
  }, [queryClient, router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signOut,
      refetchUser: refetchUserInternal,
    }),
    [user, isLoading, signIn, signOut, refetchUserInternal],
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
