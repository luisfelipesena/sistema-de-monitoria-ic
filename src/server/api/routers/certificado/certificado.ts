import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { BusinessError, ForbiddenError, NotFoundError } from '@/server/lib/errors'
import { createCertificadoService } from '@/server/services/certificado/certificado-service'
import { semestreSchema } from '@/types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const certificadoRouter = createTRPCRouter({
  /**
   * Generate a certificate for a specific vaga (monitor position).
   * Students can generate their own; Professors for their projects; Admin for any.
   */
  generate: protectedProcedure.input(z.object({ vagaId: z.number() })).mutation(async ({ input, ctx }) => {
    try {
      const service = createCertificadoService(ctx.db)
      return await service.generateCertificado(input.vagaId, ctx.user.id, ctx.user.role)
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw new TRPCError({ code: 'FORBIDDEN', message: error.message })
      }
      if (error instanceof NotFoundError) {
        throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
      }
      if (error instanceof BusinessError) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
      }
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao gerar certificado' })
    }
  }),

  /**
   * Get preview data for a certificate (without generating PDF).
   */
  preview: protectedProcedure.input(z.object({ vagaId: z.number() })).query(async ({ input, ctx }) => {
    try {
      const service = createCertificadoService(ctx.db)
      return await service.getCertificadoPreview(input.vagaId, ctx.user.id, ctx.user.role)
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw new TRPCError({ code: 'FORBIDDEN', message: error.message })
      }
      if (error instanceof NotFoundError) {
        throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
      }
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao buscar dados do certificado' })
    }
  }),

  /**
   * List all certificates eligible for a student.
   */
  listStudentCertificates: protectedProcedure.input(z.object({ alunoId: z.number() })).query(async ({ input, ctx }) => {
    const service = createCertificadoService(ctx.db)
    return await service.listStudentCertificates(input.alunoId, ctx.user.id, ctx.user.role)
  }),

  /**
   * Generate certificates in batch for a period (admin only).
   */
  generateBatch: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().min(2020).max(2100),
        semestre: semestreSchema,
        departamentoId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createCertificadoService(ctx.db)
      return await service.generateBatchCertificates(input.ano, input.semestre, input.departamentoId, ctx.user.id)
    }),
})
