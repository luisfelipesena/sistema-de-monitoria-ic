import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { ForbiddenError } from '@/server/lib/errors'
import { createPublicPdfService } from '@/server/services/public-pdf/public-pdf-service'
import { PROFESSOR } from '@/types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const publicPdfRouter = createTRPCRouter({
  /**
   * Generate a public access token for a project PDF.
   * Admin can generate for any project; Professor can generate for their own projects.
   */
  generateToken: protectedProcedure
    .input(
      z.object({
        projetoId: z.number(),
        expirationDays: z.number().min(1).max(365).default(30),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createPublicPdfService(ctx.db)

        // Authorization check for professors
        if (ctx.user.role === PROFESSOR) {
          // Verify professor owns the project - done in service layer
        }

        return await service.generatePublicToken(input.projetoId, ctx.user.id, input.expirationDays)
      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw new TRPCError({ code: 'FORBIDDEN', message: error.message })
        }
        if (error instanceof Error && error.message.includes('não encontrado')) {
          throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
        }
        if (error instanceof Error && error.message.includes('não possui')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao gerar token de acesso' })
      }
    }),

  /**
   * Generate tokens for multiple projects at once (admin only).
   * Used when exporting spreadsheets with PDF links.
   */
  generateBatchTokens: adminProtectedProcedure
    .input(
      z.object({
        projetoIds: z.array(z.number()).min(1).max(100),
        expirationDays: z.number().min(1).max(365).default(30),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createPublicPdfService(ctx.db)
      const results = await service.generateBatchTokens(input.projetoIds, ctx.user.id, input.expirationDays)

      // Convert Map to array for JSON serialization
      const tokensArray = Array.from(results.entries()).map(([projetoId, data]) => ({
        projetoId,
        ...data,
      }))

      const successful = tokensArray.filter((t) => t.success).length
      const failed = tokensArray.filter((t) => !t.success).length

      return {
        tokens: tokensArray,
        summary: {
          total: input.projetoIds.length,
          successful,
          failed,
        },
      }
    }),

  /**
   * List active tokens for a project.
   */
  listProjectTokens: protectedProcedure.input(z.object({ projetoId: z.number() })).query(async ({ input, ctx }) => {
    const service = createPublicPdfService(ctx.db)
    const tokens = await service.listProjectTokens(input.projetoId)

    return tokens.map((t) => ({
      token: t.token,
      expiresAt: t.expiresAt,
      lastAccessedAt: t.lastAccessedAt,
      createdAt: t.createdAt,
      createdBy: t.createdBy,
    }))
  }),

  /**
   * Revoke a specific token (admin or token creator).
   */
  revokeToken: protectedProcedure.input(z.object({ token: z.string() })).mutation(async ({ input, ctx }) => {
    const service = createPublicPdfService(ctx.db)

    // Only admin can revoke any token; others can only revoke their own
    // This check would be in the service if needed

    return await service.revokeToken(input.token, ctx.user.id)
  }),

  /**
   * Get the public URL format info for documentation purposes.
   */
  getPublicUrlFormat: protectedProcedure.query(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return {
      format: `${baseUrl}/api/public/projeto-pdf/{token}`,
      description: 'URL pública para acesso ao PDF do projeto. O token tem validade configurável.',
      queryParams: {
        download: 'Se "true", força o download do arquivo ao invés de exibir no navegador.',
      },
    }
  }),
})
