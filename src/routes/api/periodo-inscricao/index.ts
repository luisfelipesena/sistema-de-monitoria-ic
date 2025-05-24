import {
  periodoInscricaoComStatusSchema,
  periodoInscricaoInputSchema,
  periodoInscricaoResponseSchema,
} from '@/routes/api/periodo-inscricao/-types';
import { db } from '@/server/database';
import {
  inscricaoTable,
  periodoInscricaoTable,
  projetoTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'PeriodoInscricaoAPI',
});

export const APIRoute = createAPIFileRoute('/api/periodo-inscricao')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const periodos = await db.query.periodoInscricaoTable.findMany({
          orderBy: (periodos, { desc }) => [
            desc(periodos.ano),
            desc(periodos.semestre),
          ],
        });

        const now = new Date();

        const periodosComStatus = await Promise.all(
          periodos.map(async (periodo) => {
            // Determinar status do período
            let status: 'ATIVO' | 'FUTURO' | 'FINALIZADO';
            if (now >= periodo.dataInicio && now <= periodo.dataFim) {
              status = 'ATIVO';
            } else if (now < periodo.dataInicio) {
              status = 'FUTURO';
            } else {
              status = 'FINALIZADO';
            }

            // Contar projetos aprovados no mesmo ano/semestre
            const totalProjetos = await db
              .select({ count: sql<number>`count(*)` })
              .from(projetoTable)
              .where(
                sql`${projetoTable.ano} = ${periodo.ano} AND ${projetoTable.semestre} = ${periodo.semestre} AND ${projetoTable.status} = 'APPROVED'`,
              );

            // Contar inscrições do período
            const totalInscricoes = await db
              .select({ count: sql<number>`count(*)` })
              .from(inscricaoTable)
              .where(eq(inscricaoTable.periodoInscricaoId, periodo.id));

            return {
              ...periodo,
              status,
              totalProjetos: Number(totalProjetos[0]?.count || 0),
              totalInscricoes: Number(totalInscricoes[0]?.count || 0),
            };
          }),
        );

        const validatedPeriodos = z
          .array(periodoInscricaoComStatusSchema)
          .parse(periodosComStatus);

        log.info(
          { count: validatedPeriodos.length },
          'Períodos de inscrição listados',
        );
        return json(validatedPeriodos, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao listar períodos de inscrição');
        return json(
          { error: 'Erro ao listar períodos de inscrição' },
          { status: 500 },
        );
      }
    }),
  ),

  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const validatedData = periodoInscricaoInputSchema.parse(body);

        // Verificar se já existe período para o mesmo ano/semestre
        const periodoExistente = await db.query.periodoInscricaoTable.findFirst(
          {
            where: sql`${periodoInscricaoTable.ano} = ${validatedData.ano} AND ${periodoInscricaoTable.semestre} = ${validatedData.semestre}`,
          },
        );

        if (periodoExistente) {
          return json(
            {
              error: 'Já existe um período de inscrição para este ano/semestre',
            },
            { status: 400 },
          );
        }

        // Validar datas
        if (validatedData.dataFim <= validatedData.dataInicio) {
          return json(
            { error: 'Data de fim deve ser posterior à data de início' },
            { status: 400 },
          );
        }

        const [novoPeriodo] = await db
          .insert(periodoInscricaoTable)
          .values(validatedData)
          .returning();

        const validatedPeriodo =
          periodoInscricaoResponseSchema.parse(novoPeriodo);

        log.info({ periodoId: novoPeriodo.id }, 'Período de inscrição criado');
        return json(validatedPeriodo, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao criar período de inscrição');
        return json(
          { error: 'Erro ao criar período de inscrição' },
          { status: 500 },
        );
      }
    }),
  ),
});
