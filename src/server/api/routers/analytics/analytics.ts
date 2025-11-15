import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { createAnalyticsService } from '@/server/services/analytics/analytics-service'
import { dashboardMetricsSchema, semestreSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { BusinessError, NotFoundError, UnauthorizedError, ValidationError } from '@/server/lib/errors'

const log = logger.child({ context: 'AnalyticsRouter' })

export const analyticsRouter = createTRPCRouter({
  getDashboard: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/analytics/dashboard',
        tags: ['analytics'],
        summary: 'Get dashboard analytics',
        description: 'Get comprehensive analytics data for admin dashboard',
      },
    })
    .input(z.void())
    .output(dashboardMetricsSchema)
    .query(async ({ ctx }) => {
      try {
        const service = createAnalyticsService(ctx.db)
        return await service.getDashboardMetrics(ctx.user.role)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: error.message,
          })
        }
        log.error(error, 'Erro ao calcular métricas do dashboard')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno ao calcular métricas',
        })
      }
    }),

  getProjetosAprovadosPROGRAD: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/analytics/planilha-prograd',
        tags: ['analytics'],
        summary: 'Get approved projects for PROGRAD spreadsheet',
        description: 'Get all approved projects for a specific semester to generate PROGRAD spreadsheet',
      },
    })
    .input(
      z.object({
        ano: z.number().min(2020).max(2050),
        semestre: semestreSchema,
      })
    )
    .output(
      z.object({
        semestre: semestreSchema,
        ano: z.number(),
        projetos: z.array(
          z.object({
            id: z.number(),
            codigo: z.string(),
            disciplinaNome: z.string(),
            professorNome: z.string(),
            professoresParticipantes: z.string(),
            departamentoNome: z.string(),
            tipoProposicao: z.string(),
            linkPDF: z.string(),
          })
        ),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const service = createAnalyticsService(ctx.db)
        return await service.getApprovedProjectsPROGRAD(input.ano, input.semestre, ctx.user.role)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: error.message,
          })
        }
        log.error(error, 'Erro ao buscar projetos aprovados para PROGRAD')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno ao buscar projetos',
        })
      }
    }),

  sendPlanilhaPROGRAD: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/analytics/send-planilha-prograd',
        tags: ['analytics'],
        summary: 'Send PROGRAD spreadsheet via email',
        description: 'Generate and send the PROGRAD spreadsheet PDF via email',
      },
    })
    .input(
      z.object({
        ano: z.number().min(2020).max(2050),
        semestre: semestreSchema,
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        totalProjetos: z.number(),
        destinatarios: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const service = createAnalyticsService(ctx.db)
        return await service.sendPlanilhaPROGRAD(input.ano, input.semestre, ctx.user.role, ctx.user.id)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: error.message,
          })
        }
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
        if (error instanceof BusinessError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        log.error(error, 'Erro ao enviar planilha PROGRAD por email')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno ao enviar planilha',
        })
      }
    }),
})
