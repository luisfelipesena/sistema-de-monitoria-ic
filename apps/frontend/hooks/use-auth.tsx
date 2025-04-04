"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { User } from "lucia"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react"
import { apiClient } from "../lib/api"

// Custom hook to check if the component is hydrated (client-side rendering is complete)
function useHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

// Loading fallback UI component with skeleton animation
function AuthFallback() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 mx-auto mb-4 bg-gray-300 rounded-full" />
        <div className="h-4 mx-auto mb-2 bg-gray-300 rounded w-36" />
        <div className="h-3 mx-auto bg-gray-300 rounded w-28" />
      </div>
    </div>
  )
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

type AuthAction = { type: "SET_USER"; payload: User | null } | { type: "SET_LOADING"; payload: boolean }

interface AuthContextProps extends AuthState {
  signIn: (credentials: unknown) => Promise<void> // Define specific types later
  signUp: (details: unknown) => Promise<void> // Define specific types later
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

const initialState: AuthState = {
  user: null,
  isLoading: true, // Start loading initially to check auth status
  isAuthenticated: false,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const queryClient = useQueryClient()
  const isHydrated = useHydrated()

  // Fetch user on initial load using React Query
  const { data: initialUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["authUser"], // Unique query key
    queryFn: async () => {
      try {
        const res = await apiClient.auth.me.$get()
        if (!res.ok) {
          // Handle non-2xx responses (e.g., 401 Unauthorized)
          if (res.status === 401) return null
          throw new Error(`Failed to fetch user: ${res.status}`)
        }
        return (await res.json()) as User
      } catch (error) {
        console.error("Error fetching initial user:", error)
        return null // Treat errors as unauthenticated
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on initial load failure (e.g., 401)
    enabled: isHydrated, // Only run the query after hydration
  })

  // Update context state based on query result
  useEffect(() => {
    if (!isUserLoading) {
      dispatch({ type: "SET_USER", payload: initialUser ?? null })
    }
  }, [initialUser, isUserLoading])

  const handleAuthSuccess = useCallback(
    async (message: string) => {
      console.log(message) // Or use a toast notification
      // Invalidate the user query to refetch and update state
      await queryClient.invalidateQueries({ queryKey: ["authUser"] })
    },
    [queryClient]
  )

  // --- Auth Actions ---
  // TODO: Define specific types for credentials and details based on backend schemas
  const signIn = useCallback(
    async (credentials: any) => {
      dispatch({ type: "SET_LOADING", payload: true })
      try {
        const res = await apiClient.auth.signin.$post({ json: credentials })
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.message || "Sign in failed")
        }
        const data = await res.json()
        await handleAuthSuccess(data.message || "Signin successful")
      } catch (error) {
        console.error("Sign in error:", error)
        dispatch({ type: "SET_LOADING", payload: false })
        throw error // Re-throw for form handling
      }
    },
    [handleAuthSuccess]
  )

  const signUp = useCallback(
    async (details: any) => {
      dispatch({ type: "SET_LOADING", payload: true })
      try {
        const res = await apiClient.auth.signup.$post({ json: details })
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.message || "Sign up failed")
        }
        const data = await res.json()
        await handleAuthSuccess(data.message || "Signup successful")
      } catch (error) {
        console.error("Sign up error:", error)
        dispatch({ type: "SET_LOADING", payload: false })
        throw error // Re-throw for form handling
      }
    },
    [handleAuthSuccess]
  )

  const signOut = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const res = await apiClient.auth.signout.$post()
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Sign out failed")
      }
      const data = await res.json()
      console.log(data.message || "Signout successful") // Or toast
      dispatch({ type: "SET_USER", payload: null }) // Clear user immediately
      // Optional: Clear other query cache if needed
      await queryClient.invalidateQueries({ queryKey: ["authUser"] }) // Ensure consistency
      queryClient.setQueryData(["authUser"], null) // Optimistically update cache
    } catch (error) {
      console.error("Sign out error:", error)
      dispatch({ type: "SET_LOADING", payload: false })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [queryClient])

  const value = useMemo(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
    }),
    [state, signIn, signUp, signOut]
  )

  // Return a fallback during hydration to prevent content flashing/layout shifts
  if (!isHydrated || (isHydrated && isUserLoading)) {
    return (
      <AuthContext.Provider
        value={{
          ...initialState,
          signIn: async () => {
            throw new Error("Application is still loading")
          },
          signUp: async () => {
            throw new Error("Application is still loading")
          },
          signOut: async () => {
            throw new Error("Application is still loading")
          },
        }}
      >
        <AuthFallback />
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
