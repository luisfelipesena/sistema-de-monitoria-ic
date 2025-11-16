import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { semestreSchema, tipoVagaSchema } from '@/types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createScholarshipAllocationService } from '@/server/services/scholarship-allocation/scholarship-allocation-service'
import { createScholarshipAllocationNotifier } from '@/server/services/scholarship-allocation/scholarship-allocation-notifier'
import { BusinessError } from '@/server/lib/errors'

function handleServiceError(error: unknown): never {
  if (error instanceof BusinessError) {
    const codeMap: Record<string, 'NOT_FOUND' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR'> = {
      NOT_FOUND: 'NOT_FOUND',
      MISSING_PERIODO: 'BAD_REQUEST',
      MISSING_PROGRAD_LIMIT: 'BAD_REQUEST',
      LIMIT_EXCEEDED: 'BAD_REQUEST',
      PROJECTS_NOT_FOUND: 'BAD_REQUEST',
      MISSING_VALUE: 'BAD_REQUEST',
      PERIODO_NOT_FOUND: 'BAD_REQUEST',
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

export const scholarshipAllocationRouter = createTRPCRouter({
  getApprovedProjects: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createScholarshipAllocationService(ctx.db)
        return await service.getApprovedProjects(input.ano, input.semestre)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  updateScholarshipAllocation: adminProtectedProcedure
    .input(
      z.object({
        projetoId: z.number(),
        bolsasDisponibilizadas: z.number().int().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createScholarshipAllocationService(ctx.db)
        return await service.updateScholarshipAllocation(input.projetoId, input.bolsasDisponibilizadas)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  bulkUpdateAllocations: adminProtectedProcedure
    .input(
      z.object({
        allocations: z.array(
          z.object({
            projetoId: z.number(),
            bolsasDisponibilizadas: z.number().int().min(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createScholarshipAllocationService(ctx.db)
        return await service.bulkUpdateAllocations(input.allocations)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  getAllocationSummary: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createScholarshipAllocationService(ctx.db)
        return await service.getAllocationSummary(input.ano, input.semestre)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  getCandidatesForProject: adminProtectedProcedure
    .input(z.object({ projetoId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const service = createScholarshipAllocationService(ctx.db)
        return await service.getCandidatesForProject(input.projetoId)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  allocateScholarshipToCandidate: adminProtectedProcedure
    .input(
      z.object({
        inscricaoId: z.number(),
        tipo: tipoVagaSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createScholarshipAllocationService(ctx.db)
        return await service.allocateScholarshipToCandidate(input.inscricaoId, input.tipo)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  setTotalScholarshipsFromPrograd: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        totalBolsas: z.number().int().min(0),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        totalBolsas: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createScholarshipAllocationService(ctx.db)
        return await service.setTotalScholarshipsFromPrograd(input.ano, input.semestre, input.totalBolsas)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  getTotalProgradScholarships: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createScholarshipAllocationService(ctx.db)
        return await service.getTotalProgradScholarships(input.ano, input.semestre)
      } catch (error) {
        return handleServiceError(error)
      }
    }),

  notifyProfessorsAfterAllocation: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const notifier = createScholarshipAllocationNotifier(ctx.db)
        return await notifier.notifyProfessorsAfterAllocation(input.ano, input.semestre)
      } catch (error) {
        return handleServiceError(error)
      }
    }),
})
