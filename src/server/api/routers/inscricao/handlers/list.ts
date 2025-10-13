import { protectedProcedure } from '@/server/api/trpc'
import {
  alunoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import { idSchema, inscriptionDetailSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'InscricaoRouter.List' })

export const getMinhasInscricoes = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/inscricoes/minhas',
      tags: ['inscricoes'],
      summary: 'Get my applications',
      description: 'Get all applications for the authenticated student',
    },
  })
  .input(z.void())
  .output(z.array(inscriptionDetailSchema))
  .query(async ({ ctx }) => {
    try {
      const aluno = await ctx.db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      })

      if (!aluno) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de aluno não encontrado',
        })
      }

      const inscricoes = await ctx.db
        .select({
          id: inscricaoTable.id,
          projetoId: inscricaoTable.projetoId,
          alunoId: inscricaoTable.alunoId,
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          status: inscricaoTable.status,
          notaDisciplina: inscricaoTable.notaDisciplina,
          notaSelecao: inscricaoTable.notaSelecao,
          coeficienteRendimento: inscricaoTable.coeficienteRendimento,
          notaFinal: inscricaoTable.notaFinal,
          feedbackProfessor: inscricaoTable.feedbackProfessor,
          createdAt: inscricaoTable.createdAt,
          updatedAt: inscricaoTable.updatedAt,
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            descricao: projetoTable.descricao,
            ano: projetoTable.ano,
            semestre: projetoTable.semestre,
            status: projetoTable.status,
            bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
            voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          },
          professorResponsavel: {
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
            emailInstitucional: professorTable.emailInstitucional,
          },
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
          },
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
            cr: alunoTable.cr,
          },
          alunoUser: {
            id: userTable.id,
            email: userTable.email,
          },
        })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .where(eq(inscricaoTable.alunoId, aluno.id))
        .orderBy(inscricaoTable.createdAt)

      const inscricoesComDisciplinas = await Promise.all(
        inscricoes.map(async (inscricao) => {
          const disciplinas = await ctx.db
            .select({
              id: disciplinaTable.id,
              nome: disciplinaTable.nome,
              codigo: disciplinaTable.codigo,
              turma: disciplinaTable.turma,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, inscricao.projetoId))

          return {
            ...inscricao,
            notaDisciplina: inscricao.notaDisciplina ? Number(inscricao.notaDisciplina) : null,
            notaSelecao: inscricao.notaSelecao ? Number(inscricao.notaSelecao) : null,
            coeficienteRendimento: inscricao.coeficienteRendimento ? Number(inscricao.coeficienteRendimento) : null,
            notaFinal: inscricao.notaFinal ? Number(inscricao.notaFinal) : null,
            projeto: {
              ...inscricao.projeto,
              professorResponsavel: inscricao.professorResponsavel,
              departamento: inscricao.departamento,
              disciplinas,
            },
            aluno: {
              ...inscricao.aluno,
              user: inscricao.alunoUser,
            },
          }
        })
      )

      log.info({ alunoId: aluno.id }, 'Inscrições recuperadas com sucesso')
      return inscricoesComDisciplinas
    } catch (error) {
      log.error(error, 'Erro ao recuperar inscrições')
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao recuperar inscrições',
      })
    }
  })

export const getInscricoesProjeto = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/inscricoes/projeto',
      tags: ['inscricoes'],
      summary: 'Get project applications',
      description: 'Get all applications for a specific project (professor/admin only)',
    },
  })
  .input(
    z.object({
      projetoId: idSchema,
    })
  )
  .output(z.array(inscriptionDetailSchema))
  .query(async ({ input, ctx }) => {
    try {
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (ctx.user.role === 'professor') {
        const professor = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado a este projeto',
          })
        }
      } else if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado',
        })
      }

      const inscricoes = await ctx.db
        .select({
          id: inscricaoTable.id,
          projetoId: inscricaoTable.projetoId,
          alunoId: inscricaoTable.alunoId,
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          status: inscricaoTable.status,
          notaDisciplina: inscricaoTable.notaDisciplina,
          notaSelecao: inscricaoTable.notaSelecao,
          coeficienteRendimento: inscricaoTable.coeficienteRendimento,
          notaFinal: inscricaoTable.notaFinal,
          feedbackProfessor: inscricaoTable.feedbackProfessor,
          createdAt: inscricaoTable.createdAt,
          updatedAt: inscricaoTable.updatedAt,
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            descricao: projetoTable.descricao,
            ano: projetoTable.ano,
            semestre: projetoTable.semestre,
            status: projetoTable.status,
            bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
            voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          },
          professorResponsavel: {
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
            emailInstitucional: professorTable.emailInstitucional,
          },
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
          },
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
            cr: alunoTable.cr,
          },
          alunoUser: {
            id: userTable.id,
            email: userTable.email,
          },
        })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .where(eq(inscricaoTable.projetoId, input.projetoId))
        .orderBy(inscricaoTable.notaFinal, inscricaoTable.createdAt)

      const inscricoesComDisciplinas = await Promise.all(
        inscricoes.map(async (inscricao) => {
          const disciplinas = await ctx.db
            .select({
              id: disciplinaTable.id,
              nome: disciplinaTable.nome,
              codigo: disciplinaTable.codigo,
              turma: disciplinaTable.turma,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, inscricao.projetoId))

          return {
            ...inscricao,
            notaDisciplina: inscricao.notaDisciplina ? Number(inscricao.notaDisciplina) : null,
            notaSelecao: inscricao.notaSelecao ? Number(inscricao.notaSelecao) : null,
            coeficienteRendimento: inscricao.coeficienteRendimento ? Number(inscricao.coeficienteRendimento) : null,
            notaFinal: inscricao.notaFinal ? Number(inscricao.notaFinal) : null,
            projeto: {
              ...inscricao.projeto,
              professorResponsavel: inscricao.professorResponsavel,
              departamento: inscricao.departamento,
              disciplinas,
            },
            aluno: {
              ...inscricao.aluno,
              user: inscricao.alunoUser,
            },
          }
        })
      )

      log.info({ projetoId: input.projetoId }, 'Inscrições do projeto recuperadas com sucesso')
      return inscricoesComDisciplinas
    } catch (error) {
      log.error(error, 'Erro ao recuperar inscrições do projeto')
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao recuperar inscrições do projeto',
      })
    }
  })