import { db } from '@/server/database';
import { professorTable, projetoTable } from '@/server/database/schema';
import { emailService } from '@/server/lib/emailService';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';

const log = logger.child({
  context: 'ProjetoNotifyApprovalAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/notify-approval')(
  {
    POST: createAPIHandler(
      withRoleMiddleware(['admin'], async (ctx) => {
        try {
          const projetoId = parseInt(ctx.params.id, 10);
          const adminUserId = parseInt(ctx.state.user.userId, 10);

          if (isNaN(projetoId)) {
            return json({ error: 'ID do projeto inválido' }, { status: 400 });
          }

          const projeto = await db.query.projetoTable.findFirst({
            where: eq(projetoTable.id, projetoId),
          });

          if (!projeto) {
            return json({ error: 'Projeto não encontrado' }, { status: 404 });
          }

          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.id, projeto.professorResponsavelId),
          });

          if (!professor || !professor.emailInstitucional) {
            log.warn({ projetoId, professorId: projeto.professorResponsavelId }, 'Professor ou email do professor não encontrado para notificação.');
            return json(
              { error: 'Professor responsável ou seu email não encontrado para enviar notificação' },
              { status: 404 },
            );
          }

          if (projeto.status !== 'APPROVED' && projeto.status !== 'REJECTED') {
            return json(
              {
                error:
                  'A notificação só pode ser enviada para projetos com status APROVADO ou REJEITADO.',
              },
              { status: 400 },
            );
          }

          await emailService.sendProjetoStatusChangeNotification({
            professorEmail: professor.emailInstitucional,
            professorNome: professor.nomeCompleto,
            projetoTitulo: projeto.titulo,
            projetoId: projeto.id,
            novoStatus: projeto.status,
            bolsasDisponibilizadas: projeto.bolsasDisponibilizadas === null ? undefined : projeto.bolsasDisponibilizadas,
            feedback: projeto.feedbackAdmin === null ? undefined : projeto.feedbackAdmin,
          }, adminUserId);

          log.info(
            { projetoId, professorId: professor.id, statusNotificado: projeto.status },
            'Notificação de status (aprovado/rejeitado) enviada ao professor',
          );

          return json(
            {
              success: true,
              message: 'Notificação enviada com sucesso para o professor.',
            },
            { status: 200 },
          );
        } catch (error) {
          log.error(error, 'Erro ao enviar notificação de status do projeto');
          return json({ error: 'Erro ao enviar notificação' }, { status: 500 });
        }
      }),
    ),
  },
);
