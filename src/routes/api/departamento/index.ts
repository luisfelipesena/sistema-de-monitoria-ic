import { departamentoSchema } from '@/routes/api/departamento/-types';
import { db } from '@/server/database';
import { createAPIHandler } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({
  context: 'DepartamentoAPI',
});

export const APIRoute = createAPIFileRoute('/api/departamento')({
  GET: createAPIHandler(async (ctx) => {
    try {
      const departamentos = await db.query.departamentoTable.findMany();

      log.info('Departamentos recuperados com sucesso');
      return json(z.array(departamentoSchema).parse(departamentos), { status: 200 });
    } catch (error) {
      log.error(error, 'Erro ao recuperar departamentos');
      return json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }),
}); 