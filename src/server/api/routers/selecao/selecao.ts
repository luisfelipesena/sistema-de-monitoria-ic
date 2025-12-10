import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { createSelecaoService } from '@/server/services/selecao/selecao-service'
import { NotFoundError, ForbiddenError, ValidationError, BusinessError } from '@/types/errors'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { anoSchema, semestreSchema } from '@/types'

function handleServiceError(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  if (error instanceof ForbiddenError) {
    throw new TRPCError({ code: 'FORBIDDEN', message: error.message })
  }
  if (error instanceof ValidationError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  if (error instanceof BusinessError) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
  }
  throw error
}

export const selecaoRouter = createTRPCRouter({
  generateAtaData: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const service = createSelecaoService(ctx.db)
      try {
        return await service.generateAtaData({
          projetoId: input.projetoId,
          userId: ctx.user.id,
          userRole: ctx.user.role,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  createAtaRecord: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createSelecaoService(ctx.db)
      try {
        return await service.createAtaRecord({
          projetoId: input.projetoId,
          userId: ctx.user.id,
          userRole: ctx.user.role,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  signAta: protectedProcedure
    .input(
      z.object({
        ataId: z.number(),
        assinaturaBase64: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createSelecaoService(ctx.db)
      try {
        return await service.signAta({
          ataId: input.ataId,
          assinaturaBase64: input.assinaturaBase64,
          userId: ctx.user.id,
          userRole: ctx.user.role,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  publishResults: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
        notifyStudents: z.boolean().default(true),
        mensagemPersonalizada: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createSelecaoService(ctx.db)
      try {
        return await service.publishResults({
          projetoId: input.projetoId,
          notifyStudents: input.notifyStudents,
          mensagemPersonalizada: input.mensagemPersonalizada,
          userId: ctx.user.id,
          userRole: ctx.user.role,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getProfessorProjectsWithCandidates: protectedProcedure.query(async ({ ctx }) => {
    const service = createSelecaoService(ctx.db)
    try {
      return await service.getProfessorProjectsWithCandidates(ctx.user.id, ctx.user.role)
    } catch (error) {
      handleServiceError(error)
    }
  }),

  selectMonitors: protectedProcedure
    .input(
      z.object({
        projetoId: z.number(),
        bolsistas: z.array(z.number()),
        voluntarios: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createSelecaoService(ctx.db)
      try {
        return await service.selectMonitors({
          projetoId: input.projetoId,
          bolsistas: input.bolsistas,
          voluntarios: input.voluntarios,
          userId: ctx.user.id,
          userRole: ctx.user.role,
        })
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getAtasForSigning: protectedProcedure.query(async ({ ctx }) => {
    const service = createSelecaoService(ctx.db)
    try {
      return await service.getAtasForSigning(ctx.user.id, ctx.user.role)
    } catch (error) {
      handleServiceError(error)
    }
  }),

  // ========================================
  // ADMIN ENDPOINTS
  // ========================================

  getAllProjectsWithSelectionStatus: protectedProcedure
    .input(
      z.object({
        ano: anoSchema.optional(),
        semestre: semestreSchema.optional(),
        departamentoId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' })
      }

      const service = createSelecaoService(ctx.db)
      try {
        return await service.getAllProjectsWithSelectionStatus(input)
      } catch (error) {
        handleServiceError(error)
      }
    }),

  getAllAtasForAdmin: protectedProcedure
    .input(
      z.object({
        ano: anoSchema.optional(),
        semestre: semestreSchema.optional(),
        departamentoId: z.number().int().positive().optional(),
        status: z.enum(['DRAFT', 'SIGNED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' })
      }

      const service = createSelecaoService(ctx.db)
      try {
        return await service.getAllAtasForAdmin(input)
      } catch (error) {
        handleServiceError(error)
      }
    }),
})
