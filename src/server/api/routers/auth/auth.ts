import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { authService } from '@/server/services/auth/auth-service'
import { lucia } from '@/server/lib/lucia'
import {
  loginUserSchema,
  registerUserSchema,
  requestPasswordResetSchema,
  resendVerificationSchema,
  resetPasswordWithTokenSchema,
  setPasswordSchema,
  verifyEmailSchema,
} from '@/types'
import { TRPCError } from '@trpc/server'
import { BusinessError } from '@/server/lib/errors'

const handleBusinessError = (error: unknown): never => {
  if (error instanceof BusinessError) {
    throw new TRPCError({
      code: error.code as 'NOT_FOUND' | 'CONFLICT' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'BAD_REQUEST',
      message: error.message,
    })
  }
  throw error
}

export const authRouter = createTRPCRouter({
  register: publicProcedure.input(registerUserSchema).mutation(async ({ input }) => {
    try {
      return await authService.register(input)
    } catch (error) {
      handleBusinessError(error)
    }
  }),

  resendVerification: publicProcedure.input(resendVerificationSchema).mutation(async ({ input }) => {
    try {
      return await authService.resendVerification(input)
    } catch (error) {
      handleBusinessError(error)
    }
  }),

  verifyEmail: publicProcedure.input(verifyEmailSchema).mutation(async ({ input }) => {
    try {
      return await authService.verifyEmail(input)
    } catch (error) {
      handleBusinessError(error)
    }
  }),

  login: publicProcedure.input(loginUserSchema).mutation(async ({ input }) => {
    try {
      return await authService.login(input)
    } catch (error) {
      handleBusinessError(error)
    }
  }),

  requestPasswordReset: publicProcedure.input(requestPasswordResetSchema).mutation(async ({ input }) => {
    return await authService.requestPasswordReset(input)
  }),

  resetPassword: publicProcedure.input(resetPasswordWithTokenSchema).mutation(async ({ input }) => {
    try {
      return await authService.resetPassword(input)
    } catch (error) {
      handleBusinessError(error)
    }
  }),

  setPassword: protectedProcedure.input(setPasswordSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    try {
      return await authService.setPassword(ctx.user.id, input)
    } catch (error) {
      handleBusinessError(error)
    }
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) return { success: true }

    const { cookies: getCookies } = await import('next/headers')
    const cookieStore = await getCookies()
    const sessionCookieName = lucia.sessionCookieName
    const existingSession = cookieStore.get(sessionCookieName)

    return await authService.logout(existingSession?.value)
  }),
})
