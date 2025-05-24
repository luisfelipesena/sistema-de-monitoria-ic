import { disciplinaSchema } from '@/routes/api/disciplina/-types';
import { db } from '@/server/database';
import { disciplinaTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'DisciplinaAPI',
});

const disciplinaInputSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  departamentoId: z.number().min(1, 'Departamento é obrigatório'),
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

  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
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
