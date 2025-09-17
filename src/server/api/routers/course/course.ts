import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { alunoTable, cursoTable, disciplinaTable, projetoTable } from '@/server/db/schema'
import { courseSchema, createCourseSchema, updateCourseSchema } from '@/types'
import { TRPCError } from '@trpc/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const courseWithStatsSchema = courseSchema.extend({
  alunos: z.number().min(0),
  disciplinas: z.number().min(0),
  projetos: z.number().min(0),
})

export const courseRouter = createTRPCRouter({
  getCourses: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/courses',
        tags: ['courses'],
        summary: 'Get courses',
        description: 'Retrieve all courses with optional statistics',
      },
    })
    .input(
      z.object({
        includeStats: z.boolean().default(false),
      })
    )
    .output(z.array(z.union([courseSchema, courseWithStatsSchema])))
    .query(async ({ input, ctx }) => {
      const cursos = await ctx.db.query.cursoTable.findMany({
        orderBy: (curso, { asc }) => [asc(curso.nome)],
      })

      if (!input.includeStats) {
        return cursos
      }

      // Add statistics for each course
      const cursosWithStats = await Promise.all(
        cursos.map(async (curso) => {
          const [alunosCount] = await ctx.db
            .select({ count: sql<number>`count(*)::int` })
            .from(alunoTable)
            .where(eq(alunoTable.cursoId, curso.id))

          const [disciplinasCount] = await ctx.db
            .select({ count: sql<number>`count(*)::int` })
            .from(disciplinaTable)
            .where(eq(disciplinaTable.departamentoId, curso.departamentoId))

          const [projetosCount] = await ctx.db
            .select({ count: sql<number>`count(*)::int` })
            .from(projetoTable)
            .where(and(eq(projetoTable.departamentoId, curso.departamentoId)))

          return {
            ...curso,
            alunos: alunosCount?.count || 0,
            disciplinas: disciplinasCount?.count || 0,
            projetos: projetosCount?.count || 0,
          }
        })
      )

      return cursosWithStats
    }),

  getCourse: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/courses/{id}',
        tags: ['courses'],
        summary: 'Get course',
        description: 'Retrieve the course',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(courseSchema)
    .query(async ({ input, ctx }) => {
      const curso = await ctx.db.query.cursoTable.findFirst({
        where: eq(cursoTable.id, input.id),
      })

      if (!curso) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return curso
    }),

  createCourse: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/courses',
        tags: ['courses'],
        summary: 'Create course',
        description: 'Create a new course',
      },
    })
    .input(createCourseSchema)
    .output(courseSchema)
    .mutation(async ({ input, ctx }) => {
      const curso = await ctx.db.insert(cursoTable).values(input).returning()
      return curso[0]
    }),

  updateCourse: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/courses/{id}',
        tags: ['courses'],
        summary: 'Update course',
        description: 'Update the course',
      },
    })
    .input(updateCourseSchema)
    .output(courseSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input
      const curso = await ctx.db.update(cursoTable).set(updateData).where(eq(cursoTable.id, id)).returning()

      if (!curso[0]) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return curso[0]
    }),

  deleteCourse: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/courses/{id}',
        tags: ['courses'],
        summary: 'Delete course',
        description: 'Delete the course and all its dependencies',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      // Check if course exists
      const curso = await ctx.db.query.cursoTable.findFirst({
        where: eq(cursoTable.id, input.id),
      })

      if (!curso) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Curso não encontrado' })
      }

      // Use transaction to ensure all deletions succeed or fail together
      await ctx.db.transaction(async (tx) => {
        // Note: Due to cascade delete constraints in the schema (onDelete: 'cascade'),
        // related records in aluno table will be automatically deleted when we delete the course
        // This is already configured in the schema where alunoTable references cursoTable

        const result = await tx.delete(cursoTable).where(eq(cursoTable.id, input.id)).returning()

        if (!result.length) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Erro ao deletar curso' })
        }
      })
    }),
})
