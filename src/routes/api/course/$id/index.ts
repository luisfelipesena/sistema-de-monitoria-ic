import { cursoInputSchema } from '@/routes/api/course/-types';
import { db } from '@/server/database';
import { cursoTable } from '@/server/database/schema';
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
  context: 'CursoAPI',
});

export const APIRoute = createAPIFileRoute('/api/course/$id')({
  GET: createAPIHandler(async ({ params }) => {
    try {
      const curso = await db.query.cursoTable.findFirst({
        where: eq(cursoTable.id, Number(params.id)),
      });

      if (!curso) {
        return json({ error: 'Curso não encontrado' }, { status: 404 });
      }

      return json(curso);
    } catch (error) {
      log.error({ error }, 'Erro ao buscar curso');
      return json({ error: 'Erro ao buscar curso' }, { status: 500 });
    }
  }),

  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const validatedData = cursoInputSchema.parse(body);

        const result = await db
          .update(cursoTable)
          .set({
            nome: validatedData.nome,
            codigo: validatedData.codigo,
          })
          .where(eq(cursoTable.id, Number(ctx.params.id)))
          .returning();

        if (!result.length) {
          return json({ error: 'Curso não encontrado' }, { status: 404 });
        }

        return json(result[0]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error({ error }, 'Erro ao atualizar curso');
        return json({ error: 'Erro ao atualizar curso' }, { status: 500 });
      }
    }),
  ),

  DELETE: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const result = await db
          .delete(cursoTable)
          .where(eq(cursoTable.id, Number(ctx.params.id)))
          .returning();

        if (!result.length) {
          return json({ error: 'Curso não encontrado' }, { status: 404 });
        }

        return json({ message: 'Curso removido com sucesso' });
      } catch (error) {
        log.error({ error }, 'Erro ao excluir curso');
        return json({ error: 'Erro ao excluir curso' }, { status: 500 });
      }
    }),
  ),
});
