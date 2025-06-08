import { db } from '@/server/database';
import {
  cursoTable,
  insertCursoTableSchema,
} from '@/server/database/schema';
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
  context: 'CursoByIdAPI',
});

const updateCursoSchema = insertCursoTableSchema.partial();

export const APIRoute = createAPIFileRoute('/api/course/$id')({
  GET: createAPIHandler(async ({ params }) => {
    try {
      const cursoId = parseInt(params.id, 10);
      const curso = await db.query.cursoTable.findFirst({
        where: eq(cursoTable.id, cursoId),
      });

      if (!curso) {
        return json({ error: 'Curso não encontrado' }, { status: 404 });
      }

      return json(curso, { status: 200 });
    } catch (error) {
      log.error(error, 'Erro ao buscar curso');
      return json({ error: 'Erro ao buscar curso' }, { status: 500 });
    }
  }),
  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const cursoId = parseInt(ctx.params.id, 10);
        const body = await ctx.request.json();
        const parsedData = updateCursoSchema.parse(body);

        const [updatedCurso] = await db
          .update(cursoTable)
          .set(parsedData)
          .where(eq(cursoTable.id, cursoId))
          .returning();

        if (!updatedCurso) {
          return json({ error: 'Curso não encontrado' }, { status: 404 });
        }

        log.info({ cursoId }, 'Curso atualizado com sucesso');
        return json(updatedCurso, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao atualizar curso');
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.format() },
            { status: 400 },
          );
        }
        return json({ error: 'Erro ao atualizar curso' }, { status: 500 });
      }
    }),
  ),
  DELETE: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const cursoId = parseInt(ctx.params.id, 10);

        const [deletedCurso] = await db
          .delete(cursoTable)
          .where(eq(cursoTable.id, cursoId))
          .returning();

        if (!deletedCurso) {
          return json({ error: 'Curso não encontrado' }, { status: 404 });
        }

        log.info({ cursoId }, 'Curso excluído com sucesso');
        return json({ success: true }, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao excluir curso');
        return json({ error: 'Erro ao excluir curso' }, { status: 500 });
      }
    }),
  ),
});
