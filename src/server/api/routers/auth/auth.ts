import { createTRPCRouter, protectedProcedure, publicProcedure, rateLimited, RATE_LIMITS } from '@/server/api/trpc'
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
import {
  BusinessError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/server/lib/errors'

const handleBusinessError = (error: unknown): never => {
  if (error instanceof ValidationError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }

  if (error instanceof NotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }

  if (error instanceof ConflictError) {
    throw new TRPCError({ code: 'CONFLICT', message: error.message })
  }

  if (error instanceof UnauthorizedError) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: error.message })
  }

  if (error instanceof ForbiddenError) {
    throw new TRPCError({ code: 'FORBIDDEN', message: error.message })
  }

  if (error instanceof BusinessError) {
    throw new TRPCError({
      code: error.code === 'INTERNAL_SERVER_ERROR' ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST',
      message: error.message,
    })
  }
  throw error
}

export const authRouter = createTRPCRouter({
  register: rateLimited(RATE_LIMITS.register)
    .input(registerUserSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.register(input)
      } catch (error) {
        handleBusinessError(error)
      }
    }),

  resendVerification: rateLimited(RATE_LIMITS.resendVerification)
    .input(resendVerificationSchema)
    .mutation(async ({ input }) => {
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

  login: rateLimited(RATE_LIMITS.login)
    .input(loginUserSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.login(input)
      } catch (error) {
        handleBusinessError(error)
      }
    }),

  requestPasswordReset: rateLimited(RATE_LIMITS.requestPasswordReset)
    .input(requestPasswordResetSchema)
    .mutation(async ({ input }) => {
      try {
        return await authService.requestPasswordReset(input)
      } catch (error) {
        handleBusinessError(error)
      }
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
