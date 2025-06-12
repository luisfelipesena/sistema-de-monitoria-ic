import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { User, userTable } from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export type AppUser = User & {
  professor?: {
    id: number
    departamentoId: number
  } | null
  aluno?: {
    id: number
    cursoId: number
  } | null
}
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
      const baseUser = await ctx.db.query.userTable.findFirst({
        where: eq(userTable.id, ctx.user.id),
      })

      if (!baseUser) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      let fullUser: AppUser = baseUser

      if (baseUser.role === 'professor') {
        const professorProfile = await ctx.db.query.professorTable.findFirst({
          where: (table, { eq }) => eq(table.userId, baseUser.id),
          columns: {
            id: true,
            departamentoId: true,
          },
        })
        fullUser = { ...baseUser, professor: professorProfile }
      } else if (baseUser.role === 'student') {
        const alunoProfile = await ctx.db.query.alunoTable.findFirst({
          where: (table, { eq }) => eq(table.userId, baseUser.id),
          columns: {
            id: true,
            cursoId: true,
          },
        })
        fullUser = { ...baseUser, aluno: alunoProfile }
      }

      return fullUser
    }),
})
