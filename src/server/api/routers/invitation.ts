import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { professorInvitationTable, userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const invitationRouter = createTRPCRouter({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/invitation',
        tags: ['invitation'],
        summary: 'List all professor invitations',
        description: 'Get all professor invitations in the system',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          email: z.string(),
          token: z.string(),
          status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']),
          expiresAt: z.date(),
          invitedBy: z.object({
            id: z.number(),
            username: z.string(),
          }),
          acceptedBy: z.object({
            id: z.number(),
            username: z.string(),
          }).nullable(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const invitations = await ctx.db
        .select({
          invitation: professorInvitationTable,
          invitedBy: {
            id: userTable.id,
            username: userTable.username,
          },
        })
        .from(professorInvitationTable)
        .innerJoin(userTable, eq(professorInvitationTable.invitedByUserId, userTable.id))

      const result = await Promise.all(
        invitations.map(async (item) => {
          let acceptedBy = null

          if (item.invitation.acceptedByUserId) {
            const acceptedByResult = await ctx.db
              .select({
                id: userTable.id,
                username: userTable.username,
              })
              .from(userTable)
              .where(eq(userTable.id, item.invitation.acceptedByUserId))
              .limit(1)

            acceptedBy = acceptedByResult[0] || null
          }

          return {
            id: item.invitation.id,
            email: item.invitation.email,
            token: item.invitation.token,
            status: item.invitation.status as 'PENDING' | 'ACCEPTED' | 'EXPIRED',
            expiresAt: item.invitation.expiresAt,
            invitedBy: item.invitedBy,
            acceptedBy,
            createdAt: item.invitation.createdAt,
          }
        })
      )

      return result
    }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/invitation/{id}',
        tags: ['invitation'],
        summary: 'Get invitation by ID',
        description: 'Get a specific invitation by its ID',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        email: z.string(),
        token: z.string(),
        status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']),
        expiresAt: z.date(),
        invitedBy: z.object({
          id: z.number(),
          username: z.string(),
        }),
        acceptedBy: z.object({
          id: z.number(),
          username: z.string(),
        }).nullable(),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          invitation: professorInvitationTable,
          invitedBy: {
            id: userTable.id,
            username: userTable.username,
          },
        })
        .from(professorInvitationTable)
        .innerJoin(userTable, eq(professorInvitationTable.invitedByUserId, userTable.id))
        .where(eq(professorInvitationTable.id, input.id))
        .limit(1)

      if (!result[0]) {
        throw new Error('Invitation not found')
      }

      let acceptedBy = null

      if (result[0].invitation.acceptedByUserId) {
        const acceptedByResult = await ctx.db
          .select({
            id: userTable.id,
            username: userTable.username,
          })
          .from(userTable)
          .where(eq(userTable.id, result[0].invitation.acceptedByUserId))
          .limit(1)

        acceptedBy = acceptedByResult[0] || null
      }

      return {
        id: result[0].invitation.id,
        email: result[0].invitation.email,
        token: result[0].invitation.token,
        status: result[0].invitation.status as 'PENDING' | 'ACCEPTED' | 'EXPIRED',
        expiresAt: result[0].invitation.expiresAt,
        invitedBy: result[0].invitedBy,
        acceptedBy,
        createdAt: result[0].invitation.createdAt,
        updatedAt: result[0].invitation.updatedAt,
      }
    }),

  create: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/invitation',
        tags: ['invitation'],
        summary: 'Create a new professor invitation',
        description: 'Create a new professor invitation',
      },
    })
    .input(
      z.object({
        email: z.string().email(),
        invitedByUserId: z.number(),
        expiresAt: z.date().optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        email: z.string(),
        token: z.string(),
        status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']),
        expiresAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiresAt = input.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

      const [invitation] = await ctx.db
        .insert(professorInvitationTable)
        .values({
          email: input.email,
          token,
          status: 'PENDING',
          expiresAt,
          invitedByUserId: input.invitedByUserId,
        })
        .returning()

      return {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        status: invitation.status as 'PENDING' | 'ACCEPTED' | 'EXPIRED',
        expiresAt: invitation.expiresAt,
      }
    }),

  update: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/invitation/{id}',
        tags: ['invitation'],
        summary: 'Update an invitation',
        description: 'Update an existing invitation',
      },
    })
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']).optional(),
        acceptedByUserId: z.number().optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        email: z.string(),
        status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']),
        expiresAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      if (input.status) updateData.status = input.status
      if (input.acceptedByUserId !== undefined) updateData.acceptedByUserId = input.acceptedByUserId

      const [invitation] = await ctx.db
        .update(professorInvitationTable)
        .set(updateData)
        .where(eq(professorInvitationTable.id, input.id))
        .returning()

      if (!invitation) {
        throw new Error('Invitation not found')
      }

      return {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status as 'PENDING' | 'ACCEPTED' | 'EXPIRED',
        expiresAt: invitation.expiresAt,
      }
    }),

  delete: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/invitation/{id}',
        tags: ['invitation'],
        summary: 'Delete an invitation',
        description: 'Delete an invitation from the system',
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(professorInvitationTable).where(eq(professorInvitationTable.id, input.id))
      return { success: true }
    }),
}) 