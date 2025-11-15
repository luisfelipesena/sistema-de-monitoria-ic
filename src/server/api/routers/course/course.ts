import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { NotFoundError } from '@/server/lib/errors'
import { createCourseRepository } from '@/server/services/course/course-repository'
import { createCourseService } from '@/server/services/course/course-service'
import { courseSchema, createCourseSchema, updateCourseSchema } from '@/types'
import { TRPCError } from '@trpc/server'
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
    .input(z.object({ includeStats: z.boolean().default(false) }))
    .output(z.array(courseSchema))
    .query(async ({ input, ctx }) => {
      const repository = createCourseRepository(ctx.db)
      const service = createCourseService(repository)
      return await service.getCourses(input.includeStats)
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
    .input(z.object({ id: z.number() }))
    .output(courseSchema)
    .query(async ({ input, ctx }) => {
      try {
        const repository = createCourseRepository(ctx.db)
        const service = createCourseService(repository)
        return await service.getCourse(input.id)
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }
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
      const repository = createCourseRepository(ctx.db)
      const service = createCourseService(repository)
      return await service.createCourse(input)
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
      try {
        const { id, ...updateData } = input
        const repository = createCourseRepository(ctx.db)
        const service = createCourseService(repository)
        return await service.updateCourse(id, updateData)
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }
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
    .input(z.object({ id: z.number() }))
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      try {
        const repository = createCourseRepository(ctx.db)
        const service = createCourseService(repository)
        await service.deleteCourse(input.id)
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao deletar curso' })
      }
    }),
})
