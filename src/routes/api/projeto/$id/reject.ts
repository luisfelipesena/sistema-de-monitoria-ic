import { db } from '@/server/database';
import { projetoTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import axios from 'axios';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'ProjetoRejectAPI',
});

const rejectBodySchema = z.object({
  motivo: z.string().min(1, 'Motivo da rejeição é obrigatório'),
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/reject')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const body = await ctx.request.json();
        const { motivo } = rejectBodySchema.parse(body);

        // Buscar o projeto
        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        // Verificar se o projeto está em status SUBMITTED
        if (projeto.status !== 'SUBMITTED') {
          return json(
            { error: 'Apenas projetos submetidos podem ser rejeitados' },
            { status: 400 },
          );
        }

        // Rejeitar o projeto
        const [projetoAtualizado] = await db
          .update(projetoTable)
          .set({
            status: 'REJECTED',
            feedbackAdmin: motivo,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, projetoId))
          .returning();

        log.info({ projetoId }, 'Projeto rejeitado');

        // Enviar notificação por email automaticamente
        try {
          const baseUrl = ctx.request.url.split('/reject')[0];
          const notifyUrl = `${baseUrl}/notify-approval`;

          const notifyResponse = await axios.post(
            notifyUrl,
            {},
            {
              headers: {
                Authorization: ctx.request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
              },
            },
          );

          if (notifyResponse.status === 200) {
            log.info({ projetoId }, 'Notificação de rejeição enviada');
          } else {
            log.warn({ projetoId }, 'Falha ao enviar notificação de rejeição');
          }
        } catch (notifyError) {
          log.error(
            { notifyError, projetoId },
            'Erro ao enviar notificação de rejeição',
          );
        }

        return json(
          {
            success: true,
            message: 'Projeto rejeitado',
            projeto: projetoAtualizado,
          },
          { status: 200 },
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao rejeitar projeto');
        return json({ error: 'Erro ao rejeitar projeto' }, { status: 500 });
      }
    }),
  ),
});
