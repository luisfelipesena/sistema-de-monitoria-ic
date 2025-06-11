import { createTRPCRouter, protectedProcedure, adminProtectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  userTable,
  professorTable,
  alunoTable,
  inscricaoTable,
  vagaTable,
  projetoTable,
  inscricaoDocumentoTable,
} from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
import { eq, and, isNull, or, like, sql } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'UserRouter' })

const userDetailSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  role: z.enum(['admin', 'professor', 'student']),
  assinaturaDefault: z.string().nullable(),
  dataAssinaturaDefault: z.date().nullable(),
  professorProfile: z
    .object({
      id: z.number(),
      nomeCompleto: z.string(),
      cpf: z.string(),
      telefone: z.string().nullable(),
      telefoneInstitucional: z.string().nullable(),
      emailInstitucional: z.string(),
      matriculaSiape: z.string().nullable(),
      regime: z.enum(['20H', '40H', 'DE']),
      departamentoId: z.number(),
      curriculumVitaeFileId: z.string().nullable().optional(),
      comprovanteVinculoFileId: z.string().nullable().optional(),
      assinaturaDefault: z.string().nullable(),
      dataAssinaturaDefault: z.date().nullable(),
      projetos: z.number().optional(),
      projetosAtivos: z.number().optional(),
    })
    .nullable(),
  studentProfile: z
    .object({
      id: z.number(),
      nomeCompleto: z.string(),
      matricula: z.string(),
      cpf: z.string(),
      cr: z.number(),
      cursoId: z.number(),
      telefone: z.string().nullable(),
      emailInstitucional: z.string(),
      historicoEscolarFileId: z.string().nullable().optional(),
      comprovanteMatriculaFileId: z.string().nullable().optional(),
      inscricoes: z.number().optional(),
      bolsasAtivas: z.number().optional(),
      voluntariadosAtivos: z.number().optional(),
      documentosValidados: z.number().optional(),
      totalDocumentos: z.number().optional(),
    })
    .nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const userRouter = createTRPCRouter({
  getUsers: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/users',
        tags: ['users'],
        summary: 'List all users',
        description: 'Retrieve all users with their profiles',
      },
    })
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(['admin', 'professor', 'student']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .output(
      z.object({
        users: z.array(userDetailSchema),
        total: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const whereConditions = []

        if (input.role) {
          whereConditions.push(eq(userTable.role, input.role))
        }

        if (input.search) {
          whereConditions.push(
            or(like(userTable.username, `%${input.search}%`), like(userTable.email, `%${input.search}%`))
          )
        }

        const users = await db.query.userTable.findMany({
          where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
          with: {
            professorProfile: {
              with: {
                departamento: true,
              },
            },
            studentProfile: {
              with: {
                curso: true,
              },
            },
          },
          limit: input.limit,
          offset: input.offset,
          orderBy: (table, { asc }) => [asc(table.username)],
        })

        const total = await db.$count(userTable, whereConditions.length > 0 ? and(...whereConditions) : undefined)

        // Fetch statistics for professors and students
        const formattedUsers = await Promise.all(
          users.map(async (user) => {
            let professorStats = null
            let studentStats = null

            if (user.professorProfile) {
              // Get professor statistics
              const [projetosCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(projetoTable)
                .where(
                  and(eq(projetoTable.professorResponsavelId, user.professorProfile.id), isNull(projetoTable.deletedAt))
                )

              const [projetosAtivosCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(projetoTable)
                .where(
                  and(
                    eq(projetoTable.professorResponsavelId, user.professorProfile.id),
                    eq(projetoTable.status, 'APPROVED'),
                    isNull(projetoTable.deletedAt)
                  )
                )

              professorStats = {
                id: user.professorProfile.id,
                nomeCompleto: user.professorProfile.nomeCompleto,
                cpf: user.professorProfile.cpf,
                telefone: user.professorProfile.telefone,
                telefoneInstitucional: user.professorProfile.telefoneInstitucional,
                emailInstitucional: user.professorProfile.emailInstitucional,
                matriculaSiape: user.professorProfile.matriculaSiape,
                regime: user.professorProfile.regime as '20H' | '40H' | 'DE',
                departamentoId: user.professorProfile.departamentoId,
                assinaturaDefault: user.professorProfile.assinaturaDefault,
                dataAssinaturaDefault: user.professorProfile.dataAssinaturaDefault,
                projetos: projetosCount?.count || 0,
                projetosAtivos: projetosAtivosCount?.count || 0,
              }
            }

            if (user.studentProfile) {
              // Get student statistics
              const [inscricoesCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(inscricaoTable)
                .where(eq(inscricaoTable.alunoId, user.studentProfile.id))

              const [bolsasAtivasCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(vagaTable)
                .where(and(eq(vagaTable.alunoId, user.studentProfile.id), eq(vagaTable.tipo, 'BOLSISTA')))

              const [voluntariadosAtivosCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(vagaTable)
                .where(and(eq(vagaTable.alunoId, user.studentProfile.id), eq(vagaTable.tipo, 'VOLUNTARIO')))

              const [totalDocumentosCount] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(inscricaoDocumentoTable)
                .innerJoin(inscricaoTable, eq(inscricaoDocumentoTable.inscricaoId, inscricaoTable.id))
                .where(eq(inscricaoTable.alunoId, user.studentProfile.id))

              studentStats = {
                id: user.studentProfile.id,
                nomeCompleto: user.studentProfile.nomeCompleto,
                matricula: user.studentProfile.matricula,
                cpf: user.studentProfile.cpf,
                cr: user.studentProfile.cr,
                cursoId: user.studentProfile.cursoId,
                telefone: user.studentProfile.telefone,
                emailInstitucional: user.studentProfile.emailInstitucional,
                inscricoes: inscricoesCount?.count || 0,
                bolsasAtivas: bolsasAtivasCount?.count || 0,
                voluntariadosAtivos: voluntariadosAtivosCount?.count || 0,
                documentosValidados: 0, // TODO: Implement document validation tracking
                totalDocumentos: totalDocumentosCount?.count || 0,
              }
            }

            return {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role as 'admin' | 'professor' | 'student',
              assinaturaDefault: user.assinaturaDefault,
              dataAssinaturaDefault: user.dataAssinaturaDefault,
              professorProfile: professorStats,
              studentProfile: studentStats,
              createdAt: user.assinaturaDefault ? new Date() : undefined,
              updatedAt: user.dataAssinaturaDefault || undefined,
            }
          })
        )

        return {
          users: formattedUsers,
          total,
        }
      } catch (error) {
        log.error(error, 'Error listing users')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving users',
        })
      }
    }),

  getProfile: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/users/profile',
        tags: ['users'],
        summary: 'Get user profile',
        description: "Get current user's profile information",
      },
    })
    .input(z.void())
    .output(userDetailSchema)
    .query(async ({ ctx }) => {
      try {
        const user = await db.query.userTable.findFirst({
          where: eq(userTable.id, ctx.user.id),
          with: {
            professorProfile: {
              with: {
                departamento: true,
              },
            },
            studentProfile: {
              with: {
                curso: true,
              },
            },
          },
        })

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          })
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role as 'admin' | 'professor' | 'student',
          assinaturaDefault: user.assinaturaDefault,
          dataAssinaturaDefault: user.dataAssinaturaDefault,
          professorProfile: user.professorProfile
            ? {
                id: user.professorProfile.id,
                nomeCompleto: user.professorProfile.nomeCompleto,
                cpf: user.professorProfile.cpf,
                telefone: user.professorProfile.telefone,
                telefoneInstitucional: user.professorProfile.telefoneInstitucional,
                emailInstitucional: user.professorProfile.emailInstitucional,
                matriculaSiape: user.professorProfile.matriculaSiape,
                regime: user.professorProfile.regime as '20H' | '40H' | 'DE',
                departamentoId: user.professorProfile.departamentoId,
                curriculumVitaeFileId: user.professorProfile.curriculumVitaeFileId,
                comprovanteVinculoFileId: user.professorProfile.comprovanteVinculoFileId,
                assinaturaDefault: user.professorProfile.assinaturaDefault,
                dataAssinaturaDefault: user.professorProfile.dataAssinaturaDefault,
              }
            : null,
          studentProfile: user.studentProfile
            ? {
                id: user.studentProfile.id,
                nomeCompleto: user.studentProfile.nomeCompleto,
                matricula: user.studentProfile.matricula,
                cpf: user.studentProfile.cpf,
                cr: user.studentProfile.cr,
                cursoId: user.studentProfile.cursoId,
                telefone: user.studentProfile.telefone,
                emailInstitucional: user.studentProfile.emailInstitucional,
                historicoEscolarFileId: user.studentProfile.historicoEscolarFileId,
                comprovanteMatriculaFileId: user.studentProfile.comprovanteMatriculaFileId,
              }
            : null,
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Error getting user profile')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving profile',
        })
      }
    }),

  updateProfile: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/users/profile',
        tags: ['users'],
        summary: 'Update user profile',
        description: "Update current user's profile information",
      },
    })
    .input(
      z.object({
        username: z.string().min(1).optional(),
        professorData: z
          .object({
            nomeCompleto: z.string().min(1),
            cpf: z.string().min(11),
            telefone: z.string().optional(),
            telefoneInstitucional: z.string().optional(),
            regime: z.enum(['20H', '40H', 'DE']),
          })
          .optional(),
        studentData: z
          .object({
            nomeCompleto: z.string().min(1),
            matricula: z.string().min(1),
            cpf: z.string().min(11),
            cr: z.number().min(0).max(10),
            cursoId: z.number(),
            telefone: z.string().optional(),
          })
          .optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Update user table if username provided
        if (input.username) {
          await db.update(userTable).set({ username: input.username }).where(eq(userTable.id, ctx.user.id))
        }

        // Update professor profile if provided
        if (input.professorData && ctx.user.role === 'professor') {
          await db
            .update(professorTable)
            .set({
              nomeCompleto: input.professorData.nomeCompleto,
              cpf: input.professorData.cpf,
              telefone: input.professorData.telefone,
              telefoneInstitucional: input.professorData.telefoneInstitucional,
              regime: input.professorData.regime,
              updatedAt: new Date(),
            })
            .where(eq(professorTable.userId, ctx.user.id))
        }

        // Update student profile if provided
        if (input.studentData && ctx.user.role === 'student') {
          await db
            .update(alunoTable)
            .set({
              nomeCompleto: input.studentData.nomeCompleto,
              matricula: input.studentData.matricula,
              cpf: input.studentData.cpf,
              cr: input.studentData.cr,
              cursoId: input.studentData.cursoId,
              telefone: input.studentData.telefone,
              updatedAt: new Date(),
            })
            .where(eq(alunoTable.userId, ctx.user.id))
        }

        log.info({ userId: ctx.user.id }, 'User profile updated successfully')
        return { success: true }
      } catch (error) {
        log.error(error, 'Error updating user profile')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error updating profile',
        })
      }
    }),

  getUserById: adminProtectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const user = await db.query.userTable.findFirst({
          where: eq(userTable.id, input.id),
          with: {
            professorProfile: true,
            studentProfile: true,
          },
        })

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          })
        }

        return user
      } catch (error) {
        if (error instanceof TRPCError) throw error

        log.error(error, 'Error fetching user by id')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error fetching user',
        })
      }
    }),

  updateUser: adminProtectedProcedure
    .input(
      z.object({
        id: z.number(),
        username: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(['admin', 'professor', 'student']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input

        await db.update(userTable).set(updateData).where(eq(userTable.id, id))

        log.info({ userId: id }, 'User updated successfully')
        return { success: true }
      } catch (error) {
        log.error(error, 'Error updating user')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error updating user',
        })
      }
    }),
})
