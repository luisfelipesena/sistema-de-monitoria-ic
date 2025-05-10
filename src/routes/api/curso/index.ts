import { db } from '@/server/database';
import { cursoTable } from '@/server/database/schema';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({
  context: 'CursoAPI',
});

// Schema for validating curso data
export const cursoSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

// Schema para validação de entrada
export const cursoInputSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo: z.coerce.number().nullable(),
});

export type CursoResponse = z.infer<typeof cursoSchema>[];

export const APIRoute = createAPIFileRoute('/api/curso')({
  // Listar todos os cursos
  GET: createAPIHandler(async () => {
    try {
      const cursos = await db.query.cursoTable.findMany({
        orderBy: (cursos, { asc }) => [asc(cursos.nome)],
      });

      return json(cursos);
    } catch (error) {
      log.error({ error }, 'Erro ao buscar cursos');
      return json(
        { error: 'Erro ao buscar cursos' },
        { status: 500 }
      );
    }
  }),

  // Criar um novo curso
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      // Verificar se o usuário é admin
      if (ctx.state.user.role !== 'admin') {
        return json(
          { error: 'Acesso não autorizado' },
          { status: 403 }
        );
      }

      try {
        const body = await ctx.request.json();
        const validatedData = cursoInputSchema.parse(body);

        const result = await db.insert(cursoTable).values({
          nome: validatedData.nome,
          codigo: validatedData.codigo,
        }).returning();

        return json(result[0], { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 }
          );
        }

        log.error({ error }, 'Erro ao criar curso');
        return json(
          { error: 'Erro ao criar curso' },
          { status: 500 }
        );
      }
    })
  ),
});