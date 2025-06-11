import { createTRPCRouter, protectedProcedure, adminProtectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  projetoTable,
  departamentoTable,
  professorTable,
  disciplinaTable,
  projetoDisciplinaTable,
  projetoProfessorParticipanteTable,
  atividadeProjetoTable,
  inscricaoTable,
  alunoTable,
  userTable,
  periodoInscricaoTable,
} from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
import { eq, sql, and, isNull, lte, gte } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '@/utils/logger'
import minioClient, { bucketName } from '@/server/lib/minio'

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
    emailInstitucional: z.string(),
    matriculaSiape: z.string().nullable(),
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
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, ctx.user.id),
          })

          if (!professor) {
            return []
          }

          whereCondition = eq(projetoTable.professorResponsavelId, professor.id)
        }

        const projetos = await db
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

        const inscricoesCount = await db
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
            const disciplinas = await db
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
      const projeto = await db.query.projetoTable.findFirst({
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
        const professor = await db.query.professorTable.findFirst({
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
          const professor = await db.query.professorTable.findFirst({
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

          const professor = await db.query.professorTable.findFirst({
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

        const [novoProjeto] = await db
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

          await db.insert(projetoDisciplinaTable).values(disciplinaValues)
        }

        if (professoresParticipantes?.length) {
          const participanteValues = professoresParticipantes.map((professorId) => ({
            projetoId: novoProjeto.id,
            professorId,
          }))

          await db.insert(projetoProfessorParticipanteTable).values(participanteValues)
        }

        if (atividades?.length) {
          const atividadeValues = atividades.map((descricao) => ({
            projetoId: novoProjeto.id,
            descricao,
          }))

          await db.insert(atividadeProjetoTable).values(atividadeValues)
        }

        log.info({ projetoId: novoProjeto.id }, 'Projeto criado com sucesso')

        const projetoCompleto = await db.query.projetoTable.findFirst({
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

      const projeto = await db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, id), isNull(projetoTable.deletedAt)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

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

        if (projeto.status !== 'DRAFT') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Só é possível editar projetos em rascunho',
          })
        }
      }

      const { disciplinaIds, professoresParticipantes, atividades, professorResponsavelId: _, ...rest } = updateData

      const [_projetoAtualizado] = await db
        .update(projetoTable)
        .set({
          ...rest,
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, id))
        .returning()

      const projetoCompleto = await db.query.projetoTable.findFirst({
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
      const projeto = await db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

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

        if (projeto.status !== 'DRAFT') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Só é possível excluir projetos em rascunho',
          })
        }
      }

      await db
        .update(projetoTable)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.id))

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
      const projeto = await db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

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
      }

      if (projeto.status !== 'DRAFT' && projeto.status !== 'PENDING_PROFESSOR_SIGNATURE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Projeto não pode ser submetido neste status',
        })
      }

      await db
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
    .mutation(async ({ input }) => {
      const projeto = await db.query.projetoTable.findFirst({
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

      await db
        .update(projetoTable)
        .set({
          status: 'APPROVED',
          bolsasDisponibilizadas: input.bolsasDisponibilizadas,
          feedbackAdmin: input.feedbackAdmin,
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.id))

      log.info({ projetoId: input.id }, 'Projeto aprovado')
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
    .mutation(async ({ input }) => {
      const projeto = await db.query.projetoTable.findFirst({
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

      await db
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
      const projeto = await db.query.projetoTable.findFirst({
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
        const professor = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor || professor.id !== projeto.professorResponsavelId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado a este projeto',
          })
        }
      }

      await db
        .update(projetoTable)
        .set({
          assinaturaProfessor: input.signatureImage,
          status: 'SUBMITTED',
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.projetoId))

      try {
        const baseDirectory = `projetos/${projeto.id}/propostas_assinadas`
        const fileName = `proposta_assinada_professor_${Date.now()}.pdf`
        const objectName = `${baseDirectory}/${fileName}`

        const pdfContent = JSON.stringify({
          message: 'PDF placeholder - Professor signature applied',
          projetoId: projeto.id,
          assinaturaProfessor: input.signatureImage.substring(0, 50) + '...',
          timestamp: new Date().toISOString(),
        })

        await minioClient.putObject(bucketName, objectName, Buffer.from(pdfContent))
        
        log.info(
          { projetoId: input.projetoId, objectName },
          'PDF com assinatura do professor salvo no MinIO'
        )
      } catch (error) {
        log.warn({ projetoId: input.projetoId, error }, 'Erro ao salvar PDF no MinIO, mas assinatura foi salva')
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
    .mutation(async ({ input }) => {
      const projeto = await db.query.projetoTable.findFirst({
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

      await db
        .update(projetoTable)
        .set({
          assinaturaAdmin: input.signatureImage,
          status: 'APPROVED',
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.projetoId))

      try {
        const baseDirectory = `projetos/${projeto.id}/propostas_assinadas`
        const fileName = `proposta_assinada_completa_${Date.now()}.pdf`
        const objectName = `${baseDirectory}/${fileName}`

        const pdfContent = JSON.stringify({
          message: 'PDF placeholder - Admin signature applied - Document complete',
          projetoId: projeto.id,
          assinaturaProfessor: projeto.assinaturaProfessor ? 'Present' : 'Not found',
          assinaturaAdmin: input.signatureImage.substring(0, 50) + '...',
          timestamp: new Date().toISOString(),
          status: 'APPROVED',
        })

        await minioClient.putObject(bucketName, objectName, Buffer.from(pdfContent))
        
        log.info(
          { projetoId: input.projetoId, objectName },
          'PDF com assinatura completa (professor + admin) salvo no MinIO'
        )
      } catch (error) {
        log.warn({ projetoId: input.projetoId, error }, 'Erro ao salvar PDF no MinIO, mas assinatura foi salva')
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
        await db
          .update(projetoTable)
          .set({
            assinaturaProfessor: input.signatureData,
            status: 'SUBMITTED',
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, input.projetoId))
      } else if (userRole === 'admin') {
        await db
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

        const aluno = await db.query.alunoTable.findFirst({
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

        const periodoAtivo = await db.query.periodoInscricaoTable.findFirst({
          where: and(
            eq(periodoInscricaoTable.ano, currentYear),
            eq(periodoInscricaoTable.semestre, currentSemester),
            lte(periodoInscricaoTable.dataInicio, now),
            gte(periodoInscricaoTable.dataFim, now)
          ),
        })

        // Get approved projects for current semester
        const projetos = await db
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
        const inscricoes = await db.query.inscricaoTable.findMany({
          where: eq(inscricaoTable.alunoId, aluno.id),
        })

        const inscricoesMap = new Map(inscricoes.map((i) => [i.projetoId, i]))

        // Get inscription counts for all projects
        const inscricoesCount = await db
          .select({
            projetoId: inscricaoTable.projetoId,
            count: sql<number>`count(*)`,
          })
          .from(inscricaoTable)
          .groupBy(inscricaoTable.projetoId)

        const inscricoesCountMap = new Map(inscricoesCount.map((i) => [i.projetoId, Number(i.count)]))

        const projetosComDisciplinas = await Promise.all(
          projetos.map(async (projeto) => {
            const disciplinas = await db
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

        const professor = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de professor não encontrado',
          })
        }

        // Get inscriptions for professor's projects with accepted volunteers
        const inscricoes = await db
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
            and(
              eq(projetoTable.professorResponsavelId, professor.id),
              eq(inscricaoTable.status, 'ACCEPTED_VOLUNTARIO')
            )
          )

        const voluntarios = await Promise.all(
          inscricoes.map(async (inscricao) => {
            // Get first discipline for this project
            const disciplina = await db
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

        const professor = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de professor não encontrado',
          })
        }

        // Find the inscription for this volunteer
        const inscricao = await db.query.inscricaoTable.findFirst({
          where: and(
            eq(inscricaoTable.alunoId, input.id),
            eq(inscricaoTable.status, 'ACCEPTED_VOLUNTARIO')
          ),
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
        log.info(
          { alunoId: input.id, newStatus: input.status },
          'Status do voluntário atualizado'
        )

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
})
