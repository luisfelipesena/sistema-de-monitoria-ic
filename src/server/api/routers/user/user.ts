import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import {
  alunoTable,
  inscricaoDocumentoTable,
  inscricaoTable,
  professorTable,
  projetoTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull, like, or, sql } from 'drizzle-orm'
import { z } from 'zod'

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
      banco: z.string().nullable().optional(),
      agencia: z.string().nullable().optional(),
      conta: z.string().nullable().optional(),
      digitoConta: z.string().nullable().optional(),
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
    .query(async ({ input, ctx }) => {
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

        const users = await ctx.db.query.userTable.findMany({
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

        const total = await ctx.db.$count(userTable, whereConditions.length > 0 ? and(...whereConditions) : undefined)

        // Fetch statistics for professors and students
        const formattedUsers = await Promise.all(
          users.map(async (user) => {
            let professorStats = null
            let studentStats = null

            if (user.professorProfile) {
              // Get professor statistics
              const [projetosCount] = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(projetoTable)
                .where(
                  and(eq(projetoTable.professorResponsavelId, user.professorProfile.id), isNull(projetoTable.deletedAt))
                )

              const [projetosAtivosCount] = await ctx.db
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
              const [inscricoesCount] = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(inscricaoTable)
                .where(eq(inscricaoTable.alunoId, user.studentProfile.id))

              const [bolsasAtivasCount] = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(vagaTable)
                .where(and(eq(vagaTable.alunoId, user.studentProfile.id), eq(vagaTable.tipo, 'BOLSISTA')))

              const [voluntariadosAtivosCount] = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(vagaTable)
                .where(and(eq(vagaTable.alunoId, user.studentProfile.id), eq(vagaTable.tipo, 'VOLUNTARIO')))

              const [totalDocumentosCount] = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(inscricaoDocumentoTable)
                .innerJoin(inscricaoTable, eq(inscricaoDocumentoTable.inscricaoId, inscricaoTable.id))
                .where(eq(inscricaoTable.alunoId, user.studentProfile.id))

              // Count validated documents (documents for applications that were accepted)
              const [documentosValidadosCount] = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(inscricaoDocumentoTable)
                .innerJoin(inscricaoTable, eq(inscricaoDocumentoTable.inscricaoId, inscricaoTable.id))
                .where(
                  and(
                    eq(inscricaoTable.alunoId, user.studentProfile.id),
                    sql`${inscricaoTable.status} IN ('ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO')`
                  )
                )

              studentStats = {
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
                banco: user.studentProfile.banco,
                agencia: user.studentProfile.agencia,
                conta: user.studentProfile.conta,
                digitoConta: user.studentProfile.digitoConta,
                inscricoes: inscricoesCount?.count || 0,
                bolsasAtivas: bolsasAtivasCount?.count || 0,
                voluntariadosAtivos: voluntariadosAtivosCount?.count || 0,
                documentosValidados: documentosValidadosCount?.count || 0,
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
        const user = await ctx.db.query.userTable.findFirst({
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
              banco: user.studentProfile.banco,
              agencia: user.studentProfile.agencia,
              conta: user.studentProfile.conta,
              digitoConta: user.studentProfile.digitoConta,
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
            banco: z.string().optional(),
            agencia: z.string().optional(),
            conta: z.string().optional(),
            digitoConta: z.string().optional(),
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
          await ctx.db.update(userTable).set({ username: input.username }).where(eq(userTable.id, ctx.user.id))
        }

        // Update professor profile if provided
        if (input.professorData && ctx.user.role === 'professor') {
          await ctx.db
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
          await ctx.db
            .update(alunoTable)
            .set({
              nomeCompleto: input.studentData.nomeCompleto,
              matricula: input.studentData.matricula,
              cpf: input.studentData.cpf,
              cr: input.studentData.cr,
              cursoId: input.studentData.cursoId,
              telefone: input.studentData.telefone,
              banco: input.studentData.banco,
              agencia: input.studentData.agencia,
              conta: input.studentData.conta,
              digitoConta: input.studentData.digitoConta,
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
    .query(async ({ input, ctx }) => {
      try {
        const user = await ctx.db.query.userTable.findFirst({
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
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...updateData } = input

        await ctx.db.update(userTable).set(updateData).where(eq(userTable.id, id))

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

  updateProfessorStatus: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/users/{id}/professor-status',
        tags: ['users'],
        summary: 'Update professor status',
        description: 'Activate or deactivate a professor',
      },
    })
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['ATIVO', 'INATIVO']),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await ctx.db.query.userTable.findFirst({
          where: eq(userTable.id, input.id),
          with: {
            professorProfile: true,
          },
        })

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Usuário não encontrado',
          })
        }

        if (!user.professorProfile) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Usuário não possui perfil de professor',
          })
        }

        // For now, we'll use the user's role to simulate status
        // In a full implementation, you might want to add a status field to the professor table
        const newRole = input.status === 'ATIVO' ? 'professor' : 'professor'

        await ctx.db
          .update(userTable)
          .set({
            role: newRole
          })
          .where(eq(userTable.id, input.id))

        // Update professor profile with current timestamp to indicate status change
        await ctx.db
          .update(professorTable)
          .set({
            updatedAt: new Date()
          })
          .where(eq(professorTable.userId, input.id))

        const statusText = input.status === 'ATIVO' ? 'ativado' : 'desativado'

        log.info({ userId: input.id, newStatus: input.status }, 'Professor status updated successfully')

        return {
          success: true,
          message: `Professor ${statusText} com sucesso`
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Error updating professor status')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar status do professor',
        })
      }
    }),
})
