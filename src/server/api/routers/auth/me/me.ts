import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { userTable } from '@/server/db/schema'
import { AppUser } from '@/types'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const meRouter = createTRPCRouter({
  getMe: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/me',
        tags: ['me'],
        summary: 'Get me',
        description: 'Retrieve the current user',
      },
    })
    .input(z.void())
    .output(z.custom<AppUser>())
    .query(async ({ ctx }): Promise<AppUser> => {
      const user = await ctx.db.query.userTable.findFirst({
        where: eq(userTable.id, ctx.user.id),
      })

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      let professorProfile = null
      if (user.role === 'professor') {
        professorProfile = await ctx.db.query.professorTable.findFirst({
          where: (table, { eq }) => eq(table.userId, user.id),
          columns: {
            id: true,
            departamentoId: true,
          },
        })
      }

      let alunoProfile = null
      if (user.role === 'student') {
        alunoProfile = await ctx.db.query.alunoTable.findFirst({
          where: (table, { eq }) => eq(table.userId, user.id),
          columns: {
            id: true,
            cursoId: true,
          },
        })
      }

      return {
        ...user,
        professor: professorProfile,
        aluno: alunoProfile,
      }
    }),
})
