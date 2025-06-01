import { db } from '@/server/database';
import { professorTable, projetoTable, userTable } from '@/server/database/schema';
import { sendProjetoApprovalStatusNotification } from '@/server/lib/emailService';
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
  context: 'ProjetoRejectAPI',
});

const rejectBodySchema = z.object({
  motivo: z.string().min(1, 'Motivo da rejeição é obrigatório'),
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/reject')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const body = await ctx.request.json();
        const { motivo } = rejectBodySchema.parse(body);

        // Buscar o projeto
        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        // Verificar se o projeto está em status SUBMITTED
        if (projeto.status !== 'SUBMITTED') {
          return json(
            { error: 'Apenas projetos submetidos podem ser rejeitados' },
            { status: 400 },
          );
        }

        // Rejeitar o projeto
        const [projetoAtualizado] = await db
          .update(projetoTable)
          .set({
            status: 'REJECTED',
            feedbackAdmin: motivo,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, projetoId))
          .returning();

        log.info({ projetoId }, 'Projeto rejeitado');

        // Send email notification to professor
        try {
          // Get professor details
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.id, projeto.professorResponsavelId),
          });

          const professorUser = professor ? await db.query.userTable.findFirst({
            where: eq(userTable.id, professor.userId),
          }) : null;

          if (professor && professorUser) {
            await sendProjetoApprovalStatusNotification({
              professorNome: professor.nomeCompleto,
              professorEmail: professorUser.email,
              projetoTitulo: projeto.titulo,
              projetoId: projeto.id,
              status: 'REJECTED',
              feedbackAdmin: motivo,
            });

            log.info({ projetoId }, 'Notificação de rejeição enviada ao professor');
          } else {
            log.warn({ projetoId }, 'Professor não encontrado para enviar notificação');
          }
        } catch (notifyError) {
          log.error(
            { notifyError, projetoId },
            'Erro ao enviar notificação de rejeição',
          );
          // Don't fail the rejection if email fails
        }

        return json(
          {
            success: true,
            message: 'Projeto rejeitado',
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

        log.error(error, 'Erro ao rejeitar projeto');
        return json({ error: 'Erro ao rejeitar projeto' }, { status: 500 });
      }
    }),
  ),
});
