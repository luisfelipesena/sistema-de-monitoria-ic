import { db } from '@/server/database';
import { professorTable, projetoTable, userTable } from '@/server/database/schema';
import { emailService } from '@/server/lib/emailService';
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
  context: 'ProjetoApproveAPI',
});

const approveBodySchema = z.object({
  bolsasDisponibilizadas: z
    .number()
    .min(0, 'Número de bolsas deve ser positivo'),
  observacoes: z.string().optional(),
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/approve')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const body = await ctx.request.json();
        const { bolsasDisponibilizadas, observacoes } =
          approveBodySchema.parse(body);

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
            { error: 'Apenas projetos submetidos podem ser aprovados' },
            { status: 400 },
          );
        }

        // Validar quantidade de bolsas
        if (bolsasDisponibilizadas > projeto.bolsasSolicitadas) {
          return json(
            {
              error:
                'Não é possível disponibilizar mais bolsas do que foi solicitado',
            },
            { status: 400 },
          );
        }

        // Aprovar o projeto - set to PENDING_ADMIN_SIGNATURE
        const [projetoAtualizado] = await db
          .update(projetoTable)
          .set({
            status: 'PENDING_ADMIN_SIGNATURE',
            bolsasDisponibilizadas,
            feedbackAdmin: observacoes,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, projetoId))
          .returning();

        log.info({ projetoId, bolsasDisponibilizadas }, 'Projeto marcado como PENDING_ADMIN_SIGNATURE');

        // Send email notification to professor
        try {
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.id, projeto.professorResponsavelId),
          });

          if (professor) {
            await emailService.sendAdminAtualizouStatusProjetoNotification({
              professorEmail: professor.emailInstitucional,
              professorNome: professor.nomeCompleto,
              projetoTitulo: projetoAtualizado.titulo,
              projetoId: projetoAtualizado.id,
              novoStatus: 'PENDING_ADMIN_SIGNATURE',
              bolsasDisponibilizadas: projetoAtualizado.bolsasDisponibilizadas === null ? undefined : projetoAtualizado.bolsasDisponibilizadas,
              feedback: projetoAtualizado.feedbackAdmin === null ? undefined : projetoAtualizado.feedbackAdmin,
            });

            log.info({ projetoId }, 'Notificação de PENDING_ADMIN_SIGNATURE enviada ao professor');
          } else {
            log.warn({ projetoId }, 'Professor não encontrado para enviar notificação');
          }
        } catch (notifyError) {
          log.error(
            { notifyError, projetoId },
            'Erro ao enviar notificação de PENDING_ADMIN_SIGNATURE',
          );
        }

        return json(
          {
            success: true,
            message: 'Projeto aprovado com sucesso',
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

        log.error(error, 'Erro ao aprovar projeto');
        return json({ error: 'Erro ao aprovar projeto' }, { status: 500 });
      }
    }),
  ),
});
