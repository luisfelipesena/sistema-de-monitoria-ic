'use client';

import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { User } from 'lucia';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
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
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const useMeQuery = () => {
  return useQuery<User | null, Error>({
    queryKey: QueryKeys.auth.me,
    queryFn: async () => {
      try {
        const response = await apiClient.get<User>('/auth/me');
        return response.data;
      } catch (error) {
        log.error({ error }, 'Erro ao buscar usuário');
        return null;
      }
    },
    retry: false,
  });
};

const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        log.error({ error }, 'Erro ao fazer logout');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QueryKeys.auth.me,
      });
      router.navigate({ to: '/', replace: true });
    },
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: userQuery, isLoading: isLoadingUser } = useMeQuery();
  const logoutMutation = useLogoutMutation();

  const user = useMemo(() => (userQuery?.id ? userQuery : null), [userQuery]);

  const signIn = useCallback(() => {
    if (user) {
      window.location.href = '/home';
      return;
    }
    window.location.href = '/api/auth/cas-login';
  }, [user, router]);

  const signOut = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value = useMemo(
    () => ({
      user,
      isLoading: isLoadingUser || logoutMutation.isPending,
      isAuthenticated: !!user,
      signIn,
      signOut,
    }),
    [user, signIn, signOut, isLoadingUser, logoutMutation.isPending],
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
