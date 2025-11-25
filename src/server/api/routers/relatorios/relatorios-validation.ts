import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { createRelatoriosNotificationsService } from '@/server/services/relatorios/relatorios-notifications-service'
import { semestreSchema } from '@/types'
import { NotFoundError, ValidationError } from '@/types/errors'
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

/**
 * Router for validation and certification procedures
 * Split from main relatorios router per CLAUDE.md guidelines
 */
export const relatoriosValidationRouter = createTRPCRouter({
  notifyProfessorsToGenerateReports: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        prazoFinal: z.date().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        emailsEnviados: z.number(),
        errors: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const service = createRelatoriosNotificationsService(ctx.db)
        return await service.notifyProfessorsToGenerateReports(input.ano, input.semestre, input.prazoFinal, ctx.user.id)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  notifyStudentsWithPendingReports: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        emailsEnviados: z.number(),
        errors: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const service = createRelatoriosNotificationsService(ctx.db)
        return await service.notifyStudentsWithPendingReports(input.ano, input.semestre, ctx.user.id)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  gerarTextoAta: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .output(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const service = createRelatoriosNotificationsService(ctx.db)
        return await service.gerarTextoAta(input.ano, input.semestre)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  gerarPlanilhasCertificados: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .output(
      z.object({
        bolsistas: z.string(),
        voluntarios: z.string(),
        relatoriosDisciplina: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const service = createRelatoriosNotificationsService(ctx.db)
        const result = await service.gerarPlanilhasCertificados(input.ano, input.semestre)
        return {
          bolsistas: result.bolsistas.toString('base64'),
          voluntarios: result.voluntarios.toString('base64'),
          relatoriosDisciplina: result.relatoriosDisciplina.toString('base64'),
        }
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  enviarCertificadosParaNUMOP: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        emailDestino: z.string().email(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const service = createRelatoriosNotificationsService(ctx.db)
        return await service.enviarCertificadosParaNUMOP(input.ano, input.semestre, input.emailDestino, ctx.user.id)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  getValidationStatus: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
      })
    )
    .output(
      z.object({
        projetos: z.object({
          total: z.number(),
          comRelatorio: z.number(),
          assinados: z.number(),
        }),
        monitores: z.object({
          total: z.number(),
          comRelatorio: z.number(),
          totalmenteAssinados: z.number(),
        }),
        podeExportar: z.boolean(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const service = createRelatoriosNotificationsService(ctx.db)
        return await service.getValidationStatus(input.ano, input.semestre)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),
})
