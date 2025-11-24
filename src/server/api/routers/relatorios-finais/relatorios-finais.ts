import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { createRelatoriosFinaisService } from '@/server/services/relatorios-finais'
import {
  anoSchema,
  createRelatorioFinalDisciplinaInputSchema,
  createRelatorioFinalMonitorInputSchema,
  semestreSchema,
  updateRelatorioFinalDisciplinaInputSchema,
  updateRelatorioFinalMonitorInputSchema,
} from '@/types'
import { BusinessError, ForbiddenError, NotFoundError } from '@/types/errors'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

function mapDomainErrorToTRPC(error: unknown): never {
  if (error instanceof NotFoundError) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: error.message,
    })
  }

  if (error instanceof ForbiddenError) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: error.message,
    })
  }

  if (error instanceof BusinessError) {
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

export const relatoriosFinaisRouter = createTRPCRouter({
  // ========================================
  // PROFESSOR - RELATORIO DISCIPLINA
  // ========================================

  listRelatoriosDisciplina: protectedProcedure
    .input(
      z.object({
        ano: anoSchema.optional(),
        semestre: semestreSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'professor' && ctx.user.role !== 'admin') {
          throw new ForbiddenError('Apenas professores podem acessar esta funcionalidade')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.listRelatoriosDisciplinaForProfessor(ctx.user.id, input.ano, input.semestre)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  getRelatorioDisciplina: protectedProcedure
    .input(z.object({ projetoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'professor' && ctx.user.role !== 'admin') {
          throw new ForbiddenError('Apenas professores podem acessar esta funcionalidade')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.getRelatorioDisciplina(ctx.user.id, input.projetoId)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  createRelatorioDisciplina: protectedProcedure
    .input(createRelatorioFinalDisciplinaInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new ForbiddenError('Apenas professores podem criar relatórios')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.createRelatorioDisciplina(ctx.user.id, input)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  updateRelatorioDisciplina: protectedProcedure
    .input(updateRelatorioFinalDisciplinaInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new ForbiddenError('Apenas professores podem editar relatórios')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.updateRelatorioDisciplina(ctx.user.id, input)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  signRelatorioDisciplina: protectedProcedure
    .input(z.object({ relatorioId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new ForbiddenError('Apenas professores podem assinar relatórios')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.signRelatorioDisciplina(ctx.user.id, input.relatorioId)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  // ========================================
  // PROFESSOR - RELATORIO MONITOR
  // ========================================

  getRelatorioMonitor: protectedProcedure
    .input(z.object({ relatorioId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'professor' && ctx.user.role !== 'admin') {
          throw new ForbiddenError('Apenas professores podem acessar esta funcionalidade')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.getRelatorioMonitor(ctx.user.id, input.relatorioId)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  createRelatorioMonitor: protectedProcedure
    .input(createRelatorioFinalMonitorInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new ForbiddenError('Apenas professores podem criar relatórios de monitores')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.createRelatorioMonitor(ctx.user.id, input)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  updateRelatorioMonitor: protectedProcedure
    .input(updateRelatorioFinalMonitorInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new ForbiddenError('Apenas professores podem editar relatórios de monitores')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.updateRelatorioMonitor(ctx.user.id, input)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  signRelatorioMonitorAsProfessor: protectedProcedure
    .input(z.object({ relatorioId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new ForbiddenError('Apenas professores podem assinar relatórios')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.signRelatorioMonitorAsProfessor(ctx.user.id, input.relatorioId)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  // ========================================
  // ALUNO - RELATORIO MONITOR
  // ========================================

  listRelatoriosPendentesAluno: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new ForbiddenError('Apenas alunos podem acessar esta funcionalidade')
      }

      const service = createRelatoriosFinaisService(ctx.db)
      return await service.listRelatoriosPendentesParaAluno(ctx.user.id)
    } catch (error) {
      mapDomainErrorToTRPC(error)
    }
  }),

  getRelatorioMonitorAluno: protectedProcedure
    .input(z.object({ relatorioId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'student') {
          throw new ForbiddenError('Apenas alunos podem acessar esta funcionalidade')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.getRelatorioMonitorParaAluno(ctx.user.id, input.relatorioId)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),

  signRelatorioMonitorAsAluno: protectedProcedure
    .input(z.object({ relatorioId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'student') {
          throw new ForbiddenError('Apenas alunos podem assinar relatórios')
        }

        const service = createRelatoriosFinaisService(ctx.db)
        return await service.signRelatorioMonitorAsAluno(ctx.user.id, input.relatorioId)
      } catch (error) {
        mapDomainErrorToTRPC(error)
      }
    }),
})
