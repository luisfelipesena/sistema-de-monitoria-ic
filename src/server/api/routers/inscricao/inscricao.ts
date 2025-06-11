import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  inscricaoTable,
  projetoTable,
  alunoTable,
  professorTable,
  disciplinaTable,
  departamentoTable,
  projetoDisciplinaTable,
  userTable,
  periodoInscricaoTable,
} from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
import { eq, and, isNull, gte, lte, desc } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'InscricaoRouter' })

export const criarInscricaoSchema = z.object({
  projetoId: z.number(),
  tipoVagaPretendida: z.enum(['BOLSISTA', 'VOLUNTARIO', 'ANY']),
})

export const inscricaoComDetalhesSchema = z.object({
  id: z.number(),
  projetoId: z.number(),
  alunoId: z.number(),
  tipoVagaPretendida: z.enum(['BOLSISTA', 'VOLUNTARIO', 'ANY']).nullable(),
  status: z.enum([
    'SUBMITTED',
    'SELECTED_BOLSISTA',
    'SELECTED_VOLUNTARIO',
    'ACCEPTED_BOLSISTA',
    'ACCEPTED_VOLUNTARIO',
    'REJECTED_BY_PROFESSOR',
    'REJECTED_BY_STUDENT',
  ]),
  notaDisciplina: z.number().nullable(),
  notaSelecao: z.number().nullable(),
  coeficienteRendimento: z.number().nullable(),
  notaFinal: z.number().nullable(),
  feedbackProfessor: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  projeto: z.object({
    id: z.number(),
    titulo: z.string(),
    descricao: z.string(),
    ano: z.number(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    status: z.enum([
      'DRAFT',
      'SUBMITTED',
      'APPROVED',
      'REJECTED',
      'PENDING_ADMIN_SIGNATURE',
      'PENDING_PROFESSOR_SIGNATURE',
    ]),
    bolsasDisponibilizadas: z.number().nullable(),
    voluntariosSolicitados: z.number().nullable(),
    professorResponsavel: z.object({
      id: z.number(),
      nomeCompleto: z.string(),
      emailInstitucional: z.string(),
    }),
    departamento: z.object({
      id: z.number(),
      nome: z.string(),
    }),
    disciplinas: z.array(
      z.object({
        id: z.number(),
        nome: z.string(),
        codigo: z.string(),
      })
    ),
  }),
  aluno: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    matricula: z.string(),
    cr: z.number(),
    user: z.object({
      id: z.number(),
      email: z.string(),
    }),
  }),
})

export const avaliacaoCandidatoSchema = z.object({
  inscricaoId: z.number(),
  notaDisciplina: z.number().min(0).max(10),
  notaSelecao: z.number().min(0).max(10),
  observacoes: z.string().optional(),
})

export const aceitarInscricaoSchema = z.object({
  inscricaoId: z.number(),
})

export const recusarInscricaoSchema = z.object({
  inscricaoId: z.number(),
  feedbackProfessor: z.string().min(5, 'Motivo da rejeição é obrigatório'),
})

