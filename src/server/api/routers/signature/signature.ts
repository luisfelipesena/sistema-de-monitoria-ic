import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'SignatureRouter' })

export const signatureRouter = createTRPCRouter({
  getDefaultSignature: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/signature/default',
        tags: ['signature'],
        summary: 'Get user default signature',
        description: "Retrieve the user's default signature",
      },
    })
    .input(z.void())
    .output(
      z
        .object({
          signatureData: z.string(),
          dataAssinatura: z.date(),
        })
        .nullable()
    )
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.db.query.userTable.findFirst({
          where: eq(userTable.id, ctx.user.id),
          columns: {
            assinaturaDefault: true,
            dataAssinaturaDefault: true,
          },
        })

        if (!user?.assinaturaDefault) {
          return null
        }

        return {
          signatureData: user.assinaturaDefault,
          dataAssinatura: user.dataAssinaturaDefault || new Date(),
        }
      } catch (error) {
        log.error(error, 'Error getting default signature')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving signature',
        })
      }
    }),

  saveDefaultSignature: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/signature/default',
        tags: ['signature'],
        summary: 'Save user default signature',
        description: "Save or update the user's default signature",
      },
    })
    .input(
      z.object({
        signatureData: z.string().min(1, 'Signature data is required'),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.db
          .update(userTable)
          .set({
            assinaturaDefault: input.signatureData,
            dataAssinaturaDefault: new Date(),
          })
          .where(eq(userTable.id, ctx.user.id))

        log.info({ userId: ctx.user.id }, 'Default signature saved successfully')
        return { success: true }
      } catch (error) {
        log.error(error, 'Error saving default signature')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error saving signature',
        })
      }
    }),

  deleteDefaultSignature: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/signature/default',
        tags: ['signature'],
        summary: 'Delete user default signature',
        description: "Remove the user's default signature",
      },
    })
    .input(z.void())
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ ctx }) => {
      try {
        await ctx.db
          .update(userTable)
          .set({
            assinaturaDefault: null,
            dataAssinaturaDefault: null,
          })
          .where(eq(userTable.id, ctx.user.id))

        log.info({ userId: ctx.user.id }, 'Default signature deleted successfully')
        return { success: true }
      } catch (error) {
        log.error(error, 'Error deleting default signature')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error deleting signature',
        })
      }
    }),
})
