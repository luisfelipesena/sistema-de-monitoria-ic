import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { userService } from '@/server/services/user/user-service'
import {
  adminTypeSchema,
  cpfSchema,
  crSchema,
  emailSchema,
  idSchema,
  nameSchema,
  phoneSchema,
  professorStatusSchema,
  regimeSchema,
  userListItemSchema,
  usernameSchema,
  userRoleSchema,
} from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { BusinessError, NotFoundError, ValidationError } from '@/server/lib/errors'

const log = logger.child({ context: 'UserRouter' })

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
        role: userRoleSchema.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .output(
      z.object({
        users: z.array(userListItemSchema),
        total: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        return await userService.listUsers(input)
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
    .output(userListItemSchema)
    .query(async ({ ctx }) => {
      try {
        return await userService.getProfile(ctx.user.id)
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          })
        }
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
        username: usernameSchema.optional(),
        professorData: z
          .object({
            nomeCompleto: nameSchema,
            cpf: cpfSchema,
            telefone: phoneSchema,
            telefoneInstitucional: phoneSchema,
            regime: regimeSchema,
          })
          .optional(),
        studentData: z
          .object({
            nomeCompleto: nameSchema,
            matricula: z.string().min(1),
            cpf: cpfSchema,
            cr: crSchema,
            cursoNome: z.string().optional(),
            telefone: phoneSchema,
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
        await userService.updateProfile(ctx.user.id, input)
        log.info({ userId: ctx.user.id }, 'User profile updated successfully')
        return { success: true }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        if (error instanceof NotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          })
        }
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
        id: idSchema,
      })
    )
    .query(async ({ input }) => {
      try {
        return await userService.getUserById(input.id)
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          })
        }
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
        id: idSchema,
        username: usernameSchema.optional(),
        email: emailSchema.optional(),
        role: userRoleSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input
        await userService.updateUser(id, updateData)
        log.info({ userId: id }, 'User updated successfully')
        return { success: true }
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          })
        }
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
        id: idSchema,
        status: professorStatusSchema,
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await userService.updateProfessorStatus(input.id, input.status)
        log.info({ userId: input.id, newStatus: input.status }, 'Professor status updated successfully')
        return result
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Usuário não encontrado',
          })
        }
        if (error instanceof ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        log.error(error, 'Error updating professor status')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar status do professor',
        })
      }
    }),

  updateAdminType: protectedProcedure
    .input(
      z.object({
        adminType: adminTypeSchema,
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await userService.updateAdminType(ctx.user.id, input.adminType)
        log.info({ userId: ctx.user.id, adminType: input.adminType }, 'Admin type updated')
        return result
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          })
        }
        if (error instanceof ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        log.error(error, 'Error updating admin type')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar tipo de administrador',
        })
      }
    }),

  deleteUser: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/users/{id}',
        tags: ['users'],
        summary: 'Delete user',
        description: 'Delete a user (professor or student)',
      },
    })
    .input(
      z.object({
        id: idSchema,
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await userService.deleteUser(input.id, ctx.user.id)
        log.info({ userId: input.id, deletedBy: ctx.user.id }, 'User deleted successfully')
        return result
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          })
        }
        if (error instanceof BusinessError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        log.error(error, 'Error deleting user')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao excluir usuário',
        })
      }
    }),
})
