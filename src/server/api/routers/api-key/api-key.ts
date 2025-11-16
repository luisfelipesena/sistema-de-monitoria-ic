import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { apiKeyService } from '@/server/services/api-key/api-key-service'
import { createApiKeySchema, deleteApiKeySchema, listApiKeysSchema, updateApiKeySchema } from '@/types'
import { TRPCError } from '@trpc/server'
import { BusinessError } from '@/server/lib/errors'
import { z } from 'zod'

const handleBusinessError = (error: unknown): never => {
  if (error instanceof BusinessError) {
    throw new TRPCError({
      code: error.code as 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN',
      message: error.message,
    })
  }
  throw error
}

export const apiKeyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      createApiKeySchema.extend({
        userId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await apiKeyService.create(input, ctx.user.id, ctx.user.role)
      } catch (error) {
        handleBusinessError(error)
      }
    }),

  list: protectedProcedure.input(listApiKeysSchema).query(async ({ ctx, input }) => {
    try {
      return await apiKeyService.list(input, ctx.user.id, ctx.user.role)
    } catch (error) {
      handleBusinessError(error)
    }
  }),

  update: protectedProcedure.input(updateApiKeySchema).mutation(async ({ ctx, input }) => {
    try {
      return await apiKeyService.update(input, ctx.user.id, ctx.user.role)
    } catch (error) {
      handleBusinessError(error)
    }
  }),

  delete: protectedProcedure.input(deleteApiKeySchema).mutation(async ({ ctx, input }) => {
    try {
      return await apiKeyService.delete(input, ctx.user.id, ctx.user.role)
    } catch (error) {
      handleBusinessError(error)
    }
  }),

  listAll: adminProtectedProcedure.query(async () => {
    return await apiKeyService.listAll()
  }),
})
