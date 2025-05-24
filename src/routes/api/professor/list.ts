import { db } from '@/server/database';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';

const log = logger.child({
  context: 'ProfessorListAPI',
});

export const APIRoute = createAPIFileRoute('/api/professor/list')({
  GET: createAPIHandler(
    withAuthMiddleware(
      withRoleMiddleware(['admin'], async (ctx) => {
        try {
          const professores = await db.query.professorTable.findMany({
            columns: {
              id: true,
              nomeCompleto: true,
              emailInstitucional: true,
              departamentoId: true,
            },
            orderBy: (professores, { asc }) => [asc(professores.nomeCompleto)],
          });

          log.info({ count: professores.length }, 'Professores listados');

          return json(professores, { status: 200 });
        } catch (error) {
          log.error(error, 'Erro ao listar professores');
          return json({ error: 'Erro ao listar professores' }, { status: 500 });
        }
      }),
    ),
  ),
});
