import { protectedProcedure } from '@/server/api/trpc'
import { inscricaoTable, professorTable } from '@/server/db/schema'
import { candidateEvaluationSchema, idSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'InscricaoRouter.Evaluate' })

export const avaliarCandidato = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/inscricoes/avaliar',
      tags: ['inscricoes'],
      summary: 'Grade candidate',
      description: 'Professor grades a student application',
    },
  })
  .input(candidateEvaluationSchema)
  .output(z.object({ success: z.boolean(), notaFinal: z.number() }))
  .mutation(async ({ input, ctx }) => {
    try {
      if (ctx.user.role !== 'professor') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores podem avaliar candidatos',
        })
      }

      const professor = await ctx.db.query.professorTable.findFirst({
        where: eq(professorTable.userId, ctx.user.id),
      })

      if (!professor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de professor não encontrado',
        })
      }

      const inscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.id, input.inscricaoId),
        with: {
          projeto: true,
        },
      })

      if (!inscricao) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscrição não encontrada',
        })
      }

      if (inscricao.projeto.professorResponsavelId !== professor.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você não pode avaliar candidatos de outros projetos',
        })
      }

      if (inscricao.status !== 'SUBMITTED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Esta inscrição não pode ser avaliada',
        })
      }

      const coeficiente = Number(inscricao.coeficienteRendimento) || 0
      const notaFinal = (input.notaDisciplina * 5 + input.notaSelecao * 3 + coeficiente * 2) / 10

      await ctx.db
        .update(inscricaoTable)
        .set({
          notaDisciplina: input.notaDisciplina.toString(),
          notaSelecao: input.notaSelecao.toString(),
          notaFinal: (Math.round(notaFinal * 100) / 100).toString(),
          updatedAt: new Date(),
        })
        .where(eq(inscricaoTable.id, input.inscricaoId))

      log.info({ inscricaoId: input.inscricaoId, notaFinal }, 'Candidato avaliado com sucesso')

      return {
        success: true,
        notaFinal: Math.round(notaFinal * 100) / 100,
      }
    } catch (error) {
      log.error(error, 'Erro ao avaliar candidato')
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao avaliar candidato',
      })
    }
  })

export const evaluateApplications = protectedProcedure
  .input(
    z.object({
      inscricaoId: idSchema,
      notaDisciplina: z.number().min(0).max(10),
      notaSelecao: z.number().min(0).max(10),
      coeficienteRendimento: z.number().min(0).max(10),
      feedbackProfessor: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== 'professor') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas professores podem avaliar candidatos',
      })
    }

    const notaFinal = (input.notaDisciplina * 5 + input.notaSelecao * 3 + input.coeficienteRendimento * 2) / 10

    const inscricao = await ctx.db.query.inscricaoTable.findFirst({
      where: eq(inscricaoTable.id, input.inscricaoId),
      with: {
        projeto: {
          with: {
            professorResponsavel: true,
          },
        },
      },
    })

    if (!inscricao) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Inscrição não encontrada',
      })
    }

    if (inscricao.projeto.professorResponsavel.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Você não é responsável por este projeto',
      })
    }

    const [updatedInscricao] = await ctx.db
      .update(inscricaoTable)
      .set({
        notaDisciplina: input.notaDisciplina.toString(),
        notaSelecao: input.notaSelecao.toString(),
        coeficienteRendimento: input.coeficienteRendimento.toString(),
        notaFinal: notaFinal.toString(),
        feedbackProfessor: input.feedbackProfessor,
        updatedAt: new Date(),
      })
      .where(eq(inscricaoTable.id, input.inscricaoId))
      .returning()

    return updatedInscricao
  })