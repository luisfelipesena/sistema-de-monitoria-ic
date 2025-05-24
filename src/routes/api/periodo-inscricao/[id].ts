import {
  periodoInscricaoInputSchema,
  periodoInscricaoResponseSchema,
} from '@/routes/api/periodo-inscricao/-types';
import { db } from '@/server/database';
import {
  inscricaoTable,
  periodoInscricaoTable,
} from '@/server/database/schema';
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
  context: 'PeriodoInscricaoDetailAPI',
});

export const APIRoute = createAPIFileRoute('/api/periodo-inscricao/[id]')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const id = parseInt(ctx.params.id);
        if (isNaN(id)) {
          return json({ error: 'ID inválido' }, { status: 400 });
        }

        const periodo = await db.query.periodoInscricaoTable.findFirst({
          where: eq(periodoInscricaoTable.id, id),
        });

        if (!periodo) {
          return json(
            { error: 'Período de inscrição não encontrado' },
            { status: 404 },
          );
        }

        const validatedPeriodo = periodoInscricaoResponseSchema.parse(periodo);
        return json(validatedPeriodo);
      } catch (error) {
        log.error(error, 'Erro ao buscar período de inscrição');
        return json(
          { error: 'Erro ao buscar período de inscrição' },
          { status: 500 },
        );
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

        const periodo = await db.query.periodoInscricaoTable.findFirst({
          where: eq(periodoInscricaoTable.id, id),
        });

        if (!periodo) {
          return json(
            { error: 'Período de inscrição não encontrado' },
            { status: 404 },
          );
        }

        const body = await ctx.request.json();
        const validatedData = periodoInscricaoInputSchema.parse(body);

        // Validar datas
        if (validatedData.dataFim <= validatedData.dataInicio) {
          return json(
            { error: 'Data de fim deve ser posterior à data de início' },
            { status: 400 },
          );
        }

        // Verificar se já existem inscrições para este período
        const now = new Date();
        if (
          now >= periodo.dataInicio &&
          periodo.dataInicio !== validatedData.dataInicio
        ) {
          const inscricoesExistentes = await db.query.inscricaoTable.findFirst({
            where: eq(inscricaoTable.periodoInscricaoId, id),
          });

          if (inscricoesExistentes) {
            return json(
              {
                error:
                  'Não é possível alterar datas de um período que já possui inscrições',
              },
              { status: 400 },
            );
          }
        }

        const [periodoAtualizado] = await db
          .update(periodoInscricaoTable)
          .set({
            ...validatedData,
            updatedAt: new Date(),
          })
          .where(eq(periodoInscricaoTable.id, id))
          .returning();

        const validatedPeriodo =
          periodoInscricaoResponseSchema.parse(periodoAtualizado);

        log.info({ periodoId: id }, 'Período de inscrição atualizado');
        return json(validatedPeriodo);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao atualizar período de inscrição');
        return json(
          { error: 'Erro ao atualizar período de inscrição' },
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

        const periodo = await db.query.periodoInscricaoTable.findFirst({
          where: eq(periodoInscricaoTable.id, id),
        });

        if (!periodo) {
          return json(
            { error: 'Período de inscrição não encontrado' },
            { status: 404 },
          );
        }

        // Verificar se existem inscrições associadas
        const inscricoesAssociadas = await db.query.inscricaoTable.findFirst({
          where: eq(inscricaoTable.periodoInscricaoId, id),
        });

        if (inscricoesAssociadas) {
          return json(
            {
              error: 'Não é possível excluir um período que possui inscrições',
            },
            { status: 400 },
          );
        }

        await db
          .delete(periodoInscricaoTable)
          .where(eq(periodoInscricaoTable.id, id));

        log.info({ periodoId: id }, 'Período de inscrição excluído');
        return json({ success: true });
      } catch (error) {
        log.error(error, 'Erro ao excluir período de inscrição');
        return json(
          { error: 'Erro ao excluir período de inscrição' },
          { status: 500 },
        );
      }
    }),
  ),
});
