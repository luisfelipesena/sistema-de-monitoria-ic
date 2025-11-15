import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { createRelatoriosService } from '@/server/services/relatorios/relatorios-service'
import { NotFoundError, ValidationError } from '@/types/errors'
import {
  alunoRelatorioSchema,
  csvExportInputSchema,
  csvExportOutputSchema,
  dashboardQuickMetricsSchema,
  departamentoRelatorioSchema,
  disciplinaRelatorioSchema,
  editalRelatorioSchema,
  monitorConsolidadoSchema,
  monitoresFinalFiltersSchema,
  monitorFinalBolsistaSchema,
  relatorioFiltersSchema,
  relatorioFiltersWithDeptSchema,
  relatorioFiltersWithStatusSchema,
  relatorioGeralSchema,
  semestreSchema,
  relatorioValidationTypeSchema,
} from '@/types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

function mapDomainErrorToTRPC(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: error.message,
    })
  }

  if (error instanceof ValidationError) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message,
    })
  }

  if (error instanceof Error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
    })
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Erro desconhecido',
  })
}

export const relatoriosRouter = createTRPCRouter({
  getRelatorioGeral: adminProtectedProcedure
    .input(relatorioFiltersSchema)
    .output(relatorioGeralSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.getRelatorioGeral(input.ano, input.semestre)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  getRelatorioPorDepartamento: adminProtectedProcedure
    .input(relatorioFiltersSchema)
    .output(z.array(departamentoRelatorioSchema))
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.getRelatorioPorDepartamento(input.ano, input.semestre)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  getRelatorioProfessores: adminProtectedProcedure
    .input(relatorioFiltersWithDeptSchema)
    .output(z.array(z.any()))
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.getRelatorioProfessores(input.ano, input.semestre, input.departamentoId)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  getRelatorioAlunos: adminProtectedProcedure
    .input(relatorioFiltersWithStatusSchema)
    .output(z.array(alunoRelatorioSchema))
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.getRelatorioAlunos(input.ano, input.semestre, input.status)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  getRelatorioDisciplinas: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .output(z.array(disciplinaRelatorioSchema))
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.getRelatorioDisciplinas(input.ano, input.semestre)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  getRelatorioEditais: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100).optional(),
      })
    )
    .output(z.array(editalRelatorioSchema))
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.getRelatorioEditais(input.ano)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  exportRelatorioCsv: adminProtectedProcedure
    .input(csvExportInputSchema)
    .output(csvExportOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.exportRelatorioCsv(input.tipo, input.ano, input.semestre)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  getDashboardMetrics: adminProtectedProcedure
    .input(relatorioFiltersSchema)
    .output(dashboardQuickMetricsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.getDashboardMetrics(input.ano, input.semestre)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  getConsolidatedMonitoringData: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .output(z.array(monitorConsolidadoSchema))
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.getConsolidatedMonitoringData(input.ano, input.semestre)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  monitoresFinalBolsistas: adminProtectedProcedure
    .input(monitoresFinalFiltersSchema)
    .output(z.array(monitorFinalBolsistaSchema))
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.monitoresFinalBolsistas(input.ano, input.semestre, input.departamentoId)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  monitoresFinalVoluntarios: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        departamentoId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.monitoresFinalVoluntarios(input.ano, input.semestre, input.departamentoId)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  validateCompleteData: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        tipo: relatorioValidationTypeSchema,
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.validateCompleteData(input.ano, input.semestre, input.tipo)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  exportConsolidated: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        incluirBolsistas: z.boolean().default(true),
        incluirVoluntarios: z.boolean().default(true),
        departamentoId: z.number().int().positive().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        destinatarios: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createRelatoriosService(ctx.db)
        return await service.exportConsolidated(
          input.ano,
          input.semestre,
          input.incluirBolsistas,
          input.incluirVoluntarios,
          input.departamentoId,
          ctx.user.id
        )
      } catch (error) {
        if (error instanceof ValidationError) {
          const validationError = error as ValidationError & { cause?: unknown }
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
            cause: validationError.cause,
          })
        }
        mapDomainErrorToTRPC(error)
      }
    }),
})
