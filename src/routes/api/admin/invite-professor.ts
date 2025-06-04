import { db } from '@/server/database';
import {
  professorInvitationTable,
  userTable,
  professorInvitationStatusEnum
} from '@/server/database/schema';
import { emailService } from '@/server/lib/emailService';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq, gte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const log = logger.child({
  context: 'AdminInviteProfessorAPI',
});

const inviteProfessorInputSchema = z.object({
  email: z.string().email('Formato de email inválido.'),
});

export type InviteProfessorInput = z.infer<typeof inviteProfessorInputSchema>;

// Response type for this endpoint
const inviteProfessorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  invitationId: z.number().optional(),
});

export type InviteProfessorResponse = z.infer<
  typeof inviteProfessorResponseSchema
>;

export const APIRoute = createAPIFileRoute('/api/admin/invite-professor')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const adminUserId = parseInt(ctx.state.user.userId, 10);
        const adminUser = await db.query.userTable.findFirst({
          where: eq(userTable.id, adminUserId),
        });

        const body = await ctx.request.json();
        const { email } = inviteProfessorInputSchema.parse(body);

        // Check if user already exists with this email
        const existingUser = await db.query.userTable.findFirst({
          where: eq(userTable.email, email),
        });

        if (existingUser && existingUser.role === 'professor') {
          return json<InviteProfessorResponse>(
            {
              success: false,
              message:
                'Um usuário com este email já existe e já é um professor.',
            },
            { status: 409 }, // Conflict
          );
        }

        // Check for existing active (PENDING) invitation for this email
        const existingInvitation = await db.query.professorInvitationTable.findFirst({
          where: and(
            eq(professorInvitationTable.email, email),
            eq(professorInvitationTable.status, professorInvitationStatusEnum.enumValues[0] /* PENDING */),
            gte(professorInvitationTable.expiresAt, new Date()),
          ),
        });

        if (existingInvitation) {
          return json<InviteProfessorResponse>(
            {
              success: false,
              message:
                'Já existe um convite pendente e válido para este email.',
            },
            { status: 409 },
          );
        }

        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Invitation valid for 7 days

        const [newInvitation] = await db
          .insert(professorInvitationTable)
          .values({
            email,
            token,
            status: professorInvitationStatusEnum.enumValues[0], // PENDING
            expiresAt,
            invitedByUserId: adminUserId,
          })
          .returning();

        if (!newInvitation) {
          throw new Error('Falha ao criar registro de convite.');
        }

        const invitationLink = `${env.CLIENT_URL}/auth/accept-invitation?token=${token}`;

        await emailService.sendProfessorInvitationEmail({
          professorEmail: email,
          invitationLink,
          adminName: adminUser?.username || 'Administração do Sistema',
          remetenteUserId: adminUserId,
        });

        log.info(
          { email, adminUserId, invitationId: newInvitation.id },
          'Convite para professor enviado com sucesso.',
        );

        return json<InviteProfessorResponse>(
          {
            success: true,
            message: 'Convite para professor enviado com sucesso.',
            invitationId: newInvitation.id,
          },
          { status: 201 },
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json<InviteProfessorResponse>(
            {
              success: false,
              message: 'Dados de entrada inválidos.',
            },
            { status: 400 },
          );
        }
        log.error(error, 'Erro ao processar convite para professor.');
        // Check if it's an error from the transaction that has a status
        if ((error as any).status) {
          return json({ error: (error as any).message }, { status: (error as any).status });
        }
        return json<InviteProfessorResponse>(
          { success: false, message: 'Erro interno ao processar convite.' },
          { status: 500 },
        );
      }
    }),
  ),
}); 