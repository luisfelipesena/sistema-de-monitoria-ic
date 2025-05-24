import { departamentoInputSchema } from '@/routes/api/departamento/-types';
import { db } from '@/server/database';
import { departamentoTable, disciplinaTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'DepartamentoDetailAPI',
});

export const APIRoute = createAPIFileRoute('/api/departamento/[id]')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const id = parseInt(ctx.params.id);
        if (isNaN(id)) {
          return json({ error: 'ID inválido' }, { status: 400 });
        }

        const departamento = await db.query.departamentoTable.findFirst({
          where: eq(departamentoTable.id, id),
        });

        if (!departamento) {
          return json(
            { error: 'Departamento não encontrado' },
            { status: 404 },
          );
        }

        return json(departamento);
      } catch (error) {
        log.error(error, 'Erro ao buscar departamento');
        return json({ error: 'Erro ao buscar departamento' }, { status: 500 });
      }
    }),
  ),

  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const id = parseInt(ctx.params.id);
        if (isNaN(id)) {
          return json({ error: 'ID inválido' }, { status: 400 });
        }

        const departamento = await db.query.departamentoTable.findFirst({
          where: eq(departamentoTable.id, id),
        });

        if (!departamento) {
          return json(
            { error: 'Departamento não encontrado' },
            { status: 404 },
          );
        }

        const body = await ctx.request.json();
        const validatedData = departamentoInputSchema.parse(body);

        const result = await db
          .update(departamentoTable)
          .set({
            nome: validatedData.nome,
            sigla: validatedData.sigla,
            unidadeUniversitaria: validatedData.unidadeUniversitaria,
            updatedAt: new Date(),
          })
          .where(eq(departamentoTable.id, id))
          .returning();

        return json(result[0]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao atualizar departamento');
        return json(
          { error: 'Erro ao atualizar departamento' },
          { status: 500 },
        );
      }
    }),
  ),

  DELETE: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const id = parseInt(ctx.params.id);
        if (isNaN(id)) {
          return json({ error: 'ID inválido' }, { status: 400 });
        }

        const departamento = await db.query.departamentoTable.findFirst({
          where: eq(departamentoTable.id, id),
        });

        if (!departamento) {
          return json(
            { error: 'Departamento não encontrado' },
            { status: 404 },
          );
        }

        const disciplinasAssociadas = await db.query.disciplinaTable.findFirst({
          where: eq(disciplinaTable.departamentoId, id),
        });

        if (disciplinasAssociadas) {
          return json(
            {
              error:
                'Não é possível excluir o departamento, pois há disciplinas associadas a ele',
            },
            { status: 400 },
          );
        }

        await db.delete(departamentoTable).where(eq(departamentoTable.id, id));

        return json({ success: true });
      } catch (error) {
        log.error(error, 'Erro ao excluir departamento');
        return json({ error: 'Erro ao excluir departamento' }, { status: 500 });
      }
    }),
  ),
});
