import { db } from '@/server/database';
import { disciplinaTable } from '@/server/database/schema';
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
  context: 'DisciplinaDetailAPI',
});

const disciplinaInputSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  departamentoId: z.number().min(1, 'Departamento é obrigatório'),
});

export const APIRoute = createAPIFileRoute('/api/disciplina/$id')({
  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const id = parseInt(ctx.params.id);
        if (isNaN(id)) {
          return json({ error: 'ID inválido' }, { status: 400 });
        }

        const disciplina = await db.query.disciplinaTable.findFirst({
          where: eq(disciplinaTable.id, id),
        });

        if (!disciplina) {
          return json({ error: 'Disciplina não encontrada' }, { status: 404 });
        }

        const body = await ctx.request.json();
        const validatedData = disciplinaInputSchema.parse(body);

        const result = await db
          .update(disciplinaTable)
          .set({
            nome: validatedData.nome,
            codigo: validatedData.codigo,
            departamentoId: validatedData.departamentoId,
            updatedAt: new Date(),
          })
          .where(eq(disciplinaTable.id, id))
          .returning();

        return json(result[0]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao atualizar disciplina');
        return json({ error: 'Erro ao atualizar disciplina' }, { status: 500 });
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

        const disciplina = await db.query.disciplinaTable.findFirst({
          where: eq(disciplinaTable.id, id),
        });

        if (!disciplina) {
          return json({ error: 'Disciplina não encontrada' }, { status: 404 });
        }

        await db.delete(disciplinaTable).where(eq(disciplinaTable.id, id));

        return json({ success: true });
      } catch (error) {
        log.error(error, 'Erro ao excluir disciplina');
        return json({ error: 'Erro ao excluir disciplina' }, { status: 500 });
      }
    }),
  ),
});
