import { disciplinaSchema } from '@/routes/api/disciplina/-types';
import { db } from '@/server/database';
import { disciplinaTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'DisciplinaAPI',
});

export const APIRoute = createAPIFileRoute('/api/disciplina')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const url = new URL(ctx.request.url);
        const departamentoId = url.searchParams.get('departamentoId');

        let whereCondition;
        if (departamentoId) {
          whereCondition = eq(
            disciplinaTable.departamentoId,
            parseInt(departamentoId),
          );
        } else {
          // Se não especificar departamento, buscar apenas disciplinas não deletadas
          whereCondition = isNull(disciplinaTable.deletedAt);
        }

        const disciplinas = await db
          .select()
          .from(disciplinaTable)
          .where(whereCondition)
          .orderBy(disciplinaTable.nome);

        log.info(
          { count: disciplinas.length },
          'Disciplinas recuperadas com sucesso',
        );
        return json(z.array(disciplinaSchema).parse(disciplinas), {
          status: 200,
        });
      } catch (error) {
        log.error(error, 'Erro ao recuperar disciplinas');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
});
