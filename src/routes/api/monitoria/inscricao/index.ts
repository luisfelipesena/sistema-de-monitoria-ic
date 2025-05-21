import { criarInscricaoSchema } from '@/routes/api/monitoria/-types';
import { db } from '@/server/database';
import {
  alunoTable,
  inscricaoDocumentoTable,
  inscricaoTable,
  tipoInscricaoEnum,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({ context: 'MonitoriaInscricaoAPI' });

export const APIRoute = createAPIFileRoute('/api/monitoria/inscricao')({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const body = await ctx.request.json();
        const input = criarInscricaoSchema.parse(body);

        const userId = parseInt(ctx.state.user.userId, 10);
        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, userId),
        });
        if (!aluno) {
          return json(
            { error: 'Perfil de aluno não encontrado' },
            { status: 400 },
          );
        }

        // Encontrar período de inscrição ativo
        const now = new Date();
        const period = await db.query.periodoInscricaoTable.findFirst({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          where: (pi: any, { and, lte, gte }: any) =>
            and(lte(pi.dataInicio, now), gte(pi.dataFim, now)),
        });

        if (!period) {
          return json(
            { error: 'Nenhum período de inscrição ativo' },
            { status: 400 },
          );
        }

        // Verificar se já existe inscrição
        const existing = await db.query.inscricaoTable.findFirst({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          where: (ins: any, { and }: any) =>
            and(
              eq(ins.periodoInscricaoId, period.id),
              eq(ins.projetoId, input.projetoId),
              eq(ins.alunoId, aluno.id),
            ),
        });
        if (existing) {
          return json(
            { error: 'Você já se candidatou para este projeto neste período' },
            { status: 400 },
          );
        }

        // Criar inscrição
        const [newInscricao] = await db
          .insert(inscricaoTable)
          .values({
            periodoInscricaoId: period.id,
            projetoId: input.projetoId,
            alunoId: aluno.id,
            tipoVagaPretendida:
              input.tipoVagaPretendida as (typeof tipoInscricaoEnum.enumValues)[number],
          })
          .returning();

        // Criar documentos vinculados, se houver
        if (input.documentos && input.documentos.length) {
          const docs = input.documentos.map((doc: any) => ({
            inscricaoId: newInscricao.id,
            tipoDocumento: doc.tipoDocumento,
            fileId: doc.fileId,
          }));
          await db.insert(inscricaoDocumentoTable).values(docs);
        }

        log.info({ inscricaoId: newInscricao.id }, 'Inscrição criada');
        return json(newInscricao, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }
        log.error(error, 'Erro ao criar inscrição');
        return json(
          { error: 'Erro interno ao criar inscrição' },
          { status: 500 },
        );
      }
    }),
  ),
});
