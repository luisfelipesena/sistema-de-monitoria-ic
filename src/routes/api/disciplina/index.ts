import { db } from '@/server/database';
import {
  disciplinaTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({
  context: 'DisciplinaAPI',
});

const disciplinaInputSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  departamentoId: z.number().min(1, 'Departamento é obrigatório'),
});

const searchSchema = z.object({
  departamentoId: z.coerce.number().optional(),
});

export const APIRoute = createAPIFileRoute('/api/disciplina')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      const url = new URL(ctx.request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const { departamentoId } = searchSchema.parse(queryParams);

      const disciplinas = await db.query.disciplinaTable.findMany({
        where: departamentoId
          ? (table, { eq }) => eq(table.departamentoId, departamentoId)
          : undefined,
        with: {
          departamento: true,
        },
      });

      return json(disciplinas);
    }),
  ),

  POST: createAPIHandler(
    withRoleMiddleware(['admin', 'professor'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const validatedData = disciplinaInputSchema.parse(body);

        const result = await db
          .insert(disciplinaTable)
          .values({
            nome: validatedData.nome,
            codigo: validatedData.codigo,
            departamentoId: validatedData.departamentoId,
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

        log.error(error, 'Erro ao criar disciplina');
        return json({ error: 'Erro ao criar disciplina' }, { status: 500 });
      }
    }),
  ),
});
