import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { meService } from '@/server/services/auth/me-service'
import type { AppUser } from '@/types'
import { TRPCError } from '@trpc/server'
import { BusinessError } from '@/server/lib/errors'
import { z } from 'zod'

export const meRouter = createTRPCRouter({
  getMe: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/me',
        tags: ['me'],
        summary: 'Get me',
        description: 'Retrieve the current user',
      },
    })
    .input(z.void())
    .output(z.custom<AppUser>())
    .query(async ({ ctx }): Promise<AppUser> => {
      try {
        return await meService.getMe(ctx.user.id)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({
            code: error.code as 'NOT_FOUND',
            message: error.message,
          })
        }
        throw error
      }
    }),
})
