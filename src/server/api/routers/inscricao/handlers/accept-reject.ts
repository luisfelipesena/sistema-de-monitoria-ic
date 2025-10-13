import { protectedProcedure } from '@/server/api/trpc'
import { alunoTable, inscricaoTable } from '@/server/db/schema'
import {
  ACCEPTED_BOLSISTA,
  ACCEPTED_VOLUNTARIO,
  acceptInscriptionSchema,
  idSchema,
  rejectInscriptionSchema,
  SELECTED_BOLSISTA,
  SELECTED_VOLUNTARIO,
} from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'InscricaoRouter.AcceptReject' })

export const aceitarInscricao = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/inscricoes/aceitar',
      tags: ['inscricoes'],
      summary: 'Accept application',
      description: 'Student accepts a selected application',
    },
  })
  .input(acceptInscriptionSchema)
  .output(z.object({ success: z.boolean(), message: z.string() }))
  .mutation(async ({ input, ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas estudantes podem aceitar inscrições',
        })
      }

      const aluno = await ctx.db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      })

      if (!aluno) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de aluno não encontrado',
        })
      }

      const inscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: and(eq(inscricaoTable.id, input.inscricaoId), eq(inscricaoTable.alunoId, aluno.id)),
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

      if (inscricao.status !== SELECTED_BOLSISTA && inscricao.status !== SELECTED_VOLUNTARIO) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Inscrição não está selecionada',
        })
      }

      if (inscricao.status === SELECTED_BOLSISTA) {
        const bolsaExistente = await ctx.db.query.inscricaoTable.findFirst({
          where: and(eq(inscricaoTable.alunoId, aluno.id), eq(inscricaoTable.status, ACCEPTED_BOLSISTA)),
          with: {
            projeto: true,
          },
        })

        if (
          bolsaExistente &&
          bolsaExistente.projeto.ano === inscricao.projeto.ano &&
          bolsaExistente.projeto.semestre === inscricao.projeto.semestre
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Você já possui uma bolsa aceita neste semestre',
          })
        }
      }

      const novoStatus = inscricao.status === SELECTED_BOLSISTA ? ACCEPTED_BOLSISTA : ACCEPTED_VOLUNTARIO

      await ctx.db
        .update(inscricaoTable)
        .set({
          status: novoStatus,
          updatedAt: new Date(),
        })
        .where(eq(inscricaoTable.id, input.inscricaoId))

      log.info({ inscricaoId: input.inscricaoId, novoStatus }, 'Inscrição aceita com sucesso')

      return {
        success: true,
        message: 'Inscrição aceita com sucesso!',
      }
    } catch (error) {
      log.error(error, 'Erro ao aceitar inscrição')
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao aceitar inscrição',
      })
    }
  })

export const recusarInscricao = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/inscricoes/recusar',
      tags: ['inscricoes'],
      summary: 'Reject application',
      description: 'Student rejects a selected application',
    },
  })
  .input(rejectInscriptionSchema)
  .output(z.object({ success: z.boolean(), message: z.string() }))
  .mutation(async ({ input, ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas estudantes podem recusar inscrições',
        })
      }

      const aluno = await ctx.db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      })

      if (!aluno) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de aluno não encontrado',
        })
      }

      const inscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: and(eq(inscricaoTable.id, input.inscricaoId), eq(inscricaoTable.alunoId, aluno.id)),
      })

      if (!inscricao) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscrição não encontrada',
        })
      }

      if (inscricao.status !== SELECTED_BOLSISTA && inscricao.status !== SELECTED_VOLUNTARIO) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Inscrição não está selecionada',
        })
      }

      await ctx.db
        .update(inscricaoTable)
        .set({
          status: 'REJECTED_BY_STUDENT',
          feedbackProfessor: input.feedbackProfessor,
          updatedAt: new Date(),
        })
        .where(eq(inscricaoTable.id, input.inscricaoId))

      log.info({ inscricaoId: input.inscricaoId }, 'Inscrição recusada pelo estudante')

      return {
        success: true,
        message: 'Inscrição recusada com sucesso!',
      }
    } catch (error) {
      log.error(error, 'Erro ao recusar inscrição')
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao recusar inscrição',
      })
    }
  })

export const acceptPosition = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/inscricoes/{inscricaoId}/accept',
      tags: ['inscricoes'],
      summary: 'Accept position',
      description: 'Accept offered position (scholarship or volunteer)',
    },
  })
  .input(
    z.object({
      inscricaoId: idSchema,
    })
  )
  .output(z.object({ success: z.boolean(), message: z.string() }))
  .mutation(async ({ input, ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas estudantes podem aceitar vagas',
        })
      }

      const aluno = await ctx.db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      })

      if (!aluno) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de estudante não encontrado',
        })
      }

      const inscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: and(eq(inscricaoTable.id, input.inscricaoId), eq(inscricaoTable.alunoId, aluno.id)),
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

      if (!inscricao.status.startsWith('SELECTED_')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível aceitar uma vaga não oferecida',
        })
      }

      if (inscricao.status === SELECTED_BOLSISTA) {
        const bolsaExistente = await ctx.db.query.inscricaoTable.findFirst({
          where: and(eq(inscricaoTable.alunoId, aluno.id), eq(inscricaoTable.status, ACCEPTED_BOLSISTA)),
          with: {
            projeto: true,
          },
        })

        if (
          bolsaExistente &&
          bolsaExistente.projeto.ano === inscricao.projeto.ano &&
          bolsaExistente.projeto.semestre === inscricao.projeto.semestre
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Você já possui uma bolsa neste semestre. Só é permitida uma bolsa por semestre.',
          })
        }
      }

      const newStatus = inscricao.status === SELECTED_BOLSISTA ? ACCEPTED_BOLSISTA : ACCEPTED_VOLUNTARIO

      await ctx.db
        .update(inscricaoTable)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(inscricaoTable.id, input.inscricaoId))

      const tipoVaga = newStatus === ACCEPTED_BOLSISTA ? 'bolsista' : 'voluntária'
      log.info({ inscricaoId: input.inscricaoId, newStatus }, `Vaga ${tipoVaga} aceita`)

      return {
        success: true,
        message: `Vaga ${tipoVaga} aceita com sucesso!`,
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Erro ao aceitar vaga')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao aceitar vaga',
      })
    }
  })

export const rejectPosition = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/inscricoes/{inscricaoId}/reject',
      tags: ['inscricoes'],
      summary: 'Reject position',
      description: 'Reject offered position',
    },
  })
  .input(
    z.object({
      inscricaoId: idSchema,
      motivo: z.string().optional(),
    })
  )
  .output(z.object({ success: z.boolean(), message: z.string() }))
  .mutation(async ({ input, ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas estudantes podem recusar vagas',
        })
      }

      const aluno = await ctx.db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      })

      if (!aluno) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de estudante não encontrado',
        })
      }

      const inscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: and(eq(inscricaoTable.id, input.inscricaoId), eq(inscricaoTable.alunoId, aluno.id)),
      })

      if (!inscricao) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscrição não encontrada',
        })
      }

      if (!inscricao.status.startsWith('SELECTED_')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível recusar uma vaga não oferecida',
        })
      }

      await ctx.db
        .update(inscricaoTable)
        .set({
          status: 'REJECTED_BY_STUDENT',
          feedbackProfessor: input.motivo || 'Vaga recusada pelo estudante',
          updatedAt: new Date(),
        })
        .where(eq(inscricaoTable.id, input.inscricaoId))

      const tipoVaga = inscricao.status === SELECTED_BOLSISTA ? 'bolsista' : 'voluntária'
      log.info({ inscricaoId: input.inscricaoId, motivo: input.motivo }, `Vaga ${tipoVaga} recusada`)

      return {
        success: true,
        message: `Vaga ${tipoVaga} recusada com sucesso.`,
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Erro ao recusar vaga')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao recusar vaga',
      })
    }
  })
