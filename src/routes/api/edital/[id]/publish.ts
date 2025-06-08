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
  context: 'PublishEditalAPI',
});

const publishSchema = z.object({
  publicado: z.boolean(),
});

export const APIRoute = createAPIFileRoute('/api/edital/[id]/publish')({
  PATCH: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const editalId = parseInt(ctx.params.id, 10);
        const body = await ctx.request.json();
        const { publicado } = publishSchema.parse(body);

        const [updatedEdital] = await db
          .update(editalTable)
          .set({ publicado, dataPublicacao: publicado ? new Date() : null })
          .where(eq(editalTable.id, editalId))
          .returning();

        if (!updatedEdital) {
          return json({ error: 'Edital não encontrado' }, { status: 404 });
        }

        log.info(
          { editalId, publicado },
          'Status de publicação do edital atualizado com sucesso',
        );
        return json(updatedEdital, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao atualizar status de publicação do edital');
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.format() },
            { status: 400 },
          );
        }
        return json(
          { error: 'Erro ao atualizar status de publicação' },
          { status: 500 },
        );
      }
    }),
  ),
}); 