import { protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  atividadeProjetoTable,
  disciplinaProfessorResponsavelTable,
  disciplinaTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
} from '@/server/db/schema'
import { idSchema, projectDetailSchema, projectFormSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'ProjetoRouter.CRUD' })

export const createProjetoHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/projetos',
      tags: ['projetos'],
      summary: 'Create projeto',
      description: 'Create a new projeto',
    },
  })
  .input(projectFormSchema)
  .output(projectDetailSchema)
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

      // Validar que apenas uma disciplina pode ser vinculada por projeto (conforme edital)
      if (disciplinaIds && disciplinaIds.length > 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Um projeto pode ter apenas uma disciplina vinculada, conforme edital',
        })
      }

      // Verificar se já existe projeto para a mesma disciplina-turma no período
      if (disciplinaIds && disciplinaIds.length > 0) {
        const disciplinaId = disciplinaIds[0]

        // Buscar disciplina para obter informações de turma
        const disciplina = await ctx.db.query.disciplinaTable.findFirst({
          where: eq(disciplinaTable.id, disciplinaId),
        })

        if (!disciplina) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Disciplina não encontrada',
          })
        }

        // Verificar se já existe projeto para a mesma disciplina no período
        const projetoExistente = await ctx.db.query.projetoTable.findFirst({
          where: and(
            eq(projetoTable.ano, rest.ano),
            eq(projetoTable.semestre, rest.semestre),
            isNull(projetoTable.deletedAt)
          ),
          with: {
            disciplinas: {
              with: {
                disciplina: true,
              },
            },
          },
        })

        if (projetoExistente) {
          const disciplinaConflito = projetoExistente.disciplinas.find(
            (pd) => pd.disciplina.codigo === disciplina.codigo && pd.disciplina.turma === disciplina.turma
          )

          if (disciplinaConflito) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Já existe um projeto para a disciplina ${disciplina.codigo} (${disciplina.turma}) no período ${rest.ano}.${rest.semestre}`,
            })
          }
        }
      }

      const [novoProjeto] = await ctx.db
        .insert(projetoTable)
        .values({
          ...rest,
          professorResponsavelId,
          bolsasSolicitadas: rest.bolsasSolicitadas || 0,
          voluntariosSolicitados: rest.voluntariosSolicitados || 0,
        })
        .returning()

      if (disciplinaIds && disciplinaIds.length > 0) {
        const disciplinaValues = disciplinaIds.map((disciplinaId) => ({
          projetoId: novoProjeto.id,
          disciplinaId,
        }))

        await ctx.db.insert(projetoDisciplinaTable).values(disciplinaValues)

        // Auto-associar professor à disciplina para o semestre/ano do projeto
        for (const disciplinaId of disciplinaIds) {
          // Verificar se a associação já existe
          const existingAssociation = await ctx.db.query.disciplinaProfessorResponsavelTable.findFirst({
            where: and(
              eq(disciplinaProfessorResponsavelTable.disciplinaId, disciplinaId),
              eq(disciplinaProfessorResponsavelTable.professorId, professorResponsavelId),
              eq(disciplinaProfessorResponsavelTable.ano, rest.ano),
              eq(disciplinaProfessorResponsavelTable.semestre, rest.semestre)
            ),
          })

          // Se não existe, criar a associação
          if (!existingAssociation) {
            await ctx.db.insert(disciplinaProfessorResponsavelTable).values({
              disciplinaId,
              professorId: professorResponsavelId,
              ano: rest.ano,
              semestre: rest.semestre,
            })

            log.info(
              {
                disciplinaId,
                professorId: professorResponsavelId,
                ano: rest.ano,
                semestre: rest.semestre,
              },
              'Professor auto-associado à disciplina durante criação do projeto'
            )
          }
        }
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

      const [disciplinas, atividadesResult] = await Promise.all([
        db
          .select({
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
            turma: disciplinaTable.turma,
          })
          .from(disciplinaTable)
          .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
          .where(eq(projetoDisciplinaTable.projetoId, novoProjeto.id)),

        db.query.atividadeProjetoTable.findMany({
          where: eq(atividadeProjetoTable.projetoId, novoProjeto.id),
        }),
      ])

      if (!projetoCompleto) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao recuperar projeto recém criado',
        })
      }

      return {
        ...projetoCompleto,
        disciplinas,
        professoresParticipantes: [], // Campo será preenchido via formulário
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
  })

export const updateProjetoHandler = protectedProcedure
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
        id: idSchema,
      })
      .merge(projectFormSchema.partial())
  )
  .output(projectDetailSchema)
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

    const [disciplinas, atividadesResult] = await Promise.all([
      db
        .select({
          id: disciplinaTable.id,
          nome: disciplinaTable.nome,
          codigo: disciplinaTable.codigo,
          turma: disciplinaTable.turma,
        })
        .from(disciplinaTable)
        .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .where(eq(projetoDisciplinaTable.projetoId, id)),

      db.query.atividadeProjetoTable.findMany({
        where: eq(atividadeProjetoTable.projetoId, id),
      }),
    ])

    if (!projetoCompleto) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao recuperar projeto atualizado',
      })
    }

    return {
      ...projetoCompleto,
      disciplinas,
      professoresParticipantes: [], // Campo será preenchido via formulário
      atividades: atividadesResult,
    }
  })

export const deleteProjetoHandler = protectedProcedure
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
      id: idSchema,
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
  })
