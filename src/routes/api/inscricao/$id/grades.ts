import { db } from '@/server/database';
import { inscricaoTable, projetoTable, professorTable } from '@/server/database/schema';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'ApplicationGradingAPI',
});

const gradesSchema = z.object({
  notaDisciplina: z.number().min(0).max(10),
  notaSelecao: z.number().min(0).max(10),
  coeficienteRendimento: z.number().min(0).max(10),
});

export const APIRoute = createAPIFileRoute('/api/inscricao/$id/grades')({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const inscricaoId = parseInt(ctx.params.id, 10);
        if (isNaN(inscricaoId)) {
          return json({ error: 'ID da inscrição inválido' }, { status: 400 });
        }

        const userNumericId = parseInt(ctx.state.user.userId, 10);
        
        const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, userNumericId),
        });

        if (ctx.state.user.role !== 'professor' || !professor) {
            return json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const inscricao = await db.query.inscricaoTable.findFirst({
            where: eq(inscricaoTable.id, inscricaoId),
            with: { projeto: true }
        });

        if (!inscricao) {
            return json({ error: 'Inscrição não encontrada' }, { status: 404 });
        }

        if (inscricao.projeto.professorResponsavelId !== professor.id) {
            return json({ error: 'Você não tem permissão para avaliar esta inscrição' }, { status: 403 });
        }

        const body = await ctx.request.json();
        const { notaDisciplina, notaSelecao, coeficienteRendimento } = gradesSchema.parse(body);

        const notaFinal = (notaDisciplina * 5 + notaSelecao * 3 + coeficienteRendimento * 2) / 10;
        
        const [updatedInscricao] = await db
          .update(inscricaoTable)
          .set({
            notaDisciplina: String(notaDisciplina),
            notaSelecao: String(notaSelecao),
            coeficienteRendimento: String(coeficienteRendimento),
            notaFinal: String(notaFinal.toFixed(2)),
          })
          .where(eq(inscricaoTable.id, inscricaoId))
          .returning();

        log.info({ inscricaoId }, 'Notas da inscrição atualizadas com sucesso.');
        return json(updatedInscricao);
      } catch (error) {
        log.error(error, 'Erro ao salvar notas da inscrição');
        if (error instanceof z.ZodError) {
          return json({ error: 'Dados inválidos', details: error.format() }, { status: 400 });
        }
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
}); 