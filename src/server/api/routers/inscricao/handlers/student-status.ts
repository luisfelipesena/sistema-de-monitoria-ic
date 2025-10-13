import { protectedProcedure } from '@/server/api/trpc'
import { alunoTable, inscricaoTable } from '@/server/db/schema'
import {
  ACCEPTED_BOLSISTA,
  ACCEPTED_VOLUNTARIO,
  REJECTED_BY_PROFESSOR,
  SELECTED_BOLSISTA,
  SELECTED_VOLUNTARIO,
  idSchema,
} from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'InscricaoRouter.StudentStatus' })

export const getMyStatus = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/inscricao/my-status',
      tags: ['inscricao'],
      summary: 'Get student status',
      description: 'Get current student status in monitoring program',
    },
  })
  .input(z.void())
  .output(
    z.object({
      totalInscricoes: z.number(),
      totalAprovacoes: z.number(),
      monitoriaAtiva: z
        .object({
          id: idSchema,
          projeto: z.object({
            titulo: z.string(),
            disciplinas: z.array(
              z.object({
                codigo: z.string(),
                nome: z.string(),
                turma: z.string(),
              })
            ),
            professorResponsavelNome: z.string(),
          }),
          status: z.string(),
          tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
          dataInicio: z.date().nullable(),
          dataFim: z.date().nullable(),
          cargaHorariaCumprida: z.number().optional(),
          cargaHorariaPlanejada: z.number().optional(),
        })
        .nullable(),
      historicoAtividades: z
        .array(
          z.object({
            tipo: z.string(),
            descricao: z.string(),
            data: z.date(),
          })
        )
        .optional(),
      proximasAcoes: z
        .array(
          z.object({
            titulo: z.string(),
            descricao: z.string(),
            prazo: z.date().optional(),
          })
        )
        .optional(),
    })
  )
  .query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso permitido apenas para estudantes',
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

      const inscricoes = await ctx.db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.alunoId, aluno.id),
        with: {
          projeto: {
            with: {
              professorResponsavel: true,
              disciplinas: {
                with: {
                  disciplina: true,
                },
              },
            },
          },
        },
      })

      const totalInscricoes = inscricoes.length
      const totalAprovacoes = inscricoes.filter(
        (inscricao) =>
          inscricao.status === SELECTED_BOLSISTA ||
          inscricao.status === SELECTED_VOLUNTARIO ||
          inscricao.status === ACCEPTED_BOLSISTA ||
          inscricao.status === ACCEPTED_VOLUNTARIO
      ).length

      const monitoriaAtiva = inscricoes.find(
        (inscricao) => inscricao.status === ACCEPTED_BOLSISTA || inscricao.status === ACCEPTED_VOLUNTARIO
      )

      let monitoriaAtivaFormatted = null
      if (monitoriaAtiva) {
        monitoriaAtivaFormatted = {
          id: monitoriaAtiva.id,
          projeto: {
            titulo: monitoriaAtiva.projeto.titulo,
            disciplinas: monitoriaAtiva.projeto.disciplinas.map((pd) => ({
              codigo: pd.disciplina.codigo,
              nome: pd.disciplina.nome,
              turma: pd.disciplina.turma,
            })),
            professorResponsavelNome: monitoriaAtiva.projeto.professorResponsavel.nomeCompleto,
          },
          status: 'ATIVO',
          tipo: (monitoriaAtiva.tipoVagaPretendida === 'BOLSISTA' ? 'BOLSISTA' : 'VOLUNTARIO') as
            | 'BOLSISTA'
            | 'VOLUNTARIO',
          dataInicio:
            monitoriaAtiva.projeto.ano && monitoriaAtiva.projeto.semestre
              ? new Date(monitoriaAtiva.projeto.ano, monitoriaAtiva.projeto.semestre === 'SEMESTRE_1' ? 2 : 7, 1)
              : null,
          dataFim:
            monitoriaAtiva.projeto.ano && monitoriaAtiva.projeto.semestre
              ? new Date(monitoriaAtiva.projeto.ano, monitoriaAtiva.projeto.semestre === 'SEMESTRE_1' ? 6 : 11, 30)
              : null,
          cargaHorariaCumprida: 0,
          cargaHorariaPlanejada: monitoriaAtiva.projeto.cargaHorariaSemana * monitoriaAtiva.projeto.numeroSemanas,
        }
      }

      const historicoAtividades = inscricoes
        .filter((inscricao) => inscricao.status !== 'SUBMITTED')
        .map((inscricao) => ({
          tipo:
            inscricao.status.includes('SELECTED') || inscricao.status.includes('ACCEPTED') ? 'APROVACAO' : 'INSCRICAO',
          descricao: `${
            inscricao.status.includes('SELECTED') || inscricao.status.includes('ACCEPTED')
              ? 'Aprovado em'
              : 'Inscrito em'
          } ${inscricao.projeto.titulo}`,
          data: inscricao.updatedAt || inscricao.createdAt,
        }))

      const proximasAcoes = []
      if (monitoriaAtiva) {
        const prazoRelatorio =
          monitoriaAtiva.projeto.ano && monitoriaAtiva.projeto.semestre
            ? new Date(monitoriaAtiva.projeto.ano, monitoriaAtiva.projeto.semestre === 'SEMESTRE_1' ? 6 : 11, 15)
            : undefined

        proximasAcoes.push({
          titulo: 'Relatório Final',
          descricao: 'Entregue o relatório final da monitoria',
          prazo: prazoRelatorio,
        })
      }

      return {
        totalInscricoes,
        totalAprovacoes,
        monitoriaAtiva: monitoriaAtivaFormatted,
        historicoAtividades,
        proximasAcoes,
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Error getting student status')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar status do estudante',
      })
    }
  })

export const getMyResults = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/inscricao/my-results',
      tags: ['inscricao'],
      summary: 'Get student results',
      description: 'Get all application results for current student',
    },
  })
  .input(z.void())
  .output(
    z.array(
      z.object({
        id: idSchema,
        projeto: z.object({
          id: idSchema,
          titulo: z.string(),
          disciplinas: z.array(
            z.object({
              codigo: z.string(),
              nome: z.string(),
            })
          ),
          professorResponsavelNome: z.string(),
        }),
        tipoInscricao: z.enum(['BOLSISTA', 'VOLUNTARIO']),
        status: z.enum(['APROVADO', 'REPROVADO', 'EM_ANALISE', 'LISTA_ESPERA']),
        dataResultado: z.date().optional(),
        posicaoLista: z.number().optional(),
        observacoes: z.string().optional(),
      })
    )
  )
  .query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso permitido apenas para estudantes',
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

      const inscricoes = await ctx.db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.alunoId, aluno.id),
        with: {
          projeto: {
            with: {
              professorResponsavel: true,
              disciplinas: {
                with: {
                  disciplina: true,
                },
              },
            },
          },
        },
        orderBy: desc(inscricaoTable.createdAt),
      })

      return inscricoes.map((inscricao) => {
        let status: 'APROVADO' | 'REPROVADO' | 'EM_ANALISE' | 'LISTA_ESPERA'
        switch (inscricao.status) {
          case SELECTED_BOLSISTA:
          case SELECTED_VOLUNTARIO:
          case ACCEPTED_BOLSISTA:
          case ACCEPTED_VOLUNTARIO:
            status = 'APROVADO'
            break
          case REJECTED_BY_PROFESSOR:
            status = 'REPROVADO'
            break
          case 'SUBMITTED':
            status = 'EM_ANALISE'
            break
          default:
            status = 'EM_ANALISE'
        }

        return {
          id: inscricao.id,
          projeto: {
            id: inscricao.projeto.id,
            titulo: inscricao.projeto.titulo,
            disciplinas: inscricao.projeto.disciplinas.map((pd) => ({
              codigo: pd.disciplina.codigo,
              nome: pd.disciplina.nome,
              turma: pd.disciplina.turma,
            })),
            professorResponsavelNome: inscricao.projeto.professorResponsavel.nomeCompleto,
          },
          tipoInscricao: inscricao.tipoVagaPretendida === 'BOLSISTA' ? 'BOLSISTA' : 'VOLUNTARIO',
          status,
          dataResultado: inscricao.updatedAt || undefined,
          posicaoLista: undefined,
          observacoes: inscricao.feedbackProfessor || undefined,
        }
      })
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Error getting student results')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar resultados',
      })
    }
  })
