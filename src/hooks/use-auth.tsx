"use client"

import { AppUser, LoginUserInput, RegisterUserInput, ResendVerificationInput } from "@/types"
import { api } from "@/utils/api"
import { logger } from "@/utils/logger"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

const log = logger.child({
  context: "useAuth",
})

type AuthProviders = "cas" | "local"

interface AuthState {
  user: AppUser | null
  isLoading: boolean
  isAuthenticated: boolean
  provider: AuthProviders | null
}

interface AuthContextProps extends AuthState {
  signOut: () => Promise<void>
  signInCas: () => void
  signInLocal: (input: LoginUserInput) => Promise<void>
  registerLocal: (input: RegisterUserInput) => Promise<void>
  resendVerification: (input: ResendVerificationInput) => Promise<void>
  confirmEmail: (token: string) => Promise<void>
  errors: string | null
  clearErrors: () => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

const useMeQuery = () => api.me.getMe.useQuery()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: userQuery, isLoading: isLoadingUser } = useMeQuery()
  const utils = api.useUtils()
  const [errors, setErrors] = useState<string | null>(null)
  const [provider, setProvider] = useState<AuthProviders | null>(null)

  const localLoginMutation = api.auth.login.useMutation({
    onSuccess: async () => {
      await utils.me.getMe.invalidate()
      window.location.href = "/home"
    },
    onError: (error) => {
      const message = error.message || "Falha ao fazer login"
      setErrors(message)
    },
  })

  const localRegisterMutation = api.auth.register.useMutation({
    onSuccess: () => {
      setErrors(null)
    },
    onError: (error) => {
      setErrors(error.message || "Erro ao registrar")
    },
  })

  const resendVerificationMutation = api.auth.resendVerification.useMutation({
    onSuccess: () => {
      setErrors(null)
    },
    onError: (error) => {
      setErrors(error.message || "Erro ao reenviar verificação")
    },
  })

  const verifyEmailMutation = api.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setErrors(null)
    },
    onError: (error) => {
      setErrors(error.message || "Token inválido ou expirado")
    },
  })

  const localLogoutMutation = api.auth.logout.useMutation({
    onSettled: async () => {
      await utils.me.getMe.reset()
      window.location.href = "/auth/login"
    },
    onError: (error) => {
      log.error({ error }, "Erro ao fazer logout local")
      setErrors(error.message || "Erro ao sair")
    },
  })

  const user = useMemo(() => (userQuery?.id ? userQuery : null), [userQuery])

  useEffect(() => {
    if (!userQuery?.id) {
      setProvider(null)
      return
    }

    // Heuristic: users created via CAS don't have passwordHash.
    if (!userQuery.passwordHash) {
      setProvider("cas")
    } else {
      setProvider("local")
    }
  }, [userQuery])

  const signInCas = useCallback(() => {
    window.location.href = "/api/cas-login"
  }, [])

  const signOut = useCallback(async () => {
    if (provider === "cas") {
      window.location.href = "/api/cas-logout"
      return
    }

    await localLogoutMutation.mutateAsync()
  }, [provider, localLogoutMutation])

  const signInLocal = useCallback(
    async (input: LoginUserInput) => {
      setErrors(null)
      await localLoginMutation.mutateAsync(input)
    },
    [localLoginMutation]
  )

  const registerLocal = useCallback(
    async (input: RegisterUserInput) => {
      setErrors(null)
      await localRegisterMutation.mutateAsync(input)
    },
    [localRegisterMutation]
  )

  const resendVerification = useCallback(
    async (input: ResendVerificationInput) => {
      setErrors(null)
      await resendVerificationMutation.mutateAsync(input)
    },
    [resendVerificationMutation]
  )

  const confirmEmail = useCallback(
    async (token: string) => {
      setErrors(null)
      await verifyEmailMutation.mutateAsync({ token })
    },
    [verifyEmailMutation]
  )

  const clearErrors = useCallback(() => setErrors(null), [])

  const value = useMemo(
    () => ({
      user,
      isLoading:
        isLoadingUser ||
        localLoginMutation.isPending ||
        localRegisterMutation.isPending ||
        resendVerificationMutation.isPending ||
        verifyEmailMutation.isPending ||
        localLogoutMutation.isPending,
      isAuthenticated: !!user,
      signInCas,
      signOut,
      signInLocal,
      registerLocal,
      resendVerification,
      confirmEmail,
      errors,
      clearErrors,
      provider,
    }),
    [
      user,
      isLoadingUser,
      localLoginMutation.isPending,
      localRegisterMutation.isPending,
      resendVerificationMutation.isPending,
      verifyEmailMutation.isPending,
      localLogoutMutation.isPending,
      signInCas,
      signOut,
      signInLocal,
      registerLocal,
      resendVerification,
      confirmEmail,
      errors,
      clearErrors,
      provider,
    ]
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
