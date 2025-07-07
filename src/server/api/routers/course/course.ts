import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { alunoTable, cursoTable } from '@/server/db/schema'
import { courseSchema, createCourseSchema, updateCourseSchema } from '@/types'
import { TRPCError } from '@trpc/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

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
    .output(z.array(courseSchema))
    .query(async ({ input, ctx }) => {
      const cursos = await ctx.db.query.cursoTable.findMany({
        orderBy: (cursos, { asc }) => [asc(cursos.nome)],
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

          // Note: disciplinas are not directly linked to cursos in the current schema
          // They are linked through departamento. This would need schema adjustment
          // For now, we'll return 0 or implement a more complex query if needed
          const disciplinasCount = 0

          return {
            ...curso,
            alunos: alunosCount?.count || 0,
            disciplinas: disciplinasCount,
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
        description: 'Delete the course',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.delete(cursoTable).where(eq(cursoTable.id, input.id)).returning()

      if (!result.length) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
    }),
})
