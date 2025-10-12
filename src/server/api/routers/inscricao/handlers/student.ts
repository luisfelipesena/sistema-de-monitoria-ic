import { protectedProcedure } from '@/server/api/trpc'
import {
  alunoTable,
  inscricaoDocumentoTable,
  inscricaoTable,
  periodoInscricaoTable,
  projetoTable,
} from '@/server/db/schema'
import {
  ACCEPTED_BOLSISTA,
  ACCEPTED_VOLUNTARIO,
  idSchema,
  REJECTED_BY_PROFESSOR,
  SELECTED_BOLSISTA,
  SELECTED_VOLUNTARIO,
  tipoVagaSchema,
} from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'InscricaoRouter.Student' })

export const getMyStatusHandler = protectedProcedure
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
          tipo: tipoVagaSchema,
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

      // Get all inscriptions for this student
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

      // Check for active monitoring position
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

      // Generate historic activities
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

      // Generate next actions
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

export const createInscricaoHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/inscricao/create',
      tags: ['inscricao'],
      summary: 'Create application',
      description: 'Create new application for monitoring project',
    },
  })
  .input(
    z.object({
      projetoId: idSchema,
      tipo: tipoVagaSchema,
      motivacao: z.string().min(10, 'Motivação deve ter pelo menos 10 caracteres'),
      documentos: z
        .array(
          z.object({
            fileId: z.string(),
            tipoDocumento: z.string(),
          })
        )
        .optional(),
    })
  )
  .output(z.object({ success: z.boolean(), inscricaoId: idSchema }))
  .mutation(async ({ input, ctx }) => {
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

      // Check if project exists and is approved
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
      })

      if (!projeto || projeto.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado ou não aprovado',
        })
      }

      // Get current active inscription period
      const now = new Date()
      const periodoAtivo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(
          eq(periodoInscricaoTable.ano, projeto.ano),
          eq(periodoInscricaoTable.semestre, projeto.semestre),
          lte(periodoInscricaoTable.dataInicio, now),
          gte(periodoInscricaoTable.dataFim, now)
        ),
      })

      if (!periodoAtivo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Período de inscrições não está ativo',
        })
      }

      // Check if student already applied to this project
      const existingInscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: and(
          eq(inscricaoTable.alunoId, aluno.id),
          eq(inscricaoTable.projetoId, input.projetoId),
          eq(inscricaoTable.periodoInscricaoId, periodoAtivo.id)
        ),
      })

      if (existingInscricao) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Você já se inscreveu neste projeto',
        })
      }

      // Validar dados obrigatórios
      if (!input.tipo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tipo de vaga é obrigatório',
        })
      }

      // Verificar se há vagas disponíveis
      if (input.tipo === 'BOLSISTA' && (!projeto.bolsasDisponibilizadas || projeto.bolsasDisponibilizadas <= 0)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não há vagas de bolsista disponíveis para este projeto',
        })
      }

      if (input.tipo === 'VOLUNTARIO' && (!projeto.voluntariosSolicitados || projeto.voluntariosSolicitados <= 0)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não há vagas de voluntário disponíveis para este projeto',
        })
      }

      // Create the inscription
      const [novaInscricao] = await ctx.db
        .insert(inscricaoTable)
        .values({
          periodoInscricaoId: periodoAtivo.id,
          projetoId: input.projetoId,
          alunoId: aluno.id,
          tipoVagaPretendida: input.tipo,
          status: 'SUBMITTED',
          coeficienteRendimento: aluno.cr?.toString() || null,
        })
        .returning()

      if (input.documentos && input.documentos.length > 0) {
        const documentosToInsert = input.documentos.map((doc) => ({
          inscricaoId: novaInscricao.id,
          fileId: doc.fileId,
          tipoDocumento: doc.tipoDocumento,
        }))
        await ctx.db.insert(inscricaoDocumentoTable).values(documentosToInsert)
      }

      log.info({ inscricaoId: novaInscricao.id }, 'Nova inscrição criada')

      return {
        success: true,
        inscricaoId: novaInscricao.id,
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Error creating inscription')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao criar inscrição',
      })
    }
  })

export const getMyResultsHandler = protectedProcedure
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
        tipoInscricao: tipoVagaSchema,
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
        // Map status from DB to display format
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
