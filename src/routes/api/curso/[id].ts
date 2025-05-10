import { cursoInputSchema } from '@/routes/api/curso/-types';
import { db } from '@/server/database';
import { alunoTable, cursoTable } from '@/server/database/schema';
import { createAPIHandler, withAuthMiddleware, withRoleMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';


const log = logger.child({
  context: 'CursoDetailAPI',
});

export const APIRoute = createAPIFileRoute('/api/curso/[id]')({
  // Obter um curso pelo ID
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const id = parseInt(ctx.params.id);
        if (isNaN(id)) {
          return json({ error: 'ID inválido' }, { status: 400 });
        }

        const curso = await db.query.cursoTable.findFirst({
          where: eq(cursoTable.id, id),
        });

        if (!curso) {
          return json({ error: 'Curso não encontrado' }, { status: 404 });
        }

        return json(curso);
      } catch (error) {
        log.error({ error }, 'Erro ao buscar curso');
        return json(
          { error: 'Erro ao buscar curso' },
          { status: 500 }
        );
      }
    })
  ),

  // Atualizar um curso
  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const id = parseInt(ctx.params.id);
        if (isNaN(id)) {
          return json({ error: 'ID inválido' }, { status: 400 });
        }

        // Verificar se o curso existe
        const curso = await db.query.cursoTable.findFirst({
          where: eq(cursoTable.id, id),
        });

        if (!curso) {
          return json({ error: 'Curso não encontrado' }, { status: 404 });
        }

        const body = await ctx.request.json();
        const validatedData = cursoInputSchema.parse(body);

        const result = await db.update(cursoTable)
          .set({
            nome: validatedData.nome,
            codigo: validatedData.codigo,
            updatedAt: new Date(),
          })
          .where(eq(cursoTable.id, id))
          .returning();

        return json(result[0]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 }
          );
        }

        log.error({ error }, 'Erro ao atualizar curso');
        return json(
          { error: 'Erro ao atualizar curso' },
          { status: 500 }
        );
      }
    })
  ),

  // Excluir um curso
  DELETE: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      // Verificar se o usuário é admin
      if (ctx.state.user.role !== 'admin') {
        return json(
          { error: 'Acesso não autorizado' },
          { status: 403 }
        );
      }

      try {
        const id = parseInt(ctx.params.id);
        if (isNaN(id)) {
          return json({ error: 'ID inválido' }, { status: 400 });
        }

        // Verificar se o curso existe
        const curso = await db.query.cursoTable.findFirst({
          where: eq(cursoTable.id, id),
        });

        if (!curso) {
          return json({ error: 'Curso não encontrado' }, { status: 404 });
        }

        // Verificar se há alunos associados a este curso
        const alunosComCurso = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.cursoId, id),
        });

        if (alunosComCurso) {
          return json(
            { error: 'Não é possível excluir o curso, pois há alunos associados a ele' },
            { status: 400 }
          );
        }

        await db.delete(cursoTable).where(eq(cursoTable.id, id));

        return json({ success: true });
      } catch (error) {
        log.error({ error }, 'Erro ao excluir curso');
        return json(
          { error: 'Erro ao excluir curso' },
          { status: 500 }
        );
      }
    })
  ),
}); 