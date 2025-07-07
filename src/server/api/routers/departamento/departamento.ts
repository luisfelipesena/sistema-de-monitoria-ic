import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { cursoTable, departamentoTable, disciplinaTable, professorTable, projetoTable } from '@/server/db/schema'
import { createDepartmentSchema, departamentoSchema, updateDepartmentSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'DepartamentoRouter' })

export const departamentoRouter = createTRPCRouter({
  getDepartamentos: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/departamentos',
        tags: ['departamentos'],
        summary: 'Get departamentos',
        description: 'Retrieve all departamentos with statistics',
      },
    })
    .input(
      z.object({
        includeStats: z.boolean().default(false),
      })
    )
    .output(z.array(departamentoSchema))
    .query(async ({ input, ctx }) => {
      try {
        const departamentos = await ctx.db.query.departamentoTable.findMany({
          orderBy: (departamentos, { asc }) => [asc(departamentos.nome)],
        })

        if (!input.includeStats) {
          log.info('Departamentos recuperados com sucesso (sem estatísticas)')
          return departamentos
        }

        // Add statistics for each department
        const departamentosWithStats = await Promise.all(
          departamentos.map(async (departamento) => {
            const [professoresCount] = await ctx.db
              .select({ count: sql<number>`count(*)::int` })
              .from(professorTable)
              .where(eq(professorTable.departamentoId, departamento.id))

            const [cursosCount] = await ctx.db
              .select({ count: sql<number>`count(*)::int` })
              .from(cursoTable)
              .where(eq(cursoTable.departamentoId, departamento.id))

            const [disciplinasCount] = await ctx.db
              .select({ count: sql<number>`count(*)::int` })
              .from(disciplinaTable)
              .where(and(eq(disciplinaTable.departamentoId, departamento.id), isNull(disciplinaTable.deletedAt)))

            const [projetosCount] = await ctx.db
              .select({ count: sql<number>`count(*)::int` })
              .from(projetoTable)
              .where(and(eq(projetoTable.departamentoId, departamento.id), isNull(projetoTable.deletedAt)))

            return {
              ...departamento,
              professores: professoresCount?.count || 0,
              cursos: cursosCount?.count || 0,
              disciplinas: disciplinasCount?.count || 0,
              projetos: projetosCount?.count || 0,
            }
          })
        )

        log.info('Departamentos recuperados com sucesso (com estatísticas)')
        return departamentosWithStats
      } catch (error) {
        log.error(error, 'Erro ao recuperar departamentos')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao recuperar departamentos',
        })
      }
    }),

  getDepartamento: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/departamentos/{id}',
        tags: ['departamentos'],
        summary: 'Get departamento',
        description: 'Retrieve a specific departamento',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(departamentoSchema)
    .query(async ({ input, ctx }) => {
      const departamento = await ctx.db.query.departamentoTable.findFirst({
        where: eq(departamentoTable.id, input.id),
      })

      if (!departamento) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Departamento não encontrado',
        })
      }

      return departamento
    }),

  createDepartamento: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/departamentos',
        tags: ['departamentos'],
        summary: 'Create departamento',
        description: 'Create a new departamento',
      },
    })
    .input(createDepartmentSchema)
    .output(departamentoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.db
          .insert(departamentoTable)
          .values({
            nome: input.nome,
            sigla: input.sigla,
            unidadeUniversitaria: input.unidadeUniversitaria,
            coordenador: input.coordenador,
            email: input.email || null,
            telefone: input.telefone,
            descricao: input.descricao,
          })
          .returning()

        log.info({ departamentoId: result[0].id }, 'Departamento criado com sucesso')
        return result[0]
      } catch (error) {
        log.error(error, 'Erro ao criar departamento')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar departamento',
        })
      }
    }),

  updateDepartamento: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/departamentos/{id}',
        tags: ['departamentos'],
        summary: 'Update departamento',
        description: 'Update an existing departamento',
      },
    })
    .input(updateDepartmentSchema)
    .output(departamentoSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input

      const departamento = await ctx.db.query.departamentoTable.findFirst({
        where: eq(departamentoTable.id, id),
      })

      if (!departamento) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Departamento não encontrado',
        })
      }

      const cleanedUpdateData = {
        ...updateData,
        email: updateData.email || null,
      }

      const result = await ctx.db
        .update(departamentoTable)
        .set({
          ...cleanedUpdateData,
          updatedAt: new Date(),
        })
        .where(eq(departamentoTable.id, id))
        .returning()

      return result[0]
    }),

  deleteDepartamento: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/departamentos/{id}',
        tags: ['departamentos'],
        summary: 'Delete departamento',
        description: 'Delete a departamento',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const departamento = await ctx.db.query.departamentoTable.findFirst({
        where: eq(departamentoTable.id, input.id),
      })

      if (!departamento) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Departamento não encontrado',
        })
      }

      // Check if there are associated disciplines
      const disciplinasAssociadas = await ctx.db.query.disciplinaTable.findFirst({
        where: eq(disciplinaTable.departamentoId, input.id),
      })

      if (disciplinasAssociadas) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível excluir o departamento, pois há disciplinas associadas a ele',
        })
      }

      await ctx.db.delete(departamentoTable).where(eq(departamentoTable.id, input.id))

      return { success: true }
    }),
})
