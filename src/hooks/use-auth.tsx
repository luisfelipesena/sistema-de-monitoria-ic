'use client';

import {
  type QueryObserverResult,
  type RefetchOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
// Assuming Lucia User type is globally available or defined elsewhere
// If not, we might need to import it from lucia or a shared types definition
import { useRouter } from '@tanstack/react-router'; // Using router hook from tanstack/react-router
import type { User } from 'lucia';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// Simple fetch wrapper for API calls
async function fetchApi(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    // Prepend /api for server routes
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  return res;
}

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
  const [internalUser, setInternalUser] = useState<User | null>(null);
  const [isInternalLoading, setIsInternalLoading] = useState(true);

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
      console.log('useAuth: Fetching /api/auth/me');
      try {
        const res = await fetchApi('/auth/me');
        console.log('useAuth: /api/auth/me status:', res.status);
        if (!res.ok) {
          if (res.status === 401) {
            console.log('useAuth: Not authenticated (401)');
            setInternalUser(null);
            return null; // Return null when not authenticated
          }
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        const data = await res.json(); // Expects { authenticated: true, user: User }
        console.log('useAuth: Fetched user data:', data.user);
        setInternalUser(data.user);
        return data; // Return the whole object { authenticated: true, user: User }
      } catch (error) {
        console.error('useAuth: Error fetching user', error);
        setInternalUser(null);
        return null; // Return null on error
      } finally {
        setIsInternalLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    enabled: isHydrated, // Only run after hydration
  });

  const isLoading = queryLoading || isInternalLoading;
  const user = queryData?.user ?? internalUser;
  const isAuthenticated = !!user && !isLoading;

  const signIn = useCallback(() => {
    if (user) {
      router.navigate({ to: '/' });
      return;
    }
    // Direct redirect to the backend CAS login route
    console.log('useAuth: Redirecting to /api/auth/cas-login');
    window.location.href = '/api/auth/cas-login';
  }, [user, router]);

  const signOut = useCallback(async () => {
    setIsInternalLoading(true);
    try {
      console.log('useAuth: Signing out via /api/auth/signout');
      await fetchApi('/auth/signout');
      setInternalUser(null);
      // Invalidate user query and redirect
      await queryClient.invalidateQueries({ queryKey: ['authUser'] });
      await queryClient.setQueryData(['authUser'], null); // Optimistically set to null
      console.log('useAuth: Signed out, navigating to /');
      router.navigate({ to: '/' });
    } catch (error) {
      console.error('useAuth: Error signing out', error);
      // Still try to clear local state
      setInternalUser(null);
      await queryClient.setQueryData(['authUser'], null);
    } finally {
      setIsInternalLoading(false);
    }
  }, [queryClient, router]);

  // Expose refetch function
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

  useEffect(() => {
    console.log('AuthProvider state:', {
      isLoading,
      isAuthenticated,
      userId: user?.id,
    });
  }, [isLoading, isAuthenticated, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
