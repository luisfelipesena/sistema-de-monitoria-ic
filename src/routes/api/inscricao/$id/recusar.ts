import { db } from '@/server/database';
import { alunoTable, inscricaoTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'InscricaoRecusarAPI',
});

const recusarBodySchema = z.object({
  motivo: z.string().optional(),
});

export const APIRoute = createAPIFileRoute('/api/inscricao/$id/recusar')({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const inscricaoId = parseInt(ctx.params.id, 10);
        const userId = parseInt(ctx.state.user.userId, 10);

        if (isNaN(inscricaoId)) {
          return json({ error: 'ID da inscrição inválido' }, { status: 400 });
        }

        const body = await ctx.request.json();
        const { motivo } = recusarBodySchema.parse(body);

        // Buscar o aluno
        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, userId),
        });

        if (!aluno) {
          return json(
            { error: 'Perfil de aluno não encontrado' },
            { status: 404 },
          );
        }

        // Buscar a inscrição
        const inscricao = await db.query.inscricaoTable.findFirst({
          where: and(
            eq(inscricaoTable.id, inscricaoId),
            eq(inscricaoTable.alunoId, aluno.id),
          ),
        });

        if (!inscricao) {
          return json({ error: 'Inscrição não encontrada' }, { status: 404 });
        }

        // Verificar se a inscrição está no status correto para recusar
        if (
          inscricao.status !== 'SELECTED_BOLSISTA' &&
          inscricao.status !== 'SELECTED_VOLUNTARIO'
        ) {
          return json(
            { error: 'Esta inscrição não pode ser recusada no momento' },
            { status: 400 },
          );
        }

        // Atualizar status da inscrição
        const [inscricaoAtualizada] = await db
          .update(inscricaoTable)
          .set({
            status: 'REJECTED_BY_STUDENT',
            feedbackProfessor: motivo || 'Recusado pelo estudante',
            updatedAt: new Date(),
          })
          .where(eq(inscricaoTable.id, inscricaoId))
          .returning();

        log.info({ inscricaoId }, 'Inscrição recusada pelo estudante');

        return json(
          {
            success: true,
            message: 'Monitoria recusada',
            inscricao: inscricaoAtualizada,
          },
          { status: 200 },
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao recusar inscrição');
        return json({ error: 'Erro ao recusar inscrição' }, { status: 500 });
      }
    }),
  ),
});
