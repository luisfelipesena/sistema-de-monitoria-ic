import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { signatureTypeTermoSchema } from '@/types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTermosService } from '@/server/services/termos/termos-service'
import { createTermosNotifier } from '@/server/services/termos/termos-notifier'
import { BusinessError } from '@/server/lib/errors'

function handleServiceError(error: unknown): never {
  if (error instanceof BusinessError) {
    const codeMap: Record<string, 'NOT_FOUND' | 'FORBIDDEN' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR'> = {
      NOT_FOUND: 'NOT_FOUND',
      FORBIDDEN: 'FORBIDDEN',
      VALIDATION_ERROR: 'BAD_REQUEST',
      CONFLICT: 'BAD_REQUEST',
      ALREADY_SIGNED: 'BAD_REQUEST',
      MISSING_PARAMETER: 'BAD_REQUEST',
    }

    throw new TRPCError({
      code: codeMap[error.code] || 'INTERNAL_SERVER_ERROR',
      message: error.message,
    })
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : 'Erro interno do servidor',
  })
}

export const termosRouter = createTRPCRouter({
  generateTermo: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createTermosService(ctx.db)
        return await service.generateTermo(parseInt(input.vagaId), ctx.user.id, ctx.user.role)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  downloadTermo: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createTermosService(ctx.db)
        return await service.downloadTermo(parseInt(input.vagaId), ctx.user.id, ctx.user.role)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  signTermo: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
        assinaturaData: z.string(),
        tipoAssinatura: signatureTypeTermoSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createTermosService(ctx.db)
        return await service.signTermo(
          parseInt(input.vagaId),
          input.assinaturaData,
          input.tipoAssinatura,
          ctx.user.id,
          ctx.user.role
        )
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  getTermosStatus: protectedProcedure
    .input(
      z.object({
        projetoId: z.string().optional(),
        vagaId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createTermosService(ctx.db)
        return await service.getTermosStatus(
          input.projetoId ? parseInt(input.projetoId) : undefined,
          input.vagaId ? parseInt(input.vagaId) : undefined,
          ctx.user.id,
          ctx.user.role
        )
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  getTermosPendentes: protectedProcedure.query(async ({ ctx }) => {
    try {
      const service = createTermosService(ctx.db)
      return await service.getTermosPendentes(ctx.user.id, ctx.user.role)
    } catch (error) {
      return handleServiceError(error)
    }
  }),

  notificarPendencias: protectedProcedure
    .input(
      z.object({
        vagaId: z.string().optional(),
        projetoId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const notifier = createTermosNotifier(ctx.db)
        return await notifier.notifyPendingSignatures(
          input.vagaId ? parseInt(input.vagaId) : undefined,
          input.projetoId ? parseInt(input.projetoId) : undefined,
          ctx.user.id,
          ctx.user.role
        )
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  validateTermoReady: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createTermosService(ctx.db)
        return await service.validateTermoReady(parseInt(input.vagaId), ctx.user.id, ctx.user.role)
      } catch (error) {
        return handleServiceError(error)
      }
    }),
})
