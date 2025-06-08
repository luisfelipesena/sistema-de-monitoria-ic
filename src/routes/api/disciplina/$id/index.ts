import { db } from '@/server/database';
import {
  disciplinaTable,
  insertDisciplinaTableSchema,
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
  context: 'DisciplinaByIdAPI',
});

const updateDisciplinaSchema = insertDisciplinaTableSchema.partial();

export const APIRoute = createAPIFileRoute('/api/disciplina/$id')({
  GET: createAPIHandler(async ({ params }) => {
    try {
      const disciplinaId = parseInt(params.id, 10);
      const disciplina = await db.query.disciplinaTable.findFirst({
        where: eq(disciplinaTable.id, disciplinaId),
        with: {
          departamento: true,
        },
      });

      if (!disciplina) {
        return json({ error: 'Disciplina não encontrada' }, { status: 404 });
      }

      return json(disciplina, { status: 200 });
    } catch (error) {
      log.error(error, 'Erro ao buscar disciplina');
      return json({ error: 'Erro ao buscar disciplina' }, { status: 500 });
    }
  }),
  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const disciplinaId = parseInt(ctx.params.id, 10);
        const body = await ctx.request.json();
        const parsedData = updateDisciplinaSchema.parse(body);

        const [updatedDisciplina] = await db
          .update(disciplinaTable)
          .set(parsedData)
          .where(eq(disciplinaTable.id, disciplinaId))
          .returning();

        if (!updatedDisciplina) {
          return json({ error: 'Disciplina não encontrada' }, { status: 404 });
        }

        log.info({ disciplinaId }, 'Disciplina atualizada com sucesso');
        return json(updatedDisciplina, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao atualizar disciplina');
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.format() },
            { status: 400 },
          );
        }
        return json(
          { error: 'Erro ao atualizar disciplina' },
          { status: 500 },
        );
      }
    }),
  ),
  DELETE: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const disciplinaId = parseInt(ctx.params.id, 10);

        const [deletedDisciplina] = await db
          .delete(disciplinaTable)
          .where(eq(disciplinaTable.id, disciplinaId))
          .returning();

        if (!deletedDisciplina) {
          return json({ error: 'Disciplina não encontrada' }, { status: 404 });
        }

        log.info({ disciplinaId }, 'Disciplina excluída com sucesso');
        return json({ success: true }, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao excluir disciplina');
        return json({ error: 'Erro ao excluir disciplina' }, { status: 500 });
      }
    }),
  ),
});
