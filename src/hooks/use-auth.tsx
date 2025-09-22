"use client"

import { AppUser } from "@/types"
import { api } from "@/utils/api"
import { logger } from "@/utils/logger"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useRouter } from "next/navigation"
import React, { createContext, useCallback, useContext, useMemo } from "react"

const log = logger.child({
  context: "useAuth",
})

interface AuthState {
  user: AppUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextProps extends AuthState {
  signOut: () => Promise<void>
  signIn: () => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

const useMeQuery = () => {
  return api.me.getMe.useQuery()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const useLogoutMutation = () => {
    return useMutation({
      mutationFn: async () => {
        try {
          await axios.post("/api/cas-logout")
          //window.location.href = "/"
        } catch (error) {
          log.error({ error }, "Erro ao fazer logout")
        }
      },
      onSuccess: async () => {
        await utils.me.getMe.reset() // or utils.invalidate()
        // window.location.replace("/login") // or router.replace("/login")
      },
    })
  }
  const router = useRouter()
  const { data: userQuery, isLoading: isLoadingUser } = useMeQuery()
  const logoutMutation = useLogoutMutation()
  const utils = api.useUtils()

  const user = useMemo(() => (userQuery?.id ? userQuery : null), [userQuery])

  const signIn = useCallback(() => {
    window.location.href = "/api/cas-login"
  }, [])

  const signOut = useCallback(async () => {
    window.location.href = "/api/cas-logout"
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading: isLoadingUser || logoutMutation.isPending,
      isAuthenticated: !!user,
      signIn,
      signOut,
    }),
    [user, signIn, signOut, isLoadingUser, logoutMutation.isPending]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
