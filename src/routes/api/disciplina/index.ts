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
import { z } from 'zod';

const log = logger.child({
  context: 'DisciplinasAPI',
});

export const APIRoute = createAPIFileRoute('/api/disciplina')({
  GET: createAPIHandler(async () => {
    try {
      const disciplinas = await db.query.disciplinaTable.findMany({
        with: {
          departamento: true,
        },
      });
      return json(disciplinas, { status: 200 });
    } catch (error) {
      log.error(error, 'Erro ao buscar disciplinas');
      return json({ error: 'Erro ao buscar disciplinas' }, { status: 500 });
    }
  }),
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const parsedData = insertDisciplinaTableSchema.parse(body);

        const [newDisciplina] = await db
          .insert(disciplinaTable)
          .values(parsedData)
          .returning();

        log.info(
          { disciplinaId: newDisciplina.id },
          'Disciplina criada com sucesso',
        );
        return json(newDisciplina, { status: 201 });
      } catch (error) {
        log.error(error, 'Erro ao criar disciplina');
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.format() },
            { status: 400 },
          );
        }
        return json({ error: 'Erro ao criar disciplina' }, { status: 500 });
      }
    }),
  ),
});
