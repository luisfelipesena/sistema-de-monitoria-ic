'use client';

import type { SignInFormValues, SignUpFormValues } from '@/routes/auth/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from 'lucia';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiClient } from '../../lib/api';
import logger from '../../lib/logger';

// Custom hook to check if the component is hydrated (client-side rendering is complete)
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
  signIn: (credentials: SignInFormValues) => Promise<void>;
  signUp: (details: SignUpFormValues) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const queryClient = useQueryClient();
  const isHydrated = useHydrated();

  // Fetch user on initial load using React Query
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

  const signIn = useCallback(
    async (credentials: SignInFormValues) => {
      setIsLoading(true);
      try {
        const res = await apiClient.auth.signin.$post({ json: credentials });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Sign in failed');
        }
        await refetchUser(); // Fetch user data after successful sign-in
      } catch (error) {
        logger.auth.error('Erro no login', { error });
        setIsLoading(false);
        throw error;
      }
    },
    [refetchUser],
  );

  const signUp = useCallback(
    async (details: SignUpFormValues) => {
      try {
        const res = await apiClient.auth.signup.$post({ json: details });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Sign up failed');
        }
      } catch (error) {
        logger.auth.error('Erro no cadastro', { error });
        throw error;
      }
    },
    [refetchUser],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.auth.signout.$post();
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Sign out failed');
      }
      // Clear user state immediately
      setUser(null);
      setIsAuthenticated(false);
      queryClient.setQueryData(['authUser'], null);
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
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoading, isAuthenticated, signIn, signUp, signOut],
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
