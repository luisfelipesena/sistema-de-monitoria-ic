import { db } from '@/server/database';
import { editalTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'EditalPublishAPI',
});

const paramsSchema = z.object({
  id: z.string().transform(Number),
});

export const APIRoute = createAPIFileRoute('/api/edital/[id]/publish')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const { id: editalId } = paramsSchema.parse(ctx.params);
        const adminUserId = parseInt(ctx.state.user.userId, 10);

        const edital = await db.query.editalTable.findFirst({
          where: eq(editalTable.id, editalId),
        });

        if (!edital) {
          return json({ error: 'Edital não encontrado' }, { status: 404 });
        }

        if (edital.publicado) {
          return json(
            { error: 'Este edital já foi publicado.', edital },
            { status: 400 },
          );
        }

        const [updatedEdital] = await db
          .update(editalTable)
          .set({
            publicado: true,
            dataPublicacao: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(editalTable.id, editalId))
          .returning();
        
        log.info({ editalId, adminUserId }, 'Edital publicado com sucesso.');
        // Idealmente, aqui também poderia ser disparada uma notificação para professores/alunos sobre o novo edital.

        return json(
          {
            success: true,
            message: 'Edital publicado com sucesso.',
            edital: updatedEdital,
          },
          { status: 200 },
        );

      } catch (error) {
        if (error instanceof z.ZodError && error.message.includes('params')) {
          return json({ error: 'ID do edital inválido' }, { status: 400 });
        }
        log.error(error, 'Erro ao publicar edital');
        return json({ error: 'Erro ao publicar edital' }, { status: 500 });
      }
    }),
  ),
}); 