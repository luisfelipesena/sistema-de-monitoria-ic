import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
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
  inscricaoDocumentoTable,
} from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
import { eq, and, isNull, gte, lte, desc } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'InscricaoRouter' })

export const criarInscricaoSchema = z.object({
  projetoId: z.number(),
  tipoVagaPretendida: z.enum(['BOLSISTA', 'VOLUNTARIO', 'ANY']),
  documentos: z
    .array(
      z.object({
        fileId: z.string(),
        tipoDocumento: z.string(),
      })
    )
    .optional(),
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
            inscricao.status === 'SELECTED_BOLSISTA' ||
            inscricao.status === 'SELECTED_VOLUNTARIO' ||
            inscricao.status === 'ACCEPTED_BOLSISTA' ||
            inscricao.status === 'ACCEPTED_VOLUNTARIO'
        ).length

        // Check for active monitoring position
        const monitoriaAtiva = inscricoes.find(
          (inscricao) => inscricao.status === 'ACCEPTED_BOLSISTA' || inscricao.status === 'ACCEPTED_VOLUNTARIO'
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
              inscricao.status.includes('SELECTED') || inscricao.status.includes('ACCEPTED')
                ? 'APROVACAO'
                : 'INSCRICAO',
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
    .output(z.object({ success: z.boolean(), inscricaoId: z.number() }))
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

        // Create the inscription
        const [novaInscricao] = await ctx.db
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

        const aluno = await ctx.db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (!aluno) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de aluno não encontrado',
          })
        }

        // Verificar se o projeto existe e está aprovado
        const projeto = await ctx.db.query.projetoTable.findFirst({
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
        const periodoAtivo = await ctx.db.query.periodoInscricaoTable.findFirst({
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
        const inscricaoExistente = await ctx.db.query.inscricaoTable.findFirst({
          where: and(eq(inscricaoTable.alunoId, aluno.id), eq(inscricaoTable.projetoId, input.projetoId)),
        })

        if (inscricaoExistente) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Você já possui uma inscrição para este projeto',
          })
        }

        const [novaInscricao] = await ctx.db
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

        if (input.documentos && input.documentos.length > 0) {
          const documentosToInsert = input.documentos.map((doc) => ({
            inscricaoId: novaInscricao.id,
            fileId: doc.fileId,
            tipoDocumento: doc.tipoDocumento,
          }))
          await ctx.db.insert(inscricaoDocumentoTable).values(documentosToInsert)
        }

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

        if (!['SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO'].includes(inscricao.status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Inscrição não está selecionada',
          })
        }

        // Verificar se já aceita bolsa no mesmo semestre (limite de 1 bolsa)
        if (inscricao.status === 'SELECTED_BOLSISTA') {
          const bolsaExistente = await ctx.db.query.inscricaoTable.findFirst({
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

        if (!['SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO'].includes(inscricao.status)) {
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

        // Calcular nota final: (notaDisciplina * 5 + notaSelecao * 3 + coeficienteRendimento * 2) / 10
        const coeficiente = Number(inscricao.coeficienteRendimento) || 0
        const notaFinal = (input.notaDisciplina * 5 + input.notaSelecao * 3 + coeficiente * 2) / 10

        await ctx.db
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
        const projeto = await ctx.db.query.projetoTable.findFirst({
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
    .input(
      z.object({
        inscricaoId: z.number(),
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

      // Calcular nota final: (disciplina×5 + seleção×3 + CR×2) / 10
      const notaFinal = (input.notaDisciplina * 5 + input.notaSelecao * 3 + input.coeficienteRendimento * 2) / 10

      // Verificar se o professor é responsável pelo projeto
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

      // Atualizar a inscrição com as notas
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
    }),

  // Aceitar vaga oferecida
  acceptPosition: protectedProcedure
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
        inscricaoId: z.number(),
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

        // Buscar a inscrição
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

        // Verificar se foi selecionado
        if (!inscricao.status.startsWith('SELECTED_')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível aceitar uma vaga não oferecida',
          })
        }

        // Se for bolsista, verificar se já tem bolsa no semestre
        if (inscricao.status === 'SELECTED_BOLSISTA') {
          const bolsaExistente = await ctx.db.query.inscricaoTable.findFirst({
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
              message: 'Você já possui uma bolsa neste semestre. Só é permitida uma bolsa por semestre.',
            })
          }
        }

        // Atualizar status para aceito
        const newStatus = inscricao.status === 'SELECTED_BOLSISTA' ? 'ACCEPTED_BOLSISTA' : 'ACCEPTED_VOLUNTARIO'

        await ctx.db
          .update(inscricaoTable)
          .set({
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(inscricaoTable.id, input.inscricaoId))

        const tipoVaga = newStatus === 'ACCEPTED_BOLSISTA' ? 'bolsista' : 'voluntária'
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
    }),

  // Recusar vaga oferecida
  rejectPosition: protectedProcedure
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
        inscricaoId: z.number(),
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

        // Buscar a inscrição
        const inscricao = await ctx.db.query.inscricaoTable.findFirst({
          where: and(eq(inscricaoTable.id, input.inscricaoId), eq(inscricaoTable.alunoId, aluno.id)),
        })

        if (!inscricao) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Inscrição não encontrada',
          })
        }

        // Verificar se foi selecionado
        if (!inscricao.status.startsWith('SELECTED_')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível recusar uma vaga não oferecida',
          })
        }

        // Atualizar status para recusado
        await ctx.db
          .update(inscricaoTable)
          .set({
            status: 'REJECTED_BY_STUDENT',
            feedbackProfessor: input.motivo || 'Vaga recusada pelo estudante',
            updatedAt: new Date(),
          })
          .where(eq(inscricaoTable.id, input.inscricaoId))

        const tipoVaga = inscricao.status === 'SELECTED_BOLSISTA' ? 'bolsista' : 'voluntária'
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
    }),

  // Gerar dados para termo de compromisso
  generateCommitmentTermData: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/inscricoes/{inscricaoId}/termo-compromisso-data',
        tags: ['inscricoes'],
        summary: 'Get commitment term data',
        description: 'Get data for generating commitment term PDF',
      },
    })
    .input(z.object({ inscricaoId: z.number() }))
    .output(
      z.object({
        monitor: z.object({
          nome: z.string(),
          matricula: z.string(),
          email: z.string(),
          telefone: z.string().optional(),
          cr: z.number(),
        }),
        professor: z.object({
          nome: z.string(),
          matriculaSiape: z.string().optional(),
          email: z.string(),
          departamento: z.string(),
        }),
        projeto: z.object({
          titulo: z.string(),
          disciplinas: z.array(
            z.object({
              codigo: z.string(),
              nome: z.string(),
            })
          ),
          ano: z.number(),
          semestre: z.string(),
          cargaHorariaSemana: z.number(),
          numeroSemanas: z.number(),
        }),
        monitoria: z.object({
          tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
          dataInicio: z.string(),
          dataFim: z.string(),
          valorBolsa: z.number().optional(),
        }),
        termo: z.object({
          numero: z.string(),
          dataGeracao: z.string(),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Buscar a inscrição com todos os dados necessários
        const inscricao = await ctx.db.query.inscricaoTable.findFirst({
          where: eq(inscricaoTable.id, input.inscricaoId),
          with: {
            aluno: {
              with: {
                user: true,
              },
            },
            projeto: {
              with: {
                professorResponsavel: true,
                departamento: true,
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

        // Verificar se o usuário tem acesso a esta inscrição
        if (ctx.user.role === 'student') {
          const aluno = await ctx.db.query.alunoTable.findFirst({
            where: eq(alunoTable.userId, ctx.user.id),
          })

          if (!aluno || inscricao.alunoId !== aluno.id) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Acesso negado a esta inscrição',
            })
          }
        } else if (ctx.user.role === 'professor') {
          const professor = await ctx.db.query.professorTable.findFirst({
            where: eq(professorTable.userId, ctx.user.id),
          })

          if (!professor || inscricao.projeto.professorResponsavelId !== professor.id) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Acesso negado a esta inscrição',
            })
          }
        }

        // Verificar se foi aceita
        if (!inscricao.status.includes('ACCEPTED_')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Termo de compromisso só pode ser gerado para vagas aceitas',
          })
        }

        // Buscar disciplinas do projeto
        const disciplinas = await ctx.db
          .select({
            codigo: disciplinaTable.codigo,
            nome: disciplinaTable.nome,
          })
          .from(disciplinaTable)
          .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
          .where(eq(projetoDisciplinaTable.projetoId, inscricao.projetoId))

        // Calcular datas (exemplo: início no semestre atual, fim baseado no número de semanas)
        const hoje = new Date()
        const inicioSemestre = new Date(inscricao.projeto.ano, inscricao.projeto.semestre === 'SEMESTRE_1' ? 2 : 7, 1)
        const fimSemestre = new Date(inscricao.projeto.ano, inscricao.projeto.semestre === 'SEMESTRE_1' ? 6 : 11, 30)

        const tipoMonitoria = inscricao.status === 'ACCEPTED_BOLSISTA' ? 'BOLSISTA' : 'VOLUNTARIO'

        // Gerar número do termo
        const numeroTermo = `${inscricao.projeto.ano}${inscricao.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}-${inscricao.id.toString().padStart(4, '0')}`

        return {
          monitor: {
            nome: inscricao.aluno.nomeCompleto,
            matricula: inscricao.aluno.matricula,
            email: inscricao.aluno.user.email,
            telefone: inscricao.aluno.telefone || undefined,
            cr: inscricao.aluno.cr,
          },
          professor: {
            nome: inscricao.projeto.professorResponsavel.nomeCompleto,
            matriculaSiape: inscricao.projeto.professorResponsavel.matriculaSiape || undefined,
            email: inscricao.projeto.professorResponsavel.emailInstitucional,
            departamento: inscricao.projeto.departamento.nome,
          },
          projeto: {
            titulo: inscricao.projeto.titulo,
            disciplinas,
            ano: inscricao.projeto.ano,
            semestre: inscricao.projeto.semestre,
            cargaHorariaSemana: inscricao.projeto.cargaHorariaSemana,
            numeroSemanas: inscricao.projeto.numeroSemanas,
          },
          monitoria: {
            tipo: tipoMonitoria,
            dataInicio: inicioSemestre.toLocaleDateString('pt-BR'),
            dataFim: fimSemestre.toLocaleDateString('pt-BR'),
            valorBolsa: tipoMonitoria === 'BOLSISTA' ? 400.0 : undefined, // Valor fixo por enquanto
          },
          termo: {
            numero: numeroTermo,
            dataGeracao: hoje.toLocaleDateString('pt-BR'),
          },
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao buscar dados do termo de compromisso')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar dados do termo de compromisso',
        })
      }
    }),
})
