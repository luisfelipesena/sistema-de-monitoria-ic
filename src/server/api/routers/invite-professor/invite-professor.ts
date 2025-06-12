import { z } from 'zod'
import { eq, desc, and } from 'drizzle-orm'
import { createTRPCRouter, adminProtectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { professorInvitationTable, userTable } from '@/server/db/schema'
import crypto from 'crypto'
import { env } from '@/utils/env'

export const inviteProfessorRouter = createTRPCRouter({
  sendInvitation: adminProtectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        expiresInDays: z.number().int().min(1).max(30).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists as user
      const existingUser = await ctx.db.query.userTable.findFirst({
        where: eq(userTable.email, input.email),
      })

      if (existingUser) {
        throw new Error('Usuário com este email já existe no sistema')
      }

      // Check if there's already a pending invitation
      const existingInvitation = await ctx.db.query.professorInvitationTable.findFirst({
        where: and(eq(professorInvitationTable.email, input.email), eq(professorInvitationTable.status, 'PENDING')),
      })

      if (existingInvitation) {
        throw new Error('Já existe um convite pendente para este email')
      }

      // Generate unique token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays)

      // Create invitation
      const [invitation] = await ctx.db
        .insert(professorInvitationTable)
        .values({
          email: input.email,
          token,
          expiresAt,
          invitedByUserId: ctx.user.id,
        })
        .returning()

      // Send email notification
      const { sendProfessorInvitationEmail } = await import('@/server/lib/email-service')
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
      const invitationLink = `${clientUrl}/auth/accept-invitation?token=${token}`

      await sendProfessorInvitationEmail({
        professorEmail: input.email,
        invitationLink,
        adminName: ctx.user.username,
        remetenteUserId: ctx.user.id,
      })

      return {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      }
    }),

  getInvitations: adminProtectedProcedure
    .input(
      z
        .object({
          status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']).optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const invitations = await ctx.db.query.professorInvitationTable.findMany({
        where: input?.status ? eq(professorInvitationTable.status, input.status) : undefined,
        orderBy: [desc(professorInvitationTable.createdAt)],
        with: {
          invitedByUser: {
            columns: {
              username: true,
              email: true,
            },
          },
          acceptedByUser: {
            columns: {
              username: true,
              email: true,
            },
          },
        },
      })

      // Check for expired invitations and update status
      const now = new Date()
      const expiredInvitations = invitations.filter((inv) => inv.status === 'PENDING' && inv.expiresAt < now)

      if (expiredInvitations.length > 0) {
        await Promise.all(
          expiredInvitations.map((inv) =>
            db
              .update(professorInvitationTable)
              .set({ status: 'EXPIRED' })
              .where(eq(professorInvitationTable.id, inv.id))
          )
        )
      }

      return invitations.map((inv) => ({
        ...inv,
        status: inv.status === 'PENDING' && inv.expiresAt < now ? 'EXPIRED' : inv.status,
      }))
    }),

  resendInvitation: adminProtectedProcedure
    .input(
      z.object({
        invitationId: z.number(),
        expiresInDays: z.number().int().min(1).max(30).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.query.professorInvitationTable.findFirst({
        where: eq(professorInvitationTable.id, input.invitationId),
      })

      if (!invitation) {
        throw new Error('Convite não encontrado')
      }

      if (invitation.status === 'ACCEPTED') {
        throw new Error('Este convite já foi aceito')
      }

      // Generate new token and expiration
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays)

      await ctx.db
        .update(professorInvitationTable)
        .set({
          token,
          expiresAt,
          status: 'PENDING',
        })
        .where(eq(professorInvitationTable.id, input.invitationId))

      // Send email notification
      const { sendProfessorInvitationEmail } = await import('@/server/lib/email-service')
      const clientUrl = env.CLIENT_URL || 'http://localhost:3000'
      const invitationLink = `${clientUrl}/auth/accept-invitation?token=${token}`

      await sendProfessorInvitationEmail({
        professorEmail: invitation.email,
        invitationLink,
        adminName: ctx.user.username,
        remetenteUserId: ctx.user.id,
      })

      return { success: true }
    }),

  cancelInvitation: adminProtectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const invitation = await ctx.db.query.professorInvitationTable.findFirst({
        where: eq(professorInvitationTable.id, input.invitationId),
      })

      if (!invitation) {
        throw new Error('Convite não encontrado')
      }

      if (invitation.status === 'ACCEPTED') {
        throw new Error('Não é possível cancelar um convite já aceito')
      }

      await ctx.db
        .update(professorInvitationTable)
        .set({ status: 'EXPIRED' })
        .where(eq(professorInvitationTable.id, input.invitationId))

      return { success: true }
    }),

  deleteInvitation: adminProtectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(professorInvitationTable).where(eq(professorInvitationTable.id, input.invitationId))

      return { success: true }
    }),

  getInvitationStats: adminProtectedProcedure.query(async ({ ctx }) => {
    const invitations = await ctx.db.query.professorInvitationTable.findMany()

    const stats = {
      total: invitations.length,
      pending: invitations.filter((inv) => inv.status === 'PENDING' && inv.expiresAt > new Date()).length,
      accepted: invitations.filter((inv) => inv.status === 'ACCEPTED').length,
      expired: invitations.filter(
        (inv) => inv.status === 'EXPIRED' || (inv.status === 'PENDING' && inv.expiresAt <= new Date())
      ).length,
    }

    return stats
  }),

  validateInvitationToken: adminProtectedProcedure.input(z.object({ token: z.string() })).query(async ({ input, ctx }) => {
    const invitation = await ctx.db.query.professorInvitationTable.findFirst({
      where: eq(professorInvitationTable.token, input.token),
    })

    if (!invitation) {
      throw new Error('Token de convite inválido')
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Este convite não está mais válido')
    }

    if (invitation.expiresAt < new Date()) {
      await ctx.db
        .update(professorInvitationTable)
        .set({ status: 'EXPIRED' })
        .where(eq(professorInvitationTable.id, invitation.id))

      throw new Error('Este convite expirou')
    }

    return {
      email: invitation.email,
      valid: true,
    }
  }),

  getDepartments: adminProtectedProcedure.query(async ({ ctx }) => {
    const departments = await ctx.db.query.departamentoTable.findMany({
      columns: {
        id: true,
        nome: true,
        sigla: true,
        unidadeUniversitaria: true,
      },
    })

    return departments
  }),
})
