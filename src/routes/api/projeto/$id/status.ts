import { db } from '@/server/database';
import { projetoStatusEnum, projetoTable } from '@/server/database/schema';
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
  context: 'ProjetoStatusUpdateAPI',
});

const updateStatusBodySchema = z.object({
  status: z.enum(projetoStatusEnum.enumValues),
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/status')({
  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const body = await ctx.request.json();
        const { status } = updateStatusBodySchema.parse(body);

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        // Add any specific logic for status transitions if needed
        // For example, admin can only move DRAFT to PENDING_PROFESSOR_SIGNATURE here
        if (
          projeto.status === 'DRAFT' &&
          status !== 'PENDING_PROFESSOR_SIGNATURE'
        ) {
          // Or any other status an admin might set from DRAFT, e.g. directly to SUBMITTED or REJECTED by admin
          // This example is specific to the admin signing flow
          if (status !== 'SUBMITTED' && status !== 'REJECTED') {
            return json(
              {
                error: `Admin não pode alterar status de DRAFT para ${status} diretamente aqui.`,
              },
              { status: 400 },
            );
          }
        }

        const [projetoAtualizado] = await db
          .update(projetoTable)
          .set({
            status: status,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, projetoId))
          .returning();

        log.info(
          { projetoId, newStatus: status },
          'Status do projeto atualizado',
        );

        return json(
          {
            success: true,
            message: 'Status do projeto atualizado com sucesso',
            projeto: projetoAtualizado,
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

        log.error(error, 'Erro ao atualizar status do projeto');
        return json(
          { error: 'Erro ao atualizar status do projeto' },
          { status: 500 },
        );
      }
    }),
  ),
});
