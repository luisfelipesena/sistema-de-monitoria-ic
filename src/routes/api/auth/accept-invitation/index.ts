import { db } from '@/server/database';
import { professorInvitationTable, userTable } from '@/server/database/schema';
import { 
  createAPIHandler, 
  withAuthMiddleware 
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'AcceptInvitationAPI',
});

const inputSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

export const responseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  needsOnboarding: z.boolean().optional(),
});

export type AcceptInvitationResponse = z.infer<typeof responseSchema>;

export const APIRoute = createAPIFileRoute('/api/auth/accept-invitation')({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const body = await ctx.request.json();
        const input = inputSchema.parse(body);
        const userId = parseInt(ctx.state.user.userId);

        const user = await db.query.userTable.findFirst({
          where: eq(userTable.id, userId),
        });

        if (!user) {
          return json({
            success: false,
            message: 'Usuário não encontrado',
          }, { status: 404 });
        }

        const invitation = await db.query.professorInvitationTable.findFirst({
          where: eq(professorInvitationTable.token, input.token),
        });

        if (!invitation) {
          log.warn({ token: input.token }, 'Token de convite não encontrado');
          return json({
            success: false,
            message: 'Token de convite inválido',
          }, { status: 404 });
        }

        if (invitation.status !== 'PENDING') {
          log.warn({ token: input.token, status: invitation.status }, 'Token já processado');
          return json({
            success: false,
            message: 'Este convite já foi processado',
          }, { status: 400 });
        }

        const now = new Date();
        if (invitation.expiresAt < now) {
          log.warn({ token: input.token }, 'Token expirado');
          return json({
            success: false,
            message: 'Este convite expirou',
          }, { status: 400 });
        }

        if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
          log.warn({ 
            invitationEmail: invitation.email, 
            userEmail: user.email 
          }, 'Email não confere com o convite');
          return json({
            success: false,
            message: 'Este convite não foi enviado para seu email',
          }, { status: 403 });
        }

        await db.transaction(async (tx) => {
          await tx
            .update(professorInvitationTable)
            .set({
              status: 'ACCEPTED',
              acceptedByUserId: userId,
              updatedAt: now,
            })
            .where(eq(professorInvitationTable.id, invitation.id));

          await tx
            .update(userTable)
            .set({
              role: 'professor',
            })
            .where(eq(userTable.id, userId));
        });

        log.info({ 
          email: user.email, 
          userId,
          invitationId: invitation.id 
        }, 'Convite aceito com sucesso');

        return json({
          success: true,
          message: 'Convite aceito! Agora você é um professor.',
          needsOnboarding: true,
        }, { status: 200 });

      } catch (error) {
        log.error(error, 'Erro ao processar convite');
        return json({
          success: false,
          message: 'Erro interno do servidor',
        }, { status: 500 });
      }
    })
  ),
}); 