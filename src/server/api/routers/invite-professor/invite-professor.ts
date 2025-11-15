import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { db } from '@/server/db'
import { professorInvitationTable, userTable } from '@/server/db/schema'
import {
  INVITATION_STATUS_ACCEPTED,
  INVITATION_STATUS_EXPIRED,
  INVITATION_STATUS_PENDING,
  cancelInvitationSchema,
  deleteInvitationSchema,
  getInvitationsSchema,
  resendInvitationSchema,
  sendInvitationSchema,
  validateInvitationTokenSchema,
} from '@/types'
import { env } from '@/utils/env'
import crypto from 'crypto'
import { and, desc, eq } from 'drizzle-orm'

export const inviteProfessorRouter = createTRPCRouter({
  sendInvitation: adminProtectedProcedure.input(sendInvitationSchema).mutation(async ({ ctx, input }) => {
    // Check if email already exists as user
    const existingUser = await ctx.db.query.userTable.findFirst({
      where: eq(userTable.email, input.email),
    })

    if (existingUser) {
      throw new Error('Usuário com este email já existe no sistema')
    }

    // Check if there's already a pending invitation
    const existingInvitation = await ctx.db.query.professorInvitationTable.findFirst({
      where: and(
        eq(professorInvitationTable.email, input.email),
        eq(professorInvitationTable.status, INVITATION_STATUS_PENDING)
      ),
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
    const { sendProfessorInvitationEmail } = await import('@/server/lib/email')
    const clientUrl = env.CLIENT_URL || 'http://localhost:3000'
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

  getInvitations: adminProtectedProcedure.input(getInvitationsSchema).query(async ({ input, ctx }) => {
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
    const expiredInvitations = invitations.filter(
      (inv) => inv.status === INVITATION_STATUS_PENDING && inv.expiresAt < now
    )

    if (expiredInvitations.length > 0) {
      await Promise.all(
        expiredInvitations.map((inv) =>
          db
            .update(professorInvitationTable)
            .set({ status: INVITATION_STATUS_EXPIRED })
            .where(eq(professorInvitationTable.id, inv.id))
        )
      )
    }

    return invitations.map((inv) => ({
      ...inv,
      status: inv.status === INVITATION_STATUS_PENDING && inv.expiresAt < now ? INVITATION_STATUS_EXPIRED : inv.status,
    }))
  }),

  resendInvitation: adminProtectedProcedure.input(resendInvitationSchema).mutation(async ({ ctx, input }) => {
    const invitation = await ctx.db.query.professorInvitationTable.findFirst({
      where: eq(professorInvitationTable.id, input.invitationId),
    })

    if (!invitation) {
      throw new Error('Convite não encontrado')
    }

    if (invitation.status === INVITATION_STATUS_ACCEPTED) {
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
        status: INVITATION_STATUS_PENDING,
      })
      .where(eq(professorInvitationTable.id, input.invitationId))

    // Send email notification
    const { sendProfessorInvitationEmail } = await import('@/server/lib/email')
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

  cancelInvitation: adminProtectedProcedure.input(cancelInvitationSchema).mutation(async ({ input, ctx }) => {
    const invitation = await ctx.db.query.professorInvitationTable.findFirst({
      where: eq(professorInvitationTable.id, input.invitationId),
    })

    if (!invitation) {
      throw new Error('Convite não encontrado')
    }

    if (invitation.status === INVITATION_STATUS_ACCEPTED) {
      throw new Error('Não é possível cancelar um convite já aceito')
    }

    await ctx.db
      .update(professorInvitationTable)
      .set({ status: INVITATION_STATUS_EXPIRED })
      .where(eq(professorInvitationTable.id, input.invitationId))

    return { success: true }
  }),

  deleteInvitation: adminProtectedProcedure.input(deleteInvitationSchema).mutation(async ({ input, ctx }) => {
    await ctx.db.delete(professorInvitationTable).where(eq(professorInvitationTable.id, input.invitationId))

    return { success: true }
  }),

  getInvitationStats: adminProtectedProcedure.query(async ({ ctx }) => {
    const invitations = await ctx.db.query.professorInvitationTable.findMany()

    const stats = {
      total: invitations.length,
      pending: invitations.filter((inv) => inv.status === INVITATION_STATUS_PENDING && inv.expiresAt > new Date())
        .length,
      accepted: invitations.filter((inv) => inv.status === INVITATION_STATUS_ACCEPTED).length,
      expired: invitations.filter(
        (inv) =>
          inv.status === INVITATION_STATUS_EXPIRED ||
          (inv.status === INVITATION_STATUS_PENDING && inv.expiresAt <= new Date())
      ).length,
    }

    return stats
  }),

  validateInvitationToken: adminProtectedProcedure
    .input(validateInvitationTokenSchema)
    .query(async ({ input, ctx }) => {
      const invitation = await ctx.db.query.professorInvitationTable.findFirst({
        where: eq(professorInvitationTable.token, input.token),
      })

      if (!invitation) {
        throw new Error('Token de convite inválido')
      }

      if (invitation.status !== INVITATION_STATUS_PENDING) {
        throw new Error('Este convite não está mais válido')
      }

      if (invitation.expiresAt < new Date()) {
        await ctx.db
          .update(professorInvitationTable)
          .set({ status: INVITATION_STATUS_EXPIRED })
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
