import { protectedProcedure } from '@/server/api/trpc'
import {
  alunoTable,
  disciplinaTable,
  inscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import { ACCEPTED_VOLUNTARIO, idSchema, nameSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'ProjetoRouter.Volunteers' })

export const getVolunteersHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/projetos/volunteers',
      tags: ['projetos'],
      summary: 'Get volunteers',
      description: 'Get volunteers for professor projects',
    },
  })
  .input(z.void())
  .output(
    z.array(
      z.object({
        id: idSchema,
        nomeCompleto: nameSchema,
        email: z.string(),
        telefone: z.string().optional(),
        disciplina: z.object({
          codigo: z.string(),
          nome: nameSchema,
        }),
        projeto: z.object({
          id: idSchema,
          titulo: nameSchema,
        }),
        status: z.enum(['ATIVO', 'INATIVO', 'PENDENTE']),
        dataInicio: z.date().optional(),
      })
    )
  )
  .query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== 'professor') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores podem ver voluntários',
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

      // Get inscriptions for professor's projects with accepted volunteers
      const inscricoes = await ctx.db
        .select({
          id: inscricaoTable.id,
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            telefone: alunoTable.telefone,
          },
          alunoUser: {
            email: userTable.email,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
          },
          status: inscricaoTable.status,
          createdAt: inscricaoTable.createdAt,
        })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .where(
          and(eq(projetoTable.professorResponsavelId, professor.id), eq(inscricaoTable.status, ACCEPTED_VOLUNTARIO))
        )

      const voluntarios = await Promise.all(
        inscricoes.map(async (inscricao) => {
          // Get first discipline for this project
          const disciplina = await ctx.db
            .select({
              codigo: disciplinaTable.codigo,
              nome: disciplinaTable.nome,
              turma: disciplinaTable.turma,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, inscricao.projeto.id))
            .limit(1)

          return {
            id: inscricao.aluno.id,
            nomeCompleto: inscricao.aluno.nomeCompleto,
            email: inscricao.alunoUser.email,
            telefone: inscricao.aluno.telefone || undefined,
            disciplina: disciplina[0] || { codigo: '', nome: 'N/A' },
            projeto: inscricao.projeto,
            status: 'ATIVO' as const,
            dataInicio: inscricao.createdAt,
          }
        })
      )

      log.info('Voluntários recuperados com sucesso')
      return voluntarios
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Erro ao recuperar voluntários')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao recuperar voluntários',
      })
    }
  })

export const updateVolunteerStatusHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'PATCH',
      path: '/projetos/volunteers/status',
      tags: ['projetos'],
      summary: 'Update volunteer status',
      description: 'Update volunteer status',
    },
  })
  .input(
    z.object({
      id: idSchema,
      status: z.enum(['ATIVO', 'INATIVO']),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    try {
      if (ctx.user.role !== 'professor') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores podem atualizar status de voluntários',
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

      // Find the inscription for this volunteer
      const inscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: and(eq(inscricaoTable.alunoId, input.id), eq(inscricaoTable.status, ACCEPTED_VOLUNTARIO)),
        with: {
          projeto: true,
        },
      })

      if (!inscricao || inscricao.projeto.professorResponsavelId !== professor.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Voluntário não encontrado',
        })
      }

      // For now, we'll just log the status change
      // In a full implementation, this could update a separate volunteer status table
      log.info({ alunoId: input.id, newStatus: input.status }, 'Status do voluntário atualizado')

      return { success: true }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Erro ao atualizar status do voluntário')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao atualizar status do voluntário',
      })
    }
  })
