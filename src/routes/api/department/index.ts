import {
  departamentoInputSchema,
  departamentoSchema,
} from '@/routes/api/department/-types';
import { db } from '@/server/database';
import { departamentoTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({
  context: 'DepartamentoAPI',
});

export const APIRoute = createAPIFileRoute('/api/department')({
  GET: createAPIHandler(async (ctx) => {
    try {
      const departamentos = await db.query.departamentoTable.findMany({
        orderBy: (departamentos, { asc }) => [asc(departamentos.nome)],
      });

      log.info('Departamentos recuperados com sucesso');
      return json(z.array(departamentoSchema).parse(departamentos), {
        status: 200,
      });
    } catch (error) {
      log.error(error, 'Erro ao recuperar departamentos');
      return json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }),

  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const validatedData = departamentoInputSchema.parse(body);

        const result = await db
          .insert(departamentoTable)
          .values({
            nome: validatedData.nome,
            sigla: validatedData.sigla,
            unidadeUniversitaria: validatedData.unidadeUniversitaria,
          })
          .returning();

        log.info(
          { departamentoId: result[0].id },
          'Departamento criado com sucesso',
        );
        return json(result[0], { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao criar departamento');
        return json({ error: 'Erro ao criar departamento' }, { status: 500 });
      }
    }),
  ),
});
