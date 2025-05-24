import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({
  context: 'AvaliacaoAPI',
});

const avaliacaoSchema = z.object({
  inscricaoId: z.number(),
  notaDisciplina: z.number().min(0).max(10),
  notaFinal: z.number().min(0).max(10),
  status: z.enum(['PENDENTE', 'AVALIADO']),
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

        // TODO: Implementar atualização das avaliações na base de dados
        // Quando os campos adequados forem adicionados à tabela inscricaoTable
        // Por enquanto, apenas validamos os dados e retornamos sucesso
        log.info('Avaliações validadas:', avaliacoes);

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
