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
import { z } from 'zod';

const log = logger.child({
  context: 'CursoAPI',
});

export const APIRoute = createAPIFileRoute('/api/course')({
  // Listar todos os cursos
  GET: createAPIHandler(async () => {
    try {
      const cursos = await db.query.cursoTable.findMany({
        orderBy: (cursos, { asc }) => [asc(cursos.nome)],
      });

      return json(cursos);
    } catch (error) {
      log.error({ error }, 'Erro ao buscar cursos');
      return json({ error: 'Erro ao buscar cursos' }, { status: 500 });
    }
  }),

  // Criar um novo curso
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const validatedData = cursoInputSchema.parse(body);

        const result = await db
          .insert(cursoTable)
          .values({
            nome: validatedData.nome,
            codigo: validatedData.codigo,
          })
          .returning();

        return json(result[0], { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(
          {
            message: error instanceof Error ? error.message : 'Unknown error',
            errorObject: error,
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Erro ao criar curso',
        );
        return json(
          {
            error: 'Erro ao criar curso',
            details:
              error instanceof Error ? error.message : 'Unknown error details',
          },
          { status: 500 },
        );
      }
    }),
  ),
});
