import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { semestreSchema, tipoVagaSchema } from '@/types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createVagasService } from '@/server/services/vagas/vagas-service'
import { NotFoundError, ValidationError, ForbiddenError, BusinessError } from '@/types/errors'

function mapDomainErrorToTRPCError(error: Error): TRPCError {
  if (error instanceof NotFoundError) {
    return new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  if (error instanceof ValidationError) {
    return new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  if (error instanceof ForbiddenError) {
    return new TRPCError({ code: 'FORBIDDEN', message: error.message })
  }
  if (error instanceof BusinessError) {
    return new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' })
}

export const vagasRouter = createTRPCRouter({
  validateBolsaLimit: protectedProcedure
    .input(
      z.object({
        alunoId: z.string(),
        ano: z.number(),
        semestre: semestreSchema,
        tipoBolsa: tipoVagaSchema,
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createVagasService(ctx.db)
        return await service.validateBolsaLimit(input.alunoId, input.ano, input.semestre, input.tipoBolsa)
      } catch (error) {
        throw mapDomainErrorToTRPCError(error as Error)
      }
    }),

  acceptVaga: protectedProcedure
    .input(
      z.object({
        inscricaoId: z.string(),
        tipoBolsa: tipoVagaSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createVagasService(ctx.db)
        return await service.acceptVaga(input.inscricaoId, input.tipoBolsa, ctx.user.id, ctx.user.role)
      } catch (error) {
        throw mapDomainErrorToTRPCError(error as Error)
      }
    }),

  rejectVaga: protectedProcedure
    .input(
      z.object({
        inscricaoId: z.string(),
        motivo: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createVagasService(ctx.db)
        return await service.rejectVaga(input.inscricaoId, input.motivo, ctx.user.id, ctx.user.role)
      } catch (error) {
        throw mapDomainErrorToTRPCError(error as Error)
      }
    }),

  getMyVagas: protectedProcedure.query(async ({ ctx }) => {
    try {
      const service = createVagasService(ctx.db)
      return await service.getMyVagas(ctx.user.id, ctx.user.role)
    } catch (error) {
      throw mapDomainErrorToTRPCError(error as Error)
    }
  }),

  getVagasByProject: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createVagasService(ctx.db)
        return await service.getVagasByProject(input.projetoId, ctx.user.id, ctx.user.role)
      } catch (error) {
        throw mapDomainErrorToTRPCError(error as Error)
      }
    }),

  statusVagasFinalizadas: protectedProcedure
    .input(
      z.object({
        ano: z.number().optional(),
        semestre: semestreSchema.optional(),
        projetoId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createVagasService(ctx.db)
        return await service.statusVagasFinalizadas(input, ctx.user.id, ctx.user.role)
      } catch (error) {
        throw mapDomainErrorToTRPCError(error as Error)
      }
    }),

  finalizarMonitoria: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
        dataFim: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createVagasService(ctx.db)
        return await service.finalizarMonitoria(input.vagaId, input.dataFim, ctx.user.id, ctx.user.role)
      } catch (error) {
        throw mapDomainErrorToTRPCError(error as Error)
      }
    }),
})
