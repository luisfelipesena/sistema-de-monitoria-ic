import { adminProcedure, createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { alunoTable, cursoTable, departamentoTable, professorTable, userTable } from '@/server/db/schema'
import { UserRole } from '@/types/enums'
import { and, count, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'

export const userRouter = createTRPCRouter({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/user',
        tags: ['user'],
        summary: 'List all users',
        description: 'Get all users in the system with optional filtering',
      },
    })
    .input(
      z.object({
        role: z.nativeEnum(UserRole).optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .output(
      z.object({
        users: z.array(
          z.object({
            id: z.number(),
            username: z.string(),
            email: z.string(),
            role: z.nativeEnum(UserRole),
            profile: z
              .object({
                id: z.number(),
                nomeCompleto: z.string(),
                tipo: z.enum(['professor', 'aluno']),
              })
              .nullable(),
          })
        ),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = []

      if (input.role) {
        conditions.push(eq(userTable.role, input.role))
      }

      if (input.search) {
        conditions.push(
          or(
            ilike(userTable.username, `%${input.search}%`),
            ilike(userTable.email, `%${input.search}%`)
          )
        )
      }

      const offset = (input.page - 1) * input.limit

      const users = await ctx.db
        .select({
          id: userTable.id,
          username: userTable.username,
          email: userTable.email,
          role: userTable.role,
        })
        .from(userTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(input.limit)
        .offset(offset)

      // Get total count
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(userTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
      const total = totalResult[0]?.count ?? 0

      // Attach profile info
      const usersWithProfiles = await Promise.all(
        users.map(async (user) => {
          let profile = null

          if (user.role === UserRole.PROFESSOR) {
            const professor = await ctx.db.query.professorTable.findFirst({
              where: eq(professorTable.userId, user.id),
            })
            if (professor) {
              profile = {
                id: professor.id,
                nomeCompleto: professor.nomeCompleto,
                tipo: 'professor' as const,
              }
            }
          } else if (user.role === UserRole.STUDENT) {
            const aluno = await ctx.db.query.alunoTable.findFirst({
              where: eq(alunoTable.userId, user.id),
            })
            if (aluno) {
              profile = {
                id: aluno.id,
                nomeCompleto: aluno.nomeCompleto,
                tipo: 'aluno' as const,
              }
            }
          }

          return {
            ...user,
            role: user.role as UserRole,
            profile,
          }
        })
      )

      return {
        users: usersWithProfiles,
        total,
        page: input.page,
        limit: input.limit,
      }
    }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/user/{id}',
        tags: ['user'],
        summary: 'Get user by ID',
        description: 'Get detailed information about a specific user',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z
        .object({
          id: z.number(),
          username: z.string(),
          email: z.string(),
          role: z.nativeEnum(UserRole),
          assinaturaDefault: z.string().nullable(),
          professorProfile: z
            .object({
              id: z.number(),
              nomeCompleto: z.string(),
              cpf: z.string(),
              regime: z.enum(['20H', '40H', 'DE']),
              departamento: z.object({
                id: z.number(),
                nome: z.string(),
                sigla: z.string().nullable(),
              }),
            })
            .nullable(),
          studentProfile: z
            .object({
              id: z.number(),
              nomeCompleto: z.string(),
              matricula: z.string(),
              cpf: z.string(),
              cr: z.number(),
              curso: z.object({
                id: z.number(),
                nome: z.string(),
                codigo: z.number(),
              }),
            })
            .nullable(),
        })
        .nullable()
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.userTable.findFirst({
        where: eq(userTable.id, input.id),
      })

      if (!user) {
        return null
      }

      let professorProfile = null
      let studentProfile = null

      if (user.role === UserRole.PROFESSOR) {
        const professor = await ctx.db
          .select({
            professor: professorTable,
            departamento: departamentoTable,
          })
          .from(professorTable)
          .innerJoin(departamentoTable, eq(professorTable.departamentoId, departamentoTable.id))
          .where(eq(professorTable.userId, user.id))
          .limit(1)

        if (professor[0]) {
          professorProfile = {
            id: professor[0].professor.id,
            nomeCompleto: professor[0].professor.nomeCompleto,
            cpf: professor[0].professor.cpf,
            regime: professor[0].professor.regime as '20H' | '40H' | 'DE',
            departamento: {
              id: professor[0].departamento.id,
              nome: professor[0].departamento.nome,
              sigla: professor[0].departamento.sigla,
            },
          }
        }
      } else if (user.role === UserRole.STUDENT) {
        const student = await ctx.db
          .select({
            aluno: alunoTable,
            curso: cursoTable,
          })
          .from(alunoTable)
          .innerJoin(cursoTable, eq(alunoTable.cursoId, cursoTable.id))
          .where(eq(alunoTable.userId, user.id))
          .limit(1)

        if (student[0]) {
          studentProfile = {
            id: student[0].aluno.id,
            nomeCompleto: student[0].aluno.nomeCompleto,
            matricula: student[0].aluno.matricula,
            cpf: student[0].aluno.cpf,
            cr: student[0].aluno.cr,
            curso: {
              id: student[0].curso.id,
              nome: student[0].curso.nome,
              codigo: student[0].curso.codigo,
            },
          }
        }
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as UserRole,
        assinaturaDefault: user.assinaturaDefault,
        professorProfile,
        studentProfile,
      }
    }),

  updateRole: adminProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/user/{id}/role',
        tags: ['user'],
        summary: 'Update user role',
        description: 'Change the role of a user (admin only)',
      },
    })
    .input(
      z.object({
        id: z.number(),
        newRole: z.nativeEnum(UserRole),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.id === ctx.user.id) {
          return {
            success: false,
            error: "You cannot change your own role.",
          }
        }

        await ctx.db
          .update(userTable)
          .set({
            role: input.newRole,
          })
          .where(eq(userTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error('Error updating user role:', error)
        return {
          success: false,
          error: 'Failed to update user role',
        }
      }
    }),

  updateSignature: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/user/{id}/signature',
        tags: ['user'],
        summary: 'Update user signature',
        description: 'Update the default signature for a user',
      },
    })
    .input(
      z.object({
        id: z.number(),
        assinatura: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(userTable)
          .set({
            assinaturaDefault: input.assinatura,
            dataAssinaturaDefault: new Date(),
          })
          .where(eq(userTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error('Error updating user signature:', error)
        return {
          success: false,
          error: 'Failed to update signature',
        }
      }
    }),

  deleteUser: adminProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/user/{id}',
        tags: ['user'],
        summary: 'Delete user',
        description: 'Delete a user from the system (admin only)',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.id === ctx.user.id) {
          return {
            success: false,
            error: 'Cannot delete your own account',
          }
        }

        await ctx.db.delete(userTable).where(eq(userTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error('Error deleting user:', error)
        return {
          success: false,
          error: 'Failed to delete user',
        }
      }
    }),

  getStats: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/user/stats',
        tags: ['user'],
        summary: 'Get user statistics',
        description: 'Get statistics about users in the system',
      },
    })
    .input(z.void())
    .output(
      z.object({
        totalUsers: z.number(),
        usersByRole: z.record(z.string(), z.number()),
        recentlyCreated: z.number(),
        withProfiles: z.object({
          professors: z.number(),
          students: z.number(),
        }),
      })
    )
    .query(async ({ ctx }) => {
      const [totalUsersResult, usersByRoleResult, professorCountResult, studentCountResult] = await Promise.all([
        ctx.db.select({ count: count() }).from(userTable),
        ctx.db
          .select({
            role: userTable.role,
            count: count(),
          })
          .from(userTable)
          .groupBy(userTable.role),
        ctx.db.select({ count: count() }).from(professorTable),
        ctx.db.select({ count: count() }).from(alunoTable),
      ])

      // recentlyCreated is not implemented, so always 0
      const recentlyCreated = 0

      const roleStats = usersByRoleResult.reduce(
        (acc, curr) => {
          acc[curr.role] = curr.count
          return acc
        },
        {} as Record<string, number>
      )

      return {
        totalUsers: totalUsersResult[0]?.count || 0,
        usersByRole: roleStats,
        recentlyCreated,
        withProfiles: {
          professors: professorCountResult[0]?.count || 0,
          students: studentCountResult[0]?.count || 0,
        },
      }
    }),

  searchUsers: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/user/search',
        tags: ['user'],
        summary: 'Search users',
        description: 'Search for users by name, email, or username',
      },
    })
    .input(
      z.object({
        query: z.string().min(2),
        role: z.nativeEnum(UserRole).optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          username: z.string(),
          email: z.string(),
          role: z.nativeEnum(UserRole),
          displayName: z.string(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        or(
          ilike(userTable.username, `%${input.query}%`),
          ilike(userTable.email, `%${input.query}%`)
        ),
      ]

      if (input.role) {
        conditions.push(eq(userTable.role, input.role))
      }

      const users = await ctx.db
        .select({
          id: userTable.id,
          username: userTable.username,
          email: userTable.email,
          role: userTable.role,
        })
        .from(userTable)
        .where(and(...conditions))
        .limit(input.limit)

      const usersWithNames = await Promise.all(
        users.map(async (user) => {
          let displayName = user.username

          if (user.role === UserRole.PROFESSOR) {
            const professor = await ctx.db.query.professorTable.findFirst({
              where: eq(professorTable.userId, user.id),
            })
            if (professor) {
              displayName = professor.nomeCompleto
            }
          } else if (user.role === UserRole.STUDENT) {
            const aluno = await ctx.db.query.alunoTable.findFirst({
              where: eq(alunoTable.userId, user.id),
            })
            if (aluno) {
              displayName = aluno.nomeCompleto
            }
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role as UserRole,
            displayName,
          }
        })
      )

      return usersWithNames
    }),
})
