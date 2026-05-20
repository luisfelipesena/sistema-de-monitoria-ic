import { adminProtectedProcedure, createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { professorInvitationTable, professorTable, userTable } from '@/server/db/schema'
import {
  INVITATION_STATUS_ACCEPTED,
  INVITATION_STATUS_EXPIRED,
  INVITATION_STATUS_PENDING,
  PROFESSOR_ACCOUNT_ACTIVE,
  PROFESSOR_ACCOUNT_PENDING,
  cancelInvitationSchema,
  deleteInvitationSchema,
  getInvitationsSchema,
  resendInvitationSchema,
  sendInvitationSchema,
  validateInvitationTokenSchema,
} from '@/types'
import { env } from '@/utils/env'
import { hash } from 'bcryptjs'
import crypto from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

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

    // Extract username from email (before @)
    const username = input.email.split('@')[0]

    // Create user with PROFESSOR role (pending activation - no password yet)
    const [newUser] = await ctx.db
      .insert(userTable)
      .values({
        email: input.email,
        username: username,
        role: 'professor',
        passwordHash: null, // Will be set when professor accepts invitation
        emailVerifiedAt: null, // Will be set when professor accepts invitation
      })
      .returning()

    // Create professor with PENDING status
    const [newProfessor] = await ctx.db
      .insert(professorTable)
      .values({
        userId: newUser.id,
        nomeCompleto: input.nomeCompleto,
        departamentoId: input.departamentoId,
        regime: input.regime,
        tipoProfessor: input.tipoProfessor,
        accountStatus: PROFESSOR_ACCOUNT_PENDING,
      })
      .returning()

    // Create invitation linking to created professor
    const [invitation] = await ctx.db
      .insert(professorInvitationTable)
      .values({
        email: input.email,
        token,
        expiresAt,
        invitedByUserId: ctx.user.id,
        nomeCompleto: input.nomeCompleto,
        departamentoId: input.departamentoId,
        regime: input.regime,
        tipoProfessor: input.tipoProfessor,
        professorId: newProfessor.id,
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
      professorId: newProfessor.id,
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
        departamento: {
          columns: {
            id: true,
            nome: true,
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
      departamentoNome: inv.departamento?.nome ?? null,
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

  // Public endpoints for accepting invitations
  getInvitationByToken: publicProcedure.input(z.object({ token: z.string().min(1) })).query(async ({ input }) => {
    const invitation = await db.query.professorInvitationTable.findFirst({
      where: eq(professorInvitationTable.token, input.token),
      with: {
        departamento: {
          columns: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    })

    if (!invitation) {
      throw new Error('Convite não encontrado')
    }

    if (invitation.status === INVITATION_STATUS_ACCEPTED) {
      throw new Error('Este convite já foi aceito')
    }

    if (invitation.status === INVITATION_STATUS_EXPIRED || invitation.expiresAt < new Date()) {
      throw new Error('Este convite expirou')
    }

    return {
      email: invitation.email,
      nomeCompleto: invitation.nomeCompleto,
      departamento: invitation.departamento,
      regime: invitation.regime,
      tipoProfessor: invitation.tipoProfessor,
      expiresAt: invitation.expiresAt,
    }
  }),

  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
      })
    )
    .mutation(async ({ input }) => {
      const invitation = await db.query.professorInvitationTable.findFirst({
        where: eq(professorInvitationTable.token, input.token),
      })

      if (!invitation) {
        throw new Error('Convite não encontrado')
      }

      if (invitation.status === INVITATION_STATUS_ACCEPTED) {
        throw new Error('Este convite já foi aceito')
      }

      if (invitation.status === INVITATION_STATUS_EXPIRED || invitation.expiresAt < new Date()) {
        throw new Error('Este convite expirou')
      }

      if (!invitation.professorId) {
        throw new Error('Convite inválido - professor não encontrado')
      }

      // Find the user associated with this invitation
      const professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.id, invitation.professorId),
      })

      if (!professor) {
        throw new Error('Professor não encontrado')
      }

      // Hash password and update user
      const passwordHash = await hash(input.password, 10)

      await db
        .update(userTable)
        .set({
          passwordHash,
          emailVerifiedAt: new Date(),
        })
        .where(eq(userTable.id, professor.userId))

      // Activate professor account
      await db
        .update(professorTable)
        .set({
          accountStatus: PROFESSOR_ACCOUNT_ACTIVE,
        })
        .where(eq(professorTable.id, invitation.professorId))

      // Mark invitation as accepted
      await db
        .update(professorInvitationTable)
        .set({
          status: INVITATION_STATUS_ACCEPTED,
          acceptedByUserId: professor.userId,
        })
        .where(eq(professorInvitationTable.id, invitation.id))

      return {
        success: true,
        email: invitation.email,
      }
    }),
})