export const inscricaoRouter = createTRPCRouter({
  getMyStatus: protectedProcedure
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
            id: z.number(),
            projeto: z.object({
              titulo: z.string(),
              disciplinas: z.array(
                z.object({
                  codigo: z.string(),
                  nome: z.string(),
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

        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (!aluno) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de estudante não encontrado',
          })
        }

        // Get all inscriptions for this student
        const inscricoes = await db.query.inscricaoTable.findMany({
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
            inscricao.status === 'SELECTED_BOLSISTA' ||
            inscricao.status === 'SELECTED_VOLUNTARIO' ||
            inscricao.status === 'ACCEPTED_BOLSISTA' ||
            inscricao.status === 'ACCEPTED_VOLUNTARIO'
        ).length

        // Check for active monitoring position
        const monitoriaAtiva = inscricoes.find(
          (inscricao) =>
            inscricao.status === 'ACCEPTED_BOLSISTA' || inscricao.status === 'ACCEPTED_VOLUNTARIO'
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
              })),
              professorResponsavelNome: monitoriaAtiva.projeto.professorResponsavel.nomeCompleto,
            },
            status: 'ATIVO',
            tipo: (monitoriaAtiva.tipoVagaPretendida === 'BOLSISTA' ? 'BOLSISTA' : 'VOLUNTARIO') as 'BOLSISTA' | 'VOLUNTARIO',
            dataInicio: null, // TODO: Implement start date tracking
            dataFim: null, // TODO: Implement end date tracking
            cargaHorariaCumprida: 0,
            cargaHorariaPlanejada:
              monitoriaAtiva.projeto.cargaHorariaSemana * monitoriaAtiva.projeto.numeroSemanas,
          }
        }

        // Generate historic activities
        const historicoAtividades = inscricoes
          .filter((inscricao) => inscricao.status !== 'SUBMITTED')
          .map((inscricao) => ({
            tipo: inscricao.status.includes('SELECTED') || inscricao.status.includes('ACCEPTED') ? 'APROVACAO' : 'INSCRICAO',
            descricao: `${
              inscricao.status.includes('SELECTED') || inscricao.status.includes('ACCEPTED') ? 'Aprovado em' : 'Inscrito em'
            } ${inscricao.projeto.titulo}`,
            data: inscricao.updatedAt || inscricao.createdAt,
          }))

        // Generate next actions
        const proximasAcoes = []
        if (monitoriaAtiva) {
          proximasAcoes.push({
            titulo: 'Relatório Final',
            descricao: 'Entregue o relatório final da monitoria',
            prazo: undefined, // TODO: Implement deadline tracking
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
    }),

  createInscricao: protectedProcedure
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
        projetoId: z.number(),
        tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
        motivacao: z.string().min(10, 'Motivação deve ter pelo menos 10 caracteres'),
      })
    )
    .output(z.object({ success: z.boolean(), inscricaoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'student') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso permitido apenas para estudantes',
          })
        }

        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (!aluno) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de estudante não encontrado',
          })
        }

        // Check if project exists and is approved
        const projeto = await db.query.projetoTable.findFirst({
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
        const periodoAtivo = await db.query.periodoInscricaoTable.findFirst({
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
        const existingInscricao = await db.query.inscricaoTable.findFirst({
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

        // Create the inscription
        const [novaInscricao] = await db
          .insert(inscricaoTable)
          .values({
            periodoInscricaoId: periodoAtivo.id,
            projetoId: input.projetoId,
            alunoId: aluno.id,
            tipoVagaPretendida: input.tipo,
            status: 'SUBMITTED',
            coeficienteRendimento: aluno.cr.toString(),
          })
          .returning()

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
    }),

  getMyResults: protectedProcedure
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
          id: z.number(),
          projeto: z.object({
            id: z.number(),
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

        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (!aluno) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de estudante não encontrado',
          })
        }

        const inscricoes = await db.query.inscricaoTable.findMany({
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
            case 'SELECTED_BOLSISTA':
            case 'SELECTED_VOLUNTARIO':
            case 'ACCEPTED_BOLSISTA':
            case 'ACCEPTED_VOLUNTARIO':
              status = 'APROVADO'
              break
            case 'REJECTED_BY_PROFESSOR':
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
    }),
  getMinhasInscricoes: protectedProcedure
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
    .output(z.array(inscricaoComDetalhesSchema))
    .query(async ({ ctx }) => {
      try {
        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (!aluno) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de aluno não encontrado',
          })
        }

        const inscricoes = await db
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
            const disciplinas = await db
              .select({
                id: disciplinaTable.id,
                nome: disciplinaTable.nome,
                codigo: disciplinaTable.codigo,
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
    }),

  criarInscricao: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes',
        tags: ['inscricoes'],
        summary: 'Create application',
        description: 'Create a new project application',
      },
    })
    .input(criarInscricaoSchema)
    .output(z.object({ id: z.number(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'student') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas estudantes podem criar inscrições',
          })
        }

        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (!aluno) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de aluno não encontrado',
          })
        }

        // Verificar se o projeto existe e está aprovado
        const projeto = await db.query.projetoTable.findFirst({
          where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
        })

        if (!projeto) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Projeto não encontrado',
          })
        }

        if (projeto.status !== 'APPROVED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Projeto não está disponível para inscrições',
          })
        }

        // Verificar se período de inscrição está ativo
        const periodoAtivo = await db.query.periodoInscricaoTable.findFirst({
          where: and(
            eq(periodoInscricaoTable.ano, projeto.ano),
            eq(periodoInscricaoTable.semestre, projeto.semestre),
            lte(periodoInscricaoTable.dataInicio, new Date()),
            gte(periodoInscricaoTable.dataFim, new Date())
          ),
        })

        if (!periodoAtivo) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Período de inscrições não está ativo para este projeto',
          })
        }

        // Verificar se já possui inscrição para este projeto
        const inscricaoExistente = await db.query.inscricaoTable.findFirst({
          where: and(eq(inscricaoTable.alunoId, aluno.id), eq(inscricaoTable.projetoId, input.projetoId)),
        })

        if (inscricaoExistente) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Você já possui uma inscrição para este projeto',
          })
        }

        const [novaInscricao] = await db
          .insert(inscricaoTable)
          .values({
            alunoId: aluno.id,
            projetoId: input.projetoId,
            periodoInscricaoId: periodoAtivo.id,
            tipoVagaPretendida: input.tipoVagaPretendida,
            coeficienteRendimento: aluno.cr.toString(),
            status: 'SUBMITTED',
          })
          .returning()

        log.info(
          { inscricaoId: novaInscricao.id, projetoId: input.projetoId, alunoId: aluno.id },
          'Inscrição criada com sucesso'
        )

        return {
          id: novaInscricao.id,
          message: 'Inscrição realizada com sucesso!',
        }
      } catch (error) {
        log.error(error, 'Erro ao criar inscrição')
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar inscrição',
        })
      }
    }),

  aceitarInscricao: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes/aceitar',
        tags: ['inscricoes'],
        summary: 'Accept application',
        description: 'Student accepts a selected application',
      },
    })
    .input(aceitarInscricaoSchema)
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'student') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas estudantes podem aceitar inscrições',
          })
        }

        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (!aluno) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de aluno não encontrado',
          })
        }

        const inscricao = await db.query.inscricaoTable.findFirst({
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

        if (!['SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO'].includes(inscricao.status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Inscrição não está selecionada',
          })
        }

        // Verificar se já aceita bolsa no mesmo semestre (limite de 1 bolsa)
        if (inscricao.status === 'SELECTED_BOLSISTA') {
          const bolsaExistente = await db.query.inscricaoTable.findFirst({
            where: and(eq(inscricaoTable.alunoId, aluno.id), eq(inscricaoTable.status, 'ACCEPTED_BOLSISTA')),
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

        const novoStatus = inscricao.status === 'SELECTED_BOLSISTA' ? 'ACCEPTED_BOLSISTA' : 'ACCEPTED_VOLUNTARIO'

        await db
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
    }),

  recusarInscricao: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes/recusar',
        tags: ['inscricoes'],
        summary: 'Reject application',
        description: 'Student rejects a selected application',
      },
    })
    .input(recusarInscricaoSchema)
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'student') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas estudantes podem recusar inscrições',
          })
        }

        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (!aluno) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de aluno não encontrado',
          })
        }

        const inscricao = await db.query.inscricaoTable.findFirst({
          where: and(eq(inscricaoTable.id, input.inscricaoId), eq(inscricaoTable.alunoId, aluno.id)),
        })

        if (!inscricao) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Inscrição não encontrada',
          })
        }

        if (!['SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO'].includes(inscricao.status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Inscrição não está selecionada',
          })
        }

        await db
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
    }),

  avaliarCandidato: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricoes/avaliar',
        tags: ['inscricoes'],
        summary: 'Grade candidate',
        description: 'Professor grades a student application',
      },
    })
    .input(avaliacaoCandidatoSchema)
    .output(z.object({ success: z.boolean(), notaFinal: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas professores podem avaliar candidatos',
          })
        }

        const professor = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de professor não encontrado',
          })
        }

        const inscricao = await db.query.inscricaoTable.findFirst({
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

        // Calcular nota final: (notaDisciplina * 5 + notaSelecao * 3 + coeficienteRendimento * 2) / 10
        const coeficiente = Number(inscricao.coeficienteRendimento) || 0
        const notaFinal = (input.notaDisciplina * 5 + input.notaSelecao * 3 + coeficiente * 2) / 10

        await db
          .update(inscricaoTable)
          .set({
            notaDisciplina: input.notaDisciplina.toString(),
            notaSelecao: input.notaSelecao.toString(),
            notaFinal: (Math.round(notaFinal * 100) / 100).toString(), // Arredondar para 2 casas decimais
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
    }),

  getInscricoesProjeto: protectedProcedure
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
        projetoId: z.number(),
      })
    )
    .output(z.array(inscricaoComDetalhesSchema))
    .query(async ({ input, ctx }) => {
      try {
        const projeto = await db.query.projetoTable.findFirst({
          where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
        })

        if (!projeto) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Projeto não encontrado',
          })
        }

        // Verificar permissão de acesso
        if (ctx.user.role === 'professor') {
          const professor = await db.query.professorTable.findFirst({
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

        const inscricoes = await db
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
            const disciplinas = await db
              .select({
                id: disciplinaTable.id,
                nome: disciplinaTable.nome,
                codigo: disciplinaTable.codigo,
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
    }),

    evaluateApplications: protectedProcedure
    .input(z.object({
      inscricaoId: z.number(),
      notaDisciplina: z.number().min(0).max(10),
      notaSelecao: z.number().min(0).max(10), 
      coeficienteRendimento: z.number().min(0).max(10),
      feedbackProfessor: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'professor') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores podem avaliar candidatos',
        });
      }

      // Calcular nota final: (disciplina×5 + seleção×3 + CR×2) / 10
      const notaFinal = (
        (input.notaDisciplina * 5) + 
        (input.notaSelecao * 3) + 
        (input.coeficienteRendimento * 2)
      ) / 10;

      // Verificar se o professor é responsável pelo projeto
      const inscricao = await db.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.id, input.inscricaoId),
        with: {
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
        },
      });

      if (!inscricao) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscrição não encontrada',
        });
      }

      if (inscricao.projeto.professorResponsavel.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN', 
          message: 'Você não é responsável por este projeto',
        });
      }

      // Atualizar a inscrição com as notas
      const [updatedInscricao] = await db
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
        .returning();

      return updatedInscricao;
    }),
})