import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  alunoTable,
  ataSelecaoTable,
  atividadeProjetoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoProfessorParticipanteTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import { emailService } from '@/server/lib/email-service'
import { PDFService } from '@/server/lib/pdf-service'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'ProjetoRouter' })

export const projetoInputSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  descricao: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  departamentoId: z.number(),
  disciplinaIds: z.array(z.number()).min(1, 'Deve selecionar pelo menos uma disciplina'),
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA']),
  bolsasSolicitadas: z.number().min(0).optional(),
  voluntariosSolicitados: z.number().min(0).optional(),
  cargaHorariaSemana: z.number().min(1),
  numeroSemanas: z.number().min(1),
  publicoAlvo: z.string().min(1),
  estimativaPessoasBenificiadas: z.number().min(0).optional(),
  atividades: z.array(z.string()).optional(),
  professoresParticipantes: z.array(z.number()).optional(),
  professorResponsavelId: z.number().optional(),
})

export const projetoListItemSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  departamentoId: z.number(),
  departamentoNome: z.string(),
  professorResponsavelId: z.number(),
  professorResponsavelNome: z.string(),
  status: z.enum([
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'PENDING_ADMIN_SIGNATURE',
    'PENDING_PROFESSOR_SIGNATURE',
  ]),
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA']),
  bolsasSolicitadas: z.number().nullable(),
  voluntariosSolicitados: z.number().nullable(),
  bolsasDisponibilizadas: z.number().nullable(),
  cargaHorariaSemana: z.number(),
  numeroSemanas: z.number(),
  publicoAlvo: z.string(),
  estimativaPessoasBenificiadas: z.number().nullable(),
  descricao: z.string(),
  assinaturaProfessor: z.string().nullable(),
  feedbackAdmin: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  disciplinas: z.array(
    z.object({
      id: z.number(),
      nome: z.string(),
      codigo: z.string(),
    })
  ),
  totalInscritos: z.number(),
  inscritosBolsista: z.number(),
  inscritosVoluntario: z.number(),
})

export const projetoDetalhesSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  descricao: z.string(),
  departamento: z.object({
    id: z.number(),
    nome: z.string(),
    sigla: z.string().nullable(),
    unidadeUniversitaria: z.string(),
  }),
  professorResponsavel: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    nomeSocial: z.string().nullable(),
    genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
    cpf: z.string(),
    matriculaSiape: z.string().nullable(),
    regime: z.enum(['20H', '40H', 'DE']),
    telefone: z.string().nullable(),
    telefoneInstitucional: z.string().nullable(),
    emailInstitucional: z.string(),
  }),
  disciplinas: z.array(
    z.object({
      id: z.number(),
      nome: z.string(),
      codigo: z.string(),
    })
  ),
  professoresParticipantes: z
    .array(
      z.object({
        id: z.number(),
        nomeCompleto: z.string(),
      })
    )
    .optional(),
  atividades: z
    .array(
      z.object({
        id: z.number(),
        descricao: z.string(),
      })
    )
    .optional(),
  status: z.enum([
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'PENDING_ADMIN_SIGNATURE',
    'PENDING_PROFESSOR_SIGNATURE',
  ]),
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA']),
  bolsasSolicitadas: z.number().nullable(),
  voluntariosSolicitados: z.number().nullable(),
  bolsasDisponibilizadas: z.number().nullable(),
  cargaHorariaSemana: z.number(),
  numeroSemanas: z.number(),
  publicoAlvo: z.string(),
  estimativaPessoasBenificiadas: z.number().nullable(),
  assinaturaProfessor: z.string().nullable(),
  assinaturaAdmin: z.string().nullable(),
  feedbackAdmin: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
})

export const projetoRouter = createTRPCRouter({
  getProjetos: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos',
        tags: ['projetos'],
        summary: 'Get projetos',
        description: 'Retrieve projetos based on user role',
      },
    })
    .input(z.void())
    .output(z.array(projetoListItemSchema))
    .query(async ({ ctx }) => {
      try {
        const userRole = ctx.user.role

        let whereCondition
        if (userRole === 'professor') {
          const professor = await ctx.db.query.professorTable.findFirst({
            where: eq(professorTable.userId, ctx.user.id),
          })

          if (!professor) {
            return []
          }

          whereCondition = eq(projetoTable.professorResponsavelId, professor.id)
        }

        const projetos = await ctx.db
          .select({
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            departamentoId: projetoTable.departamentoId,
            departamentoNome: departamentoTable.nome,
            professorResponsavelId: projetoTable.professorResponsavelId,
            professorResponsavelNome: professorTable.nomeCompleto,
            status: projetoTable.status,
            ano: projetoTable.ano,
            semestre: projetoTable.semestre,
            tipoProposicao: projetoTable.tipoProposicao,
            bolsasSolicitadas: projetoTable.bolsasSolicitadas,
            voluntariosSolicitados: projetoTable.voluntariosSolicitados,
            bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
            cargaHorariaSemana: projetoTable.cargaHorariaSemana,
            numeroSemanas: projetoTable.numeroSemanas,
            publicoAlvo: projetoTable.publicoAlvo,
            estimativaPessoasBenificiadas: projetoTable.estimativaPessoasBenificiadas,
            descricao: projetoTable.descricao,
            assinaturaProfessor: projetoTable.assinaturaProfessor,
            assinaturaAdmin: projetoTable.assinaturaAdmin,
            feedbackAdmin: projetoTable.feedbackAdmin,
            createdAt: projetoTable.createdAt,
            updatedAt: projetoTable.updatedAt,
            deletedAt: projetoTable.deletedAt,
          })
          .from(projetoTable)
          .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
          .where(and(whereCondition, isNull(projetoTable.deletedAt)))
          .orderBy(projetoTable.createdAt)

        const inscricoesCount = await ctx.db
          .select({
            projetoId: inscricaoTable.projetoId,
            tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
            count: sql<number>`count(*)`,
          })
          .from(inscricaoTable)
          .groupBy(inscricaoTable.projetoId, inscricaoTable.tipoVagaPretendida)

        const inscricoesMap = new Map<string, number>()
        inscricoesCount.forEach((item) => {
          const key = `${item.projetoId}_${item.tipoVagaPretendida}`
          inscricoesMap.set(key, Number(item.count))
        })

        const projetosComDisciplinas = await Promise.all(
          projetos.map(async (projeto) => {
            const disciplinas = await ctx.db
              .select({
                id: disciplinaTable.id,
                nome: disciplinaTable.nome,
                codigo: disciplinaTable.codigo,
              })
              .from(disciplinaTable)
              .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
              .where(eq(projetoDisciplinaTable.projetoId, projeto.id))

            const inscritosBolsista = inscricoesMap.get(`${projeto.id}_BOLSISTA`) || 0
            const inscritosVoluntario = inscricoesMap.get(`${projeto.id}_VOLUNTARIO`) || 0
            const inscritosAny = inscricoesMap.get(`${projeto.id}_ANY`) || 0
            const totalInscritos = inscritosBolsista + inscritosVoluntario + inscritosAny

            return {
              ...projeto,
              disciplinas,
              totalInscritos,
              inscritosBolsista,
              inscritosVoluntario,
            }
          })
        )

        log.info('Projetos recuperados com sucesso')
        return projetosComDisciplinas
      } catch (error) {
        log.error(error, 'Erro ao recuperar projetos')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao recuperar projetos',
        })
      }
    }),

  getProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos/{id}',
        tags: ['projetos'],
        summary: 'Get projeto',
        description: 'Retrieve a specific projeto with full details',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(projetoDetalhesSchema)
    .query(async ({ input, ctx }) => {
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
        with: {
          departamento: true,
          professorResponsavel: true,
        },
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
      }

      const [disciplinas, professoresParticipantes, atividades] = await Promise.all([
        db
          .select({
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
          })
          .from(disciplinaTable)
          .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
          .where(eq(projetoDisciplinaTable.projetoId, projeto.id)),

        db
          .select({
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
          })
          .from(professorTable)
          .innerJoin(
            projetoProfessorParticipanteTable,
            eq(professorTable.id, projetoProfessorParticipanteTable.professorId)
          )
          .where(eq(projetoProfessorParticipanteTable.projetoId, projeto.id)),

        db.query.atividadeProjetoTable.findMany({
          where: eq(atividadeProjetoTable.projetoId, projeto.id),
        }),
      ])

      return {
        ...projeto,
        professorResponsavel: {
          id: projeto.professorResponsavel.id,
          nomeCompleto: projeto.professorResponsavel.nomeCompleto,
          nomeSocial: projeto.professorResponsavel.nomeSocial,
          genero: projeto.professorResponsavel.genero,
          cpf: projeto.professorResponsavel.cpf,
          matriculaSiape: projeto.professorResponsavel.matriculaSiape,
          regime: projeto.professorResponsavel.regime,
          telefone: projeto.professorResponsavel.telefone,
          telefoneInstitucional: projeto.professorResponsavel.telefoneInstitucional,
          emailInstitucional: projeto.professorResponsavel.emailInstitucional,
        },
        disciplinas,
        professoresParticipantes,
        atividades,
      }
    }),

  createProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos',
        tags: ['projetos'],
        summary: 'Create projeto',
        description: 'Create a new projeto',
      },
    })
    .input(projetoInputSchema)
    .output(projetoDetalhesSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        let professorResponsavelId: number

        if (ctx.user.role === 'professor') {
          const professor = await ctx.db.query.professorTable.findFirst({
            where: eq(professorTable.userId, ctx.user.id),
          })

          if (!professor) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Perfil de professor não encontrado',
            })
          }

          professorResponsavelId = professor.id
        } else if (ctx.user.role === 'admin') {
          if (!input.professorResponsavelId) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Admins devem especificar o professor responsável',
            })
          }

          const professor = await ctx.db.query.professorTable.findFirst({
            where: eq(professorTable.id, input.professorResponsavelId),
          })

          if (!professor) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Professor responsável não encontrado',
            })
          }

          professorResponsavelId = input.professorResponsavelId
        } else {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso não autorizado',
          })
        }

        const { disciplinaIds, professoresParticipantes, atividades, professorResponsavelId: _, ...rest } = input

        const [novoProjeto] = await ctx.db
          .insert(projetoTable)
          .values({
            ...rest,
            professorResponsavelId,
            bolsasSolicitadas: rest.bolsasSolicitadas || 0,
            voluntariosSolicitados: rest.voluntariosSolicitados || 0,
          })
          .returning()

        if (disciplinaIds.length > 0) {
          const disciplinaValues = disciplinaIds.map((disciplinaId) => ({
            projetoId: novoProjeto.id,
            disciplinaId,
          }))

          await ctx.db.insert(projetoDisciplinaTable).values(disciplinaValues)
        }

        if (professoresParticipantes?.length) {
          const participanteValues = professoresParticipantes.map((professorId) => ({
            projetoId: novoProjeto.id,
            professorId,
          }))

          await ctx.db.insert(projetoProfessorParticipanteTable).values(participanteValues)
        }

        if (atividades?.length) {
          const atividadeValues = atividades.map((descricao) => ({
            projetoId: novoProjeto.id,
            descricao,
          }))

          await ctx.db.insert(atividadeProjetoTable).values(atividadeValues)
        }

        log.info({ projetoId: novoProjeto.id }, 'Projeto criado com sucesso')

        const projetoCompleto = await ctx.db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, novoProjeto.id),
          with: {
            departamento: true,
            professorResponsavel: true,
          },
        })

        const [disciplinas, professoresParticipantesResult, atividadesResult] = await Promise.all([
          db
            .select({
              id: disciplinaTable.id,
              nome: disciplinaTable.nome,
              codigo: disciplinaTable.codigo,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, novoProjeto.id)),

          db
            .select({
              id: professorTable.id,
              nomeCompleto: professorTable.nomeCompleto,
            })
            .from(professorTable)
            .innerJoin(
              projetoProfessorParticipanteTable,
              eq(professorTable.id, projetoProfessorParticipanteTable.professorId)
            )
            .where(eq(projetoProfessorParticipanteTable.projetoId, novoProjeto.id)),

          db.query.atividadeProjetoTable.findMany({
            where: eq(atividadeProjetoTable.projetoId, novoProjeto.id),
          }),
        ])

        return {
          ...projetoCompleto!,
          disciplinas,
          professoresParticipantes: professoresParticipantesResult,
          atividades: atividadesResult,
        }
      } catch (error) {
        log.error(error, 'Erro ao criar projeto')
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar projeto',
        })
      }
    }),

  updateProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/projetos/{id}',
        tags: ['projetos'],
        summary: 'Update projeto',
        description: 'Update an existing projeto',
      },
    })
    .input(
      z
        .object({
          id: z.number(),
        })
        .merge(projetoInputSchema.partial())
    )
    .output(projetoDetalhesSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input

      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, id), isNull(projetoTable.deletedAt)),
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

        if (projeto.status !== 'DRAFT') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Só é possível editar projetos em rascunho',
          })
        }
      }

      const { disciplinaIds, professoresParticipantes, atividades, professorResponsavelId: _, ...rest } = updateData

      const [_projetoAtualizado] = await ctx.db
        .update(projetoTable)
        .set({
          ...rest,
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, id))
        .returning()

      const projetoCompleto = await ctx.db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, id),
        with: {
          departamento: true,
          professorResponsavel: true,
        },
      })

      const [disciplinas, professoresParticipantesResult, atividadesResult] = await Promise.all([
        db
          .select({
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
          })
          .from(disciplinaTable)
          .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
          .where(eq(projetoDisciplinaTable.projetoId, id)),

        db
          .select({
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
          })
          .from(professorTable)
          .innerJoin(
            projetoProfessorParticipanteTable,
            eq(professorTable.id, projetoProfessorParticipanteTable.professorId)
          )
          .where(eq(projetoProfessorParticipanteTable.projetoId, id)),

        db.query.atividadeProjetoTable.findMany({
          where: eq(atividadeProjetoTable.projetoId, id),
        }),
      ])

      return {
        ...projetoCompleto!,
        disciplinas,
        professoresParticipantes: professoresParticipantesResult,
        atividades: atividadesResult,
      }
    }),

  deleteProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/projetos/{id}',
        tags: ['projetos'],
        summary: 'Delete projeto',
        description: 'Soft delete a projeto',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
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

        if (projeto.status !== 'DRAFT') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Só é possível excluir projetos em rascunho',
          })
        }
      }

      if (ctx.user.role === 'admin') {
        log.info({ projetoId: input.id, adminUserId: ctx.user.id }, 'Admin deletando projeto')
      }

      await ctx.db
        .update(projetoTable)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.id))

      log.info({ projetoId: input.id }, 'Projeto excluído com sucesso')
      return { success: true }
    }),

  submitProjeto: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/projetos/{id}/submit',
        tags: ['projetos'],
        summary: 'Submit projeto',
        description: 'Submit projeto for admin approval',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
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
      }

      if (projeto.status !== 'DRAFT' && projeto.status !== 'PENDING_PROFESSOR_SIGNATURE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Projeto não pode ser submetido neste status',
        })
      }

      await ctx.db
        .update(projetoTable)
        .set({
          status: 'SUBMITTED',
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.id))

      log.info({ projetoId: input.id }, 'Projeto submetido para aprovação')
      return { success: true }
    }),

  approveProjeto: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{id}/approve',
        tags: ['projetos'],
        summary: 'Approve projeto',
        description: 'Approve projeto and optionally set scholarship allocations',
      },
    })
    .input(
      z.object({
        id: z.number(),
        bolsasDisponibilizadas: z.number().min(0).optional(),
        feedbackAdmin: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (projeto.status !== 'SUBMITTED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Projeto não está aguardando aprovação',
        })
      }

      await ctx.db
        .update(projetoTable)
        .set({
          status: 'PENDING_ADMIN_SIGNATURE',
          bolsasDisponibilizadas: input.bolsasDisponibilizadas,
          feedbackAdmin: input.feedbackAdmin,
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.id))

      log.info({ projetoId: input.id }, 'Projeto aprovado e pendente de assinatura do admin')
      return { success: true }
    }),

  rejectProjeto: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{id}/reject',
        tags: ['projetos'],
        summary: 'Reject projeto',
        description: 'Reject projeto with feedback',
      },
    })
    .input(
      z.object({
        id: z.number(),
        feedbackAdmin: z.string().min(1, 'Feedback é obrigatório para rejeição'),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (projeto.status !== 'SUBMITTED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Projeto não está aguardando aprovação',
        })
      }

      await ctx.db
        .update(projetoTable)
        .set({
          status: 'REJECTED',
          feedbackAdmin: input.feedbackAdmin,
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.id))

      log.info({ projetoId: input.id }, 'Projeto rejeitado')
      return { success: true }
    }),

  signProfessor: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{projetoId}/sign-professor',
        tags: ['projetos'],
        summary: 'Sign project as professor',
        description: 'Add professor signature to project',
      },
    })
    .input(
      z.object({
        projetoId: z.number(),
        signatureImage: z.string().min(1, 'Assinatura é obrigatória'),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
        with: {
          departamento: true,
          professorResponsavel: true,
        },
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

        if (!professor || professor.id !== projeto.professorResponsavelId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado a este projeto',
          })
        }
      }

      await ctx.db
        .update(projetoTable)
        .set({
          assinaturaProfessor: input.signatureImage,
          status: 'SUBMITTED',
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.projetoId))

      try {
        // Prepare PDF data
        const [disciplinas, professoresParticipantes, atividades] = await Promise.all([
          db
            .select({
              id: disciplinaTable.id,
              codigo: disciplinaTable.codigo,
              nome: disciplinaTable.nome,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, projeto.id)),

          db
            .select({
              id: professorTable.id,
              nomeCompleto: professorTable.nomeCompleto,
            })
            .from(professorTable)
            .innerJoin(
              projetoProfessorParticipanteTable,
              eq(professorTable.id, projetoProfessorParticipanteTable.professorId)
            )
            .where(eq(projetoProfessorParticipanteTable.projetoId, projeto.id)),

          db.query.atividadeProjetoTable.findMany({
            where: eq(atividadeProjetoTable.projetoId, projeto.id),
          }),
        ])

        const pdfData = {
          titulo: projeto.titulo,
          descricao: projeto.descricao,
          departamento: projeto.departamento,
          professorResponsavel: {
            ...projeto.professorResponsavel,
            nomeSocial: projeto.professorResponsavel.nomeSocial || undefined,
            matriculaSiape: projeto.professorResponsavel.matriculaSiape || undefined,
            telefone: projeto.professorResponsavel.telefone || undefined,
            telefoneInstitucional: projeto.professorResponsavel.telefoneInstitucional || undefined,
          },
          ano: projeto.ano,
          semestre: projeto.semestre,
          tipoProposicao: projeto.tipoProposicao,
          bolsasSolicitadas: projeto.bolsasSolicitadas,
          voluntariosSolicitados: projeto.voluntariosSolicitados,
          cargaHorariaSemana: projeto.cargaHorariaSemana,
          numeroSemanas: projeto.numeroSemanas,
          publicoAlvo: projeto.publicoAlvo,
          estimativaPessoasBenificiadas: projeto.estimativaPessoasBenificiadas || undefined,
          disciplinas,
          professoresParticipantes,
          atividades,
          assinaturaProfessor: input.signatureImage,
          dataAssinaturaProfessor: new Date().toLocaleDateString('pt-BR'),
          projetoId: projeto.id,
        }

        // Generate and save the PDF with professor signature
        const objectName = await PDFService.generateAndSaveSignedProjetoPDF(pdfData, input.signatureImage)

        log.info({ projetoId: input.projetoId, objectName }, 'PDF com assinatura do professor salvo no MinIO')
      } catch (error) {
        log.warn({ projetoId: input.projetoId, error }, 'Erro ao salvar PDF no MinIO, mas assinatura foi salva')
      }

      // Enviar notificação para admins
      try {
        const admins = await ctx.db.query.userTable.findMany({
          where: eq(userTable.role, 'admin'),
        })

        if (admins.length > 0) {
          const adminEmails = admins.map((admin) => admin.email)

          await emailService.sendProfessorAssinouPropostaNotification(
            {
              professorNome: projeto.professorResponsavel.nomeCompleto,
              projetoTitulo: projeto.titulo,
              projetoId: projeto.id,
              novoStatusProjeto: 'SUBMITTED',
              remetenteUserId: ctx.user.id,
            },
            adminEmails
          )
          log.info({ projetoId: input.projetoId, adminCount: adminEmails.length }, 'Notificações enviadas para admins')
        }
      } catch (error) {
        log.error({ error, projetoId: input.projetoId }, 'Erro ao enviar notificações, mas assinatura foi salva')
      }

      log.info({ projetoId: input.projetoId }, 'Assinatura do professor adicionada')
      return { success: true }
    }),

  signAdmin: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{projetoId}/sign-admin',
        tags: ['projetos'],
        summary: 'Sign project as admin',
        description: 'Add admin signature and approve project',
      },
    })
    .input(
      z.object({
        projetoId: z.number(),
        signatureImage: z.string().min(1, 'Assinatura é obrigatória'),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (projeto.status !== 'SUBMITTED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Projeto não está aguardando aprovação',
        })
      }

      await ctx.db
        .update(projetoTable)
        .set({
          assinaturaAdmin: input.signatureImage,
          status: 'APPROVED',
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.projetoId))

      try {
        // Get the existing PDF with professor signature
        const existingPdf = await PDFService.getLatestProjetoPDF(projeto.id)

        if (existingPdf) {
          // Add admin signature to existing PDF
          const pdfWithAdminSignature = await PDFService.addSignatureToPDF(
            existingPdf.buffer,
            input.signatureImage,
            'admin'
          )

          // Save the updated PDF
          const objectName = await PDFService.saveProjetoPDF(
            projeto.id,
            pdfWithAdminSignature,
            `projetos/${projeto.id}/propostas_assinadas/proposta_assinada_completa_${Date.now()}.pdf`
          )

          log.info(
            { projetoId: input.projetoId, objectName },
            'PDF com assinatura completa (professor + admin) salvo no MinIO'
          )
        } else {
          // Fallback: generate new PDF with both signatures
          const projetoCompleto = await ctx.db.query.projetoTable.findFirst({
            where: eq(projetoTable.id, input.projetoId),
            with: {
              departamento: true,
              professorResponsavel: true,
            },
          })

          if (!projetoCompleto) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Projeto não encontrado para fallback',
            })
          }

          const [disciplinas, professoresParticipantes, atividades] = await Promise.all([
            db
              .select({
                id: disciplinaTable.id,
                codigo: disciplinaTable.codigo,
                nome: disciplinaTable.nome,
              })
              .from(disciplinaTable)
              .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
              .where(eq(projetoDisciplinaTable.projetoId, projeto.id)),

            db
              .select({
                id: professorTable.id,
                nomeCompleto: professorTable.nomeCompleto,
              })
              .from(professorTable)
              .innerJoin(
                projetoProfessorParticipanteTable,
                eq(professorTable.id, projetoProfessorParticipanteTable.professorId)
              )
              .where(eq(projetoProfessorParticipanteTable.projetoId, projeto.id)),

            db.query.atividadeProjetoTable.findMany({
              where: eq(atividadeProjetoTable.projetoId, projeto.id),
            }),
          ])

          const pdfData = {
            titulo: projetoCompleto.titulo,
            descricao: projetoCompleto.descricao,
            departamento: projetoCompleto.departamento,
            professorResponsavel: {
              ...projetoCompleto.professorResponsavel,
              nomeSocial: projetoCompleto.professorResponsavel.nomeSocial || undefined,
              matriculaSiape: projetoCompleto.professorResponsavel.matriculaSiape || undefined,
              telefone: projetoCompleto.professorResponsavel.telefone || undefined,
              telefoneInstitucional: projetoCompleto.professorResponsavel.telefoneInstitucional || undefined,
            },
            ano: projetoCompleto.ano,
            semestre: projetoCompleto.semestre,
            tipoProposicao: projetoCompleto.tipoProposicao,
            bolsasSolicitadas: projetoCompleto.bolsasSolicitadas,
            voluntariosSolicitados: projetoCompleto.voluntariosSolicitados,
            cargaHorariaSemana: projetoCompleto.cargaHorariaSemana,
            numeroSemanas: projetoCompleto.numeroSemanas,
            publicoAlvo: projetoCompleto.publicoAlvo,
            estimativaPessoasBenificiadas: projetoCompleto.estimativaPessoasBenificiadas || undefined,
            disciplinas,
            professoresParticipantes,
            atividades,
            assinaturaProfessor: projetoCompleto.assinaturaProfessor || undefined,
            assinaturaAdmin: input.signatureImage,
            dataAssinaturaProfessor: new Date().toLocaleDateString('pt-BR'),
            dataAssinaturaAdmin: new Date().toLocaleDateString('pt-BR'),
            dataAprovacao: new Date().toLocaleDateString('pt-BR'),
            projetoId: projetoCompleto.id,
          }

          const objectName = await PDFService.generateAndSaveSignedProjetoPDF(
            pdfData,
            projetoCompleto.assinaturaProfessor || undefined,
            input.signatureImage
          )

          log.info({ projetoId: input.projetoId, objectName }, 'PDF com assinatura completa gerado do zero')
        }
      } catch (error) {
        log.warn({ projetoId: input.projetoId, error }, 'Erro ao salvar PDF no MinIO, mas assinatura foi salva')
      }

      // Enviar notificação para o professor
      try {
        const projetoCompleto = await ctx.db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, input.projetoId),
          with: {
            professorResponsavel: true,
          },
        })

        if (projetoCompleto) {
          await emailService.sendAdminAssinouPropostaNotification({
            professorEmail: projetoCompleto.professorResponsavel.emailInstitucional,
            professorNome: projetoCompleto.professorResponsavel.nomeCompleto,
            projetoTitulo: projetoCompleto.titulo,
            projetoId: projetoCompleto.id,
            novoStatusProjeto: 'APPROVED',
          })
          log.info({ projetoId: input.projetoId }, 'Notificação enviada para professor')
        }
      } catch (error) {
        log.error({ error, projetoId: input.projetoId }, 'Erro ao enviar notificação, mas assinatura foi salva')
      }

      log.info({ projetoId: input.projetoId }, 'Assinatura do admin adicionada e projeto aprovado')
      return { success: true }
    }),

  signDocument: protectedProcedure
    .input(
      z.object({
        projetoId: z.number(),
        signatureData: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userRole = ctx.user.role

      if (userRole === 'professor') {
        await ctx.db
          .update(projetoTable)
          .set({
            assinaturaProfessor: input.signatureData,
            status: 'SUBMITTED',
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, input.projetoId))
      } else if (userRole === 'admin') {
        await ctx.db
          .update(projetoTable)
          .set({
            assinaturaAdmin: input.signatureData,
            status: 'APPROVED',
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, input.projetoId))
      }

      return { success: true }
    }),

  getAvailableProjects: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos/available',
        tags: ['projetos'],
        summary: 'Get available projects',
        description: 'Get projects available for student applications',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          titulo: z.string(),
          departamentoNome: z.string(),
          professorResponsavelNome: z.string(),
          disciplinas: z.array(
            z.object({
              codigo: z.string(),
              nome: z.string(),
            })
          ),
          bolsasDisponibilizadas: z.number(),
          voluntariosSolicitados: z.number(),
          totalInscritos: z.number(),
          inscricaoAberta: z.boolean(),
          jaInscrito: z.boolean(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        if (ctx.user.role !== 'student') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas estudantes podem ver projetos disponíveis',
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

        // Get current active inscription period
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentSemester = now.getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2'

        const periodoAtivo = await ctx.db.query.periodoInscricaoTable.findFirst({
          where: and(
            eq(periodoInscricaoTable.ano, currentYear),
            eq(periodoInscricaoTable.semestre, currentSemester),
            lte(periodoInscricaoTable.dataInicio, now),
            gte(periodoInscricaoTable.dataFim, now)
          ),
        })

        // Get approved projects for current semester
        const projetos = await ctx.db
          .select({
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            departamentoNome: departamentoTable.nome,
            professorResponsavelNome: professorTable.nomeCompleto,
            bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
            voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          })
          .from(projetoTable)
          .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
          .where(
            and(
              eq(projetoTable.status, 'APPROVED'),
              eq(projetoTable.ano, currentYear),
              eq(projetoTable.semestre, currentSemester),
              isNull(projetoTable.deletedAt)
            )
          )
          .orderBy(projetoTable.titulo)

        // Get student's inscriptions for these projects
        const inscricoes = await ctx.db.query.inscricaoTable.findMany({
          where: eq(inscricaoTable.alunoId, aluno.id),
        })

        const inscricoesMap = new Map(inscricoes.map((i) => [i.projetoId, i]))

        // Get inscription counts for all projects
        const inscricoesCount = await ctx.db
          .select({
            projetoId: inscricaoTable.projetoId,
            count: sql<number>`count(*)`,
          })
          .from(inscricaoTable)
          .groupBy(inscricaoTable.projetoId)

        const inscricoesCountMap = new Map(inscricoesCount.map((i) => [i.projetoId, Number(i.count)]))

        const projetosComDisciplinas = await Promise.all(
          projetos.map(async (projeto) => {
            const disciplinas = await ctx.db
              .select({
                codigo: disciplinaTable.codigo,
                nome: disciplinaTable.nome,
              })
              .from(disciplinaTable)
              .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
              .where(eq(projetoDisciplinaTable.projetoId, projeto.id))

            const totalInscritos = inscricoesCountMap.get(projeto.id) || 0
            const inscricaoAberta = !!periodoAtivo
            const jaInscrito = inscricoesMap.has(projeto.id)

            return {
              id: projeto.id,
              titulo: projeto.titulo,
              departamentoNome: projeto.departamentoNome,
              professorResponsavelNome: projeto.professorResponsavelNome,
              disciplinas,
              bolsasDisponibilizadas: projeto.bolsasDisponibilizadas || 0,
              voluntariosSolicitados: projeto.voluntariosSolicitados || 0,
              totalInscritos,
              inscricaoAberta,
              jaInscrito,
            }
          })
        )

        log.info('Projetos disponíveis recuperados com sucesso')
        return projetosComDisciplinas
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao recuperar projetos disponíveis')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao recuperar projetos disponíveis',
        })
      }
    }),

  getVolunteers: protectedProcedure
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
          id: z.number(),
          nomeCompleto: z.string(),
          email: z.string(),
          telefone: z.string().optional(),
          disciplina: z.object({
            codigo: z.string(),
            nome: z.string(),
          }),
          projeto: z.object({
            id: z.number(),
            titulo: z.string(),
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
            and(eq(projetoTable.professorResponsavelId, professor.id), eq(inscricaoTable.status, 'ACCEPTED_VOLUNTARIO'))
          )

        const voluntarios = await Promise.all(
          inscricoes.map(async (inscricao) => {
            // Get first discipline for this project
            const disciplina = await ctx.db
              .select({
                codigo: disciplinaTable.codigo,
                nome: disciplinaTable.nome,
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
    }),

  updateVolunteerStatus: protectedProcedure
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
        id: z.number(),
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
          where: and(eq(inscricaoTable.alunoId, input.id), eq(inscricaoTable.status, 'ACCEPTED_VOLUNTARIO')),
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
    }),

  // Endpoint para gerar dados da ata de seleção
  generateSelectionMinutesData: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/projetos/{projetoId}/ata-selecao-data',
        tags: ['projetos'],
        summary: 'Get selection minutes data',
        description: 'Get data for generating selection minutes PDF',
      },
    })
    .input(z.object({ projetoId: z.number() }))
    .output(
      z.object({
        projeto: z.object({
          id: z.number(),
          titulo: z.string(),
          ano: z.number(),
          semestre: z.string(),
          departamento: z.object({
            nome: z.string(),
            sigla: z.string().nullable(),
          }),
          professorResponsavel: z.object({
            nomeCompleto: z.string(),
            matriculaSiape: z.string().nullable(),
          }),
          disciplinas: z.array(
            z.object({
              codigo: z.string(),
              nome: z.string(),
            })
          ),
        }),
        candidatos: z.array(
          z.object({
            id: z.number(),
            aluno: z.object({
              nomeCompleto: z.string(),
              matricula: z.string(),
              cr: z.number().nullable(),
            }),
            tipoVagaPretendida: z.string().nullable(),
            notaDisciplina: z.number().nullable(),
            notaSelecao: z.number().nullable(),
            coeficienteRendimento: z.number().nullable(),
            notaFinal: z.number().nullable(),
            status: z.string(),
            observacoes: z.string().nullable(),
          })
        ),
        ataInfo: z.object({
          dataSelecao: z.string(),
          localSelecao: z.string().nullable(),
          observacoes: z.string().nullable(),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Verificar se é professor e se tem acesso ao projeto
        const projeto = await ctx.db.query.projetoTable.findFirst({
          where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
          with: {
            departamento: true,
            professorResponsavel: true,
          },
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
        }

        // Buscar disciplinas do projeto
        const disciplinas = await ctx.db
          .select({
            codigo: disciplinaTable.codigo,
            nome: disciplinaTable.nome,
          })
          .from(disciplinaTable)
          .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
          .where(eq(projetoDisciplinaTable.projetoId, projeto.id))

        // Buscar candidatos/inscrições do projeto
        const candidatos = await ctx.db
          .select({
            id: inscricaoTable.id,
            aluno: {
              nomeCompleto: alunoTable.nomeCompleto,
              matricula: alunoTable.matricula,
              cr: alunoTable.cr,
            },
            tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
            notaDisciplina: inscricaoTable.notaDisciplina,
            notaSelecao: inscricaoTable.notaSelecao,
            coeficienteRendimento: inscricaoTable.coeficienteRendimento,
            notaFinal: inscricaoTable.notaFinal,
            status: inscricaoTable.status,
            observacoes: inscricaoTable.feedbackProfessor,
          })
          .from(inscricaoTable)
          .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
          .where(eq(inscricaoTable.projetoId, projeto.id))
          .orderBy(desc(inscricaoTable.notaFinal))

        // Dados da ata
        const ataInfo = {
          dataSelecao: new Date().toLocaleDateString('pt-BR'),
          localSelecao: null,
          observacoes: null,
        }

        // Transformar dados dos candidatos para match da interface
        const candidatosTransformados = candidatos.map((candidato) => ({
          id: candidato.id,
          aluno: {
            nomeCompleto: candidato.aluno.nomeCompleto,
            matricula: candidato.aluno.matricula,
            cr: candidato.aluno.cr,
          },
          tipoVagaPretendida: candidato.tipoVagaPretendida,
          notaDisciplina: candidato.notaDisciplina ? Number(candidato.notaDisciplina) : null,
          notaSelecao: candidato.notaSelecao ? Number(candidato.notaSelecao) : null,
          coeficienteRendimento: candidato.coeficienteRendimento ? Number(candidato.coeficienteRendimento) : null,
          notaFinal: candidato.notaFinal ? Number(candidato.notaFinal) : null,
          status: candidato.status,
          observacoes: candidato.observacoes,
        }))

        return {
          projeto: {
            id: projeto.id,
            titulo: projeto.titulo,
            ano: projeto.ano,
            semestre: projeto.semestre,
            departamento: {
              nome: projeto.departamento.nome,
              sigla: projeto.departamento.sigla,
            },
            professorResponsavel: {
              nomeCompleto: projeto.professorResponsavel.nomeCompleto,
              matriculaSiape: projeto.professorResponsavel.matriculaSiape,
            },
            disciplinas,
          },
          candidatos: candidatosTransformados,
          ataInfo,
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao buscar dados da ata de seleção')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar dados da ata de seleção',
        })
      }
    }),

  // Endpoint para salvar ata de seleção
  saveSelectionMinutes: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{projetoId}/ata-selecao',
        tags: ['projetos'],
        summary: 'Save selection minutes',
        description: 'Save selection minutes to database and MinIO',
      },
    })
    .input(
      z.object({
        projetoId: z.number(),
        dataSelecao: z.string().optional(),
        localSelecao: z.string().optional(),
        observacoes: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean(), ataId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verificar se é professor e se tem acesso ao projeto
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
        }

        // Verificar se já existe uma ata para este projeto
        const ataExistente = await ctx.db.query.ataSelecaoTable.findFirst({
          where: eq(ataSelecaoTable.projetoId, input.projetoId),
        })

        let ataId: number

        if (ataExistente) {
          // Atualizar ata existente - apenas atualizamos dataGeracao
          await ctx.db
            .update(ataSelecaoTable)
            .set({
              dataGeracao: new Date(),
            })
            .where(eq(ataSelecaoTable.id, ataExistente.id))

          ataId = ataExistente.id
        } else {
          // Criar nova ata
          const [novaAta] = await ctx.db
            .insert(ataSelecaoTable)
            .values({
              projetoId: input.projetoId,
              geradoPorUserId: ctx.user.id,
            })
            .returning({ id: ataSelecaoTable.id })

          ataId = novaAta.id
        }

        log.info({ projetoId: input.projetoId, ataId }, 'Ata de seleção salva')
        return { success: true, ataId }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao salvar ata de seleção')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao salvar ata de seleção',
        })
      }
    }),

  // Endpoint para notificar candidatos sobre resultado
  notifySelectionResults: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projetos/{projetoId}/notify-results',
        tags: ['projetos'],
        summary: 'Notify selection results',
        description: 'Send email notifications to candidates about selection results',
      },
    })
    .input(
      z.object({
        projetoId: z.number(),
        mensagemPersonalizada: z.string().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        notificationsCount: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verificar se é professor e se tem acesso ao projeto
        const projeto = await ctx.db.query.projetoTable.findFirst({
          where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
          with: {
            professorResponsavel: true,
          },
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
        }

        // Buscar candidatos com seus dados de usuário
        const candidatos = await ctx.db
          .select({
            inscricao: {
              id: inscricaoTable.id,
              status: inscricaoTable.status,
              feedbackProfessor: inscricaoTable.feedbackProfessor,
            },
            aluno: {
              id: alunoTable.id,
              nomeCompleto: alunoTable.nomeCompleto,
            },
            user: {
              email: userTable.email,
            },
          })
          .from(inscricaoTable)
          .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
          .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
          .where(eq(inscricaoTable.projetoId, input.projetoId))

        let notificationsCount = 0

        // Enviar notificações para todos os candidatos
        for (const candidato of candidatos) {
          try {
            let status: 'SELECTED_BOLSISTA' | 'SELECTED_VOLUNTARIO' | 'REJECTED_BY_PROFESSOR'

            if (candidato.inscricao.status === 'SELECTED_BOLSISTA') {
              status = 'SELECTED_BOLSISTA'
            } else if (candidato.inscricao.status === 'SELECTED_VOLUNTARIO') {
              status = 'SELECTED_VOLUNTARIO'
            } else {
              status = 'REJECTED_BY_PROFESSOR'
            }

            await emailService.sendStudentSelectionResultNotification(
              {
                studentName: candidato.aluno.nomeCompleto,
                studentEmail: candidato.user.email,
                projectTitle: projeto.titulo,
                professorName: projeto.professorResponsavel.nomeCompleto,
                status,
                feedbackProfessor: candidato.inscricao.feedbackProfessor || input.mensagemPersonalizada,
                alunoId: candidato.aluno.id,
                projetoId: projeto.id,
              },
              ctx.user.id
            )

            notificationsCount++
          } catch (emailError) {
            log.error(
              {
                error: emailError,
                candidatoId: candidato.aluno.id,
                projetoId: input.projetoId,
              },
              'Erro ao enviar notificação para candidato'
            )
            // Continua enviando para os outros mesmo se um falhar
          }
        }

        log.info(
          {
            projetoId: input.projetoId,
            notificationsCount,
            totalCandidatos: candidatos.length,
          },
          'Notificações de resultado enviadas'
        )

        return {
          success: true,
          notificationsCount,
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao notificar resultados')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao notificar resultados',
        })
      }
    }),
})
