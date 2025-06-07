import { db } from '@/server/database';
import { projetoTable } from '@/server/database/schema';
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
  context: 'AllocateScholarshipsAPI',
});

const allocationSchema = z.object({
  bolsasDisponibilizadas: z.number().int().min(0),
});

export const APIRoute = createAPIFileRoute(
  '/api/projeto/$id/allocate-scholarships',
)({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const body = await ctx.request.json();
        const { bolsasDisponibilizadas } = allocationSchema.parse(body);

        const [updatedProjeto] = await db
          .update(projetoTable)
          .set({ bolsasDisponibilizadas })
          .where(eq(projetoTable.id, projetoId))
          .returning();

        if (!updatedProjeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }
        
        log.info({ projetoId, bolsasDisponibilizadas }, 'Bolsas alocadas com sucesso.');

        return json(updatedProjeto, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao alocar bolsas');
        if (error instanceof z.ZodError) {
          return json({ error: 'Dados inválidos', details: error.format() }, { status: 400 });
        }
        return json({ error: 'Erro interno ao alocar bolsas' }, { status: 500 });
      }
    }),
  ),
}); 