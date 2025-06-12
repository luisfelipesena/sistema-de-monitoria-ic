import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import {
  disciplinaTable,
  disciplinaSchema,
  newDisciplinaSchema,
  disciplinaProfessorResponsavelTable,
  professorTable,
  projetoTable,
  projetoDisciplinaTable,
  inscricaoTable,
} from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'DisciplineRouter' })

export const updateDisciplinaSchema = z.object({
  id: z.number(),
  nome: z.string().optional(),
  codigo: z.string().optional(),
  departamentoId: z.number().optional(),
})

export const disciplineRouter = createTRPCRouter({
  getDisciplineWithProfessor: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines/{id}/professor',
        tags: ['disciplines'],
        summary: 'Get discipline with responsible professor',
        description: 'Get discipline details with responsible professor for current semester',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z.object({
        disciplina: disciplinaSchema,
        professor: z
          .object({
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
          })
          .nullable(),
      })
    )
    .query(async ({ input, ctx }) => {
      const disciplina = await ctx.db.query.disciplinaTable.findFirst({
        where: eq(disciplinaTable.id, input.id),
      })

      if (!disciplina) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Disciplina não encontrada' })
      }

      // Get current year and semester
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentSemestre = now.getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2'

      // Find responsible professor for this discipline in current semester
      const professorResponsavel = await ctx.db
        .select({
          professor: professorTable,
        })
        .from(disciplinaProfessorResponsavelTable)
        .innerJoin(professorTable, eq(disciplinaProfessorResponsavelTable.professorId, professorTable.id))
        .where(
          and(
            eq(disciplinaProfessorResponsavelTable.disciplinaId, input.id),
            eq(disciplinaProfessorResponsavelTable.ano, currentYear),
            eq(disciplinaProfessorResponsavelTable.semestre, currentSemestre)
          )
        )
        .limit(1)

      return {
        disciplina,
        professor: professorResponsavel[0]?.professor || null,
      }
    }),

  getDisciplines: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines',
        tags: ['disciplines'],
        summary: 'Get disciplines',
        description: 'Retrieve the disciplines',
      },
    })
    .input(z.void())
    .output(z.array(disciplinaSchema))
    .query(async ({ ctx }) => {
      const disciplinas = await ctx.db.query.disciplinaTable.findMany()
      return disciplinas
    }),

  getDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines/{id}',
        tags: ['disciplines'],
        summary: 'Get discipline',
        description: 'Retrieve the discipline',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(disciplinaSchema)
    .query(async ({ input, ctx }) => {
      const disciplina = await ctx.db.query.disciplinaTable.findFirst({
        where: eq(disciplinaTable.id, input.id),
      })

      if (!disciplina) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return disciplina
    }),

  create: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/disciplines',
        tags: ['disciplines'],
        summary: 'Create discipline',
        description: 'Create a new discipline',
      },
    })
    .input(newDisciplinaSchema)
    .output(disciplinaSchema)
    .mutation(async ({ input, ctx }) => {
      const disciplina = await ctx.db.insert(disciplinaTable).values(input).returning()
      return disciplina[0]
    }),

  updateDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/disciplines/{id}',
        tags: ['disciplines'],
        summary: 'Update discipline',
        description: 'Update the discipline',
      },
    })
    .input(updateDisciplinaSchema)
    .output(disciplinaSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input
      const disciplina = await ctx.db
        .update(disciplinaTable)
        .set(updateData)
        .where(eq(disciplinaTable.id, id))
        .returning()

      if (!disciplina[0]) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return disciplina[0]
    }),

  deleteDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/disciplines/{id}',
        tags: ['disciplines'],
        summary: 'Delete discipline',
        description: 'Delete the discipline',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.delete(disciplinaTable).where(eq(disciplinaTable.id, input.id)).returning()

      if (!result.length) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
    }),

  getProfessorDisciplines: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines/professor',
        tags: ['disciplines'],
        summary: 'Get professor disciplines',
        description: 'Get disciplines taught by the current professor',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          codigo: z.string(),
          nome: z.string(),
          cargaHoraria: z.number(),
          projetosAtivos: z.number(),
          monitoresAtivos: z.number(),
          voluntariosAtivos: z.number(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas professores podem ver suas disciplinas',
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

        // Get current year and semester
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentSemester = now.getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2'

        // Get disciplines taught by this professor
        const disciplinasResponsavel = await ctx.db
          .select({
            disciplinaId: disciplinaProfessorResponsavelTable.disciplinaId,
          })
          .from(disciplinaProfessorResponsavelTable)
          .where(
            and(
              eq(disciplinaProfessorResponsavelTable.professorId, professor.id),
              eq(disciplinaProfessorResponsavelTable.ano, currentYear),
              eq(disciplinaProfessorResponsavelTable.semestre, currentSemester)
            )
          )

        const disciplinaIds = disciplinasResponsavel.map((d) => d.disciplinaId)

        if (disciplinaIds.length === 0) {
          return []
        }

        // Get discipline details
        const disciplinas = await ctx.db.query.disciplinaTable.findMany({
          where: and(sql`${disciplinaTable.id} IN (${disciplinaIds.join(',')})`),
        })

        // Get active projects count for each discipline
        const projetosAtivos = await ctx.db
          .select({
            disciplinaId: projetoDisciplinaTable.disciplinaId,
            count: sql<number>`count(distinct ${projetoTable.id})`,
          })
          .from(projetoDisciplinaTable)
          .innerJoin(projetoTable, eq(projetoDisciplinaTable.projetoId, projetoTable.id))
          .where(
            and(
              sql`${projetoDisciplinaTable.disciplinaId} IN (${disciplinaIds.join(',')})`,
              eq(projetoTable.professorResponsavelId, professor.id),
              eq(projetoTable.status, 'APPROVED'),
              eq(projetoTable.ano, currentYear),
              eq(projetoTable.semestre, currentSemester)
            )
          )
          .groupBy(projetoDisciplinaTable.disciplinaId)

        const projetosMap = new Map(projetosAtivos.map((p) => [p.disciplinaId, Number(p.count)]))

        // Get monitors count for each discipline
        const monitores = await ctx.db
          .select({
            disciplinaId: projetoDisciplinaTable.disciplinaId,
            bolsistas: sql<number>`count(case when ${inscricaoTable.status} = 'ACCEPTED_BOLSISTA' then 1 end)`,
            voluntarios: sql<number>`count(case when ${inscricaoTable.status} = 'ACCEPTED_VOLUNTARIO' then 1 end)`,
          })
          .from(projetoDisciplinaTable)
          .innerJoin(projetoTable, eq(projetoDisciplinaTable.projetoId, projetoTable.id))
          .leftJoin(inscricaoTable, eq(inscricaoTable.projetoId, projetoTable.id))
          .where(
            and(
              sql`${projetoDisciplinaTable.disciplinaId} IN (${disciplinaIds.join(',')})`,
              eq(projetoTable.professorResponsavelId, professor.id)
            )
          )
          .groupBy(projetoDisciplinaTable.disciplinaId)

        const monitoresMap = new Map(
          monitores.map((m) => [m.disciplinaId, { bolsistas: Number(m.bolsistas), voluntarios: Number(m.voluntarios) }])
        )

        const result = disciplinas.map((disciplina) => {
          const projetosCount = projetosMap.get(disciplina.id) || 0
          const monitoresData = monitoresMap.get(disciplina.id) || { bolsistas: 0, voluntarios: 0 }

          return {
            id: disciplina.id,
            codigo: disciplina.codigo,
            nome: disciplina.nome,
            cargaHoraria: 60, // Default, could be made configurable
            projetosAtivos: projetosCount,
            monitoresAtivos: monitoresData.bolsistas,
            voluntariosAtivos: monitoresData.voluntarios,
          }
        })

        log.info('Disciplinas do professor recuperadas com sucesso')
        return result
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao recuperar disciplinas do professor')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao recuperar disciplinas',
        })
      }
    }),

  getDepartmentDisciplines: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines/department',
        tags: ['disciplines'],
        summary: 'Get department disciplines',
        description: "Get all disciplines from professor's department",
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          codigo: z.string(),
          nome: z.string(),
          departamentoId: z.number(),
          isAssociated: z.boolean(),
          ano: z.number().optional(),
          semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas professores podem ver disciplinas do departamento',
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

        const now = new Date()
        const currentYear = now.getFullYear()
        const currentSemester = now.getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2'

        const disciplinas = await ctx.db.query.disciplinaTable.findMany({
          where: eq(disciplinaTable.departamentoId, professor.departamentoId),
        })

        const associacoes = await ctx.db
          .select({
            disciplinaId: disciplinaProfessorResponsavelTable.disciplinaId,
            ano: disciplinaProfessorResponsavelTable.ano,
            semestre: disciplinaProfessorResponsavelTable.semestre,
          })
          .from(disciplinaProfessorResponsavelTable)
          .where(
            and(
              eq(disciplinaProfessorResponsavelTable.professorId, professor.id),
              eq(disciplinaProfessorResponsavelTable.ano, currentYear),
              eq(disciplinaProfessorResponsavelTable.semestre, currentSemester)
            )
          )

        const associacoesMap = new Map(associacoes.map((a) => [a.disciplinaId, { ano: a.ano, semestre: a.semestre }]))

        return disciplinas.map((disciplina) => {
          const associacao = associacoesMap.get(disciplina.id)
          return {
            id: disciplina.id,
            codigo: disciplina.codigo,
            nome: disciplina.nome,
            departamentoId: disciplina.departamentoId,
            isAssociated: !!associacao,
            ano: associacao?.ano,
            semestre: associacao?.semestre,
          }
        })
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao recuperar disciplinas do departamento')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao recuperar disciplinas do departamento',
        })
      }
    }),

  associateDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/disciplines/{id}/associate',
        tags: ['disciplines'],
        summary: 'Associate professor with discipline',
        description: 'Associate current professor with a discipline for a specific period',
      },
    })
    .input(
      z.object({
        id: z.number(),
        ano: z.number(),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas professores podem se associar a disciplinas',
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

        const disciplina = await ctx.db.query.disciplinaTable.findFirst({
          where: eq(disciplinaTable.id, input.id),
        })

        if (!disciplina) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Disciplina não encontrada',
          })
        }

        if (disciplina.departamentoId !== professor.departamentoId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Você só pode se associar a disciplinas do seu departamento',
          })
        }

        const existingAssociation = await ctx.db.query.disciplinaProfessorResponsavelTable.findFirst({
          where: and(
            eq(disciplinaProfessorResponsavelTable.disciplinaId, input.id),
            eq(disciplinaProfessorResponsavelTable.professorId, professor.id),
            eq(disciplinaProfessorResponsavelTable.ano, input.ano),
            eq(disciplinaProfessorResponsavelTable.semestre, input.semestre)
          ),
        })

        if (existingAssociation) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Você já está associado a esta disciplina neste período',
          })
        }

        await ctx.db.insert(disciplinaProfessorResponsavelTable).values({
          disciplinaId: input.id,
          professorId: professor.id,
          ano: input.ano,
          semestre: input.semestre,
        })

        log.info({ professorId: professor.id, disciplinaId: input.id }, 'Professor associado à disciplina')
        return { success: true }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao associar professor à disciplina')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao associar professor à disciplina',
        })
      }
    }),

  disassociateDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/disciplines/{id}/disassociate',
        tags: ['disciplines'],
        summary: 'Disassociate professor from discipline',
        description: 'Remove association between professor and discipline for a specific period',
      },
    })
    .input(
      z.object({
        id: z.number(),
        ano: z.number(),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas professores podem se desassociar de disciplinas',
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

        const result = await ctx.db
          .delete(disciplinaProfessorResponsavelTable)
          .where(
            and(
              eq(disciplinaProfessorResponsavelTable.disciplinaId, input.id),
              eq(disciplinaProfessorResponsavelTable.professorId, professor.id),
              eq(disciplinaProfessorResponsavelTable.ano, input.ano),
              eq(disciplinaProfessorResponsavelTable.semestre, input.semestre)
            )
          )
          .returning()

        if (!result.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Associação não encontrada',
          })
        }

        log.info({ professorId: professor.id, disciplinaId: input.id }, 'Professor desassociado da disciplina')
        return { success: true }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao desassociar professor da disciplina')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao desassociar professor da disciplina',
        })
      }
    }),
})
