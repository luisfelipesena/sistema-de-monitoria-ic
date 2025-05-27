import { db } from '@/server/database';
import { inscricaoTable } from '@/server/database/schema';
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
  context: 'AvaliacaoAPI',
});

const avaliacaoSchema = z.object({
  inscricaoId: z.number(),
  notaDisciplina: z.number().min(0).max(10),
  notaFinal: z.number().min(0).max(10),
  status: z.enum(['PENDENTE', 'SELECIONADO', 'REJEITADO']),
});

const avaliacoesArraySchema = z.array(avaliacaoSchema);

export const APIRoute = createAPIFileRoute('/api/projeto/[id]/avaliacoes')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin', 'professor'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const body = await ctx.request.json();

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const avaliacoes = avaliacoesArraySchema.parse(body);

        // Implementar atualização das avaliações na base de dados
        // Salvando como JSON no campo feedbackProfessor por enquanto
        for (const avaliacao of avaliacoes) {
          const feedbackData = {
            notaDisciplina: avaliacao.notaDisciplina,
            notaFinal: avaliacao.notaFinal,
            status: avaliacao.status,
            dataAvaliacao: new Date().toISOString(),
          };

          await db
            .update(inscricaoTable)
            .set({
              feedbackProfessor: JSON.stringify(feedbackData),
              status:
                avaliacao.status === 'SELECIONADO'
                  ? 'SELECTED_BOLSISTA'
                  : avaliacao.status === 'REJEITADO'
                    ? 'REJECTED_BY_PROFESSOR'
                    : 'SUBMITTED',
              updatedAt: new Date(),
            })
            .where(eq(inscricaoTable.id, avaliacao.inscricaoId));
        }

        log.info(
          { projetoId, avaliacoesCount: avaliacoes.length },
          'Avaliações salvas com sucesso',
        );

        return json({
          success: true,
          message: 'Avaliações salvas com sucesso',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados de avaliação inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao salvar avaliações');
        return json({ error: 'Erro ao salvar avaliações' }, { status: 500 });
      }
    }),
  ),
});
