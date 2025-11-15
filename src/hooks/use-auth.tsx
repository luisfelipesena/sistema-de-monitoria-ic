"use client"

import {
  AppUser,
  LoginUserInput,
  RegisterUserInput,
  RequestPasswordResetInput,
  ResendVerificationInput,
  ResetPasswordWithTokenInput,
  SetPasswordInput,
} from "@/types"
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
  requestPasswordReset: (input: RequestPasswordResetInput) => Promise<{ success: boolean; message: string }>
  resetPassword: (input: ResetPasswordWithTokenInput) => Promise<{ success: boolean; message: string }>
  setPassword: (input: SetPasswordInput) => Promise<{ success: boolean; message: string }>
  errors: string | null
  clearErrors: () => void
  successMsg: string | null
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

const useMeQuery = () => api.me.getMe.useQuery()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: userQuery, isLoading: isLoadingUser } = useMeQuery()
  const utils = api.useUtils()
  const [errors, setErrors] = useState<string | null>(null)
  const [provider, setProvider] = useState<AuthProviders | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const requestPasswordResetMutation = api.auth.requestPasswordReset.useMutation({
    onSuccess: (res) => {
      setErrors(null)
      setSuccessMsg(res?.message ?? "Se o e-mail existir, enviaremos instruções.");
    },
    onError: (error) => {
      setErrors(error.message || "Erro ao solicitar redefinição de senha")
    },
  })

  const resetPasswordMutation = api.auth.resetPassword.useMutation({
    onSuccess: () => {
      setErrors(null)
    },
    onError: (error) => {
      setErrors(error.message || "Erro ao redefinir senha")
    },
  })

  const setPasswordMutation = api.auth.setPassword.useMutation({
    onSuccess: async () => {
      setErrors(null)
      await utils.me.getMe.invalidate()
    },
    onError: (error) => {
      setErrors(error.message || "Erro ao atualizar senha")
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

  const requestPasswordReset = useCallback(
    async (input: RequestPasswordResetInput) => {
      setErrors(null)
      const response = await requestPasswordResetMutation.mutateAsync(input)
      if (!response) return { success: false, message: 'Erro desconhecido' }
      return { success: response.success, message: response.message }
    },
    [requestPasswordResetMutation]
  )

  const resetPassword = useCallback(
    async (input: ResetPasswordWithTokenInput) => {
      setErrors(null)
      const response = await resetPasswordMutation.mutateAsync(input)
      if (!response) return { success: false, message: 'Erro desconhecido' }
      return { success: response.success, message: response.message }
    },
    [resetPasswordMutation]
  )

  const setPassword = useCallback(
    async (input: SetPasswordInput) => {
      setErrors(null)
      const response = await setPasswordMutation.mutateAsync(input)
      if (!response) return { success: false, message: 'Erro desconhecido' }
      return { success: response.success, message: response.message }
    },
    [setPasswordMutation]
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
        requestPasswordResetMutation.isPending ||
        resetPasswordMutation.isPending ||
        setPasswordMutation.isPending ||
        localLogoutMutation.isPending,
      isAuthenticated: !!user,
      signInCas,
      signOut,
      signInLocal,
      registerLocal,
      resendVerification,
      confirmEmail,
      requestPasswordReset,
      resetPassword,
      setPassword,
      errors,
      clearErrors,
      provider,
      successMsg,
      setSuccessMsg,
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
      requestPasswordReset,
      resetPassword,
      setPassword,
      errors,
      clearErrors,
      provider,
      successMsg,
      setSuccessMsg,
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
