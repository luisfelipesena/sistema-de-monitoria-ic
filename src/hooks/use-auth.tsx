'use client';

import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryObserverResult,
  type RefetchOptions,
} from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { User } from 'lucia';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { QueryKeys } from './query-keys';

const log = logger.child({
  context: 'useAuth',
});

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
  ) => Promise<QueryObserverResult<User | null, Error>>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const useMeQuery = () => {
  return useQuery<User | null, Error>({
    queryKey: QueryKeys.auth.me,
    queryFn: async () => {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    },
    retry: false,
  });
};

const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.auth.me });
    },
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();
  const {
    data: userQuery,
    refetch: refetchUserInternal,
    isLoading: isLoadingUser,
  } = useMeQuery();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    if (!isLoadingUser) {
      setUser(userQuery?.id ? userQuery : null);
    }
  }, [userQuery, isLoadingUser]);

  const signIn = useCallback(() => {
    if (user) {
      router.navigate({ to: '/home' });
      return;
    }
    window.location.href = '/api/auth/cas-login';
  }, [user, router]);

  const signOut = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      log.warn({ error }, 'Erro ao fazer logout');
    } finally {
      window.location.href = '/';
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoading: isLoadingUser || logoutMutation.isPending,
      isAuthenticated: !!user,
      signIn,
      signOut,
      refetchUser: refetchUserInternal,
    }),
    [user, signIn, signOut, refetchUserInternal],
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
