import { db } from '@/server/database';
import { professorInvitationTable } from '@/server/database/schema';
import { createAPIHandler } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'ValidateInvitationAPI',
});

const querySchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

export const responseSchema = z.object({
  valid: z.boolean(),
  email: z.string().optional(),
  expired: z.boolean().optional(),
  message: z.string(),
});

export type ValidateInvitationResponse = z.infer<typeof responseSchema>;

export const APIRoute = createAPIFileRoute('/api/auth/validate-invitation')({
  GET: createAPIHandler(async (ctx) => {
    try {
      const url = new URL(ctx.request.url);
      const token = url.searchParams.get('token');
      const query = querySchema.parse({ token });
      
      const invitation = await db.query.professorInvitationTable.findFirst({
        where: eq(professorInvitationTable.token, query.token),
      });

      if (!invitation) {
        log.warn({ token: query.token }, 'Token de convite não encontrado');
        return json({
          valid: false,
          message: 'Token de convite inválido ou não encontrado',
        }, { status: 404 });
      }

      if (invitation.status !== 'PENDING') {
        log.warn({ token: query.token, status: invitation.status }, 'Token já foi processado');
        return json({
          valid: false,
          message: 'Este convite já foi aceito ou expirou',
        }, { status: 400 });
      }

      const now = new Date();
      if (invitation.expiresAt < now) {
        log.warn({ token: query.token, expiresAt: invitation.expiresAt }, 'Token expirado');
        
        await db
          .update(professorInvitationTable)
          .set({ 
            status: 'EXPIRED',
            updatedAt: now 
          })
          .where(eq(professorInvitationTable.id, invitation.id));

        return json({
          valid: false,
          expired: true,
          message: 'Este convite expirou',
        }, { status: 400 });
      }

      log.info({ email: invitation.email }, 'Token válido');
      return json({
        valid: true,
        email: invitation.email,
        message: 'Token válido',
      }, { status: 200 });

    } catch (error) {
      log.error(error, 'Erro ao validar token de convite');
      return json({ 
        valid: false,
        message: 'Erro interno do servidor' 
      }, { status: 500 });
    }
  }),
}); 