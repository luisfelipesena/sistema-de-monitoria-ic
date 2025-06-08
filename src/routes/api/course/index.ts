import { db } from '@/server/database';
import { cursoTable, insertCursoTableSchema } from '@/server/database/schema';
import { createAPIHandler, withRoleMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({
  context: 'CursosAPI',
});

export const APIRoute = createAPIFileRoute('/api/course')({
  // Listar todos os cursos
  GET: createAPIHandler(async () => {
    try {
      const cursos = await db.query.cursoTable.findMany();
      return json(cursos, { status: 200 });
    } catch (error) {
      log.error(error, 'Erro ao buscar cursos');
      return json({ error: 'Erro ao buscar cursos' }, { status: 500 });
    }
  }),

  // Criar um novo curso
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const parsedData = insertCursoTableSchema.parse(body);

        const [newCurso] = await db
          .insert(cursoTable)
          .values(parsedData)
          .returning();

        log.info({ cursoId: newCurso.id }, 'Curso criado com sucesso');
        return json(newCurso, { status: 201 });
      } catch (error) {
        log.error(error, 'Erro ao criar curso');
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.format() },
            { status: 400 },
          );
        }
        return json({ error: 'Erro ao criar curso' }, { status: 500 });
      }
    }),
  ),
});
