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

        // Validate status transitions based on new flow:
        // Professor: DRAFT -> SUBMITTED
        // Admin: SUBMITTED -> APPROVED/REJECTED/PENDING_ADMIN_SIGNATURE
        
        // Admin should not be able to change DRAFT status (only professor can submit)
        if (projeto.status === 'DRAFT') {
          return json(
            {
              error: 'Somente o professor pode submeter um projeto em rascunho',
            },
            { status: 400 },
          );
        }
        
        // Admin can only change SUBMITTED projects
        if (projeto.status === 'SUBMITTED') {
          if (!['APPROVED', 'REJECTED', 'PENDING_ADMIN_SIGNATURE'].includes(status)) {
            return json(
              {
                error: `Status inválido. Projetos submetidos podem ser aprovados, rejeitados ou aguardar assinatura do admin.`,
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
