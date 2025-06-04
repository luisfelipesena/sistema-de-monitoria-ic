import { db } from '@/server/database';
import {
  alunoTable,
  inscricaoTable,
  professorTable,
  projetoTable,
} from '@/server/database/schema';
import { emailService } from '@/server/lib/emailService';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { env } from '@/utils/env';

const log = logger.child({
  context: 'ProjetoNotifyResultsAPI',
});

export const APIRoute = createAPIFileRoute(
  '/api/projeto/$projeto/notify-results',
)({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.projeto, 10);
        const remetenteUserId = parseInt(ctx.state.user.userId, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
          with: {
            professorResponsavel: true,
          }
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        if (ctx.state.user.role === 'professor') {
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, remetenteUserId),
          });
          if (!professor || projeto.professorResponsavelId !== professor.id) {
            return json(
              { error: 'Acesso não autorizado a este projeto' },
              { status: 403 },
            );
          }
        } else if (ctx.state.user.role !== 'admin') {
          return json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const inscricoes = await db
          .select({
            id: inscricaoTable.id,
            status: inscricaoTable.status,
            feedbackProfessor: inscricaoTable.feedbackProfessor,
            alunoId: alunoTable.id,
            alunoEmail: alunoTable.emailInstitucional,
            alunoNome: alunoTable.nomeCompleto,
          })
          .from(inscricaoTable)
          .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
          .where(eq(inscricaoTable.projetoId, projetoId));

        if (inscricoes.length === 0) {
          return json(
            { error: 'Nenhuma inscrição encontrada para este projeto' },
            { status: 400 },
          );
        }

        let emailsEnviados = 0;
        let emailsFalharam = 0;
        const clientUrl = env.CLIENT_URL || 'http://localhost:3000';

        for (const inscricao of inscricoes) {
          if (!inscricao.alunoEmail) {
            log.warn({ inscricaoId: inscricao.id }, 'Inscrição sem email de aluno, pulando notificação.');
            emailsFalharam++;
            continue;
          }
          
          if (inscricao.status !== 'SELECTED_BOLSISTA' && 
              inscricao.status !== 'SELECTED_VOLUNTARIO' && 
              inscricao.status !== 'REJECTED_BY_PROFESSOR') {
            log.info({ inscricaoId: inscricao.id, status: inscricao.status }, 'Inscrição com status não notificável neste fluxo, pulando.');
            continue; 
          }

          try {
            await emailService.sendStudentSelectionResultNotification({
              studentName: inscricao.alunoNome,
              studentEmail: inscricao.alunoEmail,
              projectTitle: projeto.titulo,
              professorName: projeto.professorResponsavel.nomeCompleto,
              status: inscricao.status as 'SELECTED_BOLSISTA' | 'SELECTED_VOLUNTARIO' | 'REJECTED_BY_PROFESSOR',
              linkConfirmacao: `${clientUrl}/home/student/resultados`,
              feedbackProfessor: inscricao.feedbackProfessor === null ? undefined : inscricao.feedbackProfessor,
              projetoId: projetoId,
              alunoId: inscricao.alunoId,
              remetenteUserId: remetenteUserId,
            });

            emailsEnviados++;
          } catch (emailError) {
            log.error(
              { emailError, inscricaoId: inscricao.id },
              'Erro ao enviar email para inscrito',
            );
            emailsFalharam++;
          }
        }

        log.info(
          { projetoId, emailsEnviados, emailsFalharam },
          'Notificações de resultado enviadas',
        );

        return json(
          {
            message: 'Notificações processadas',
            emailsEnviados,
            emailsFalharam,
            totalCandidatosNotificaveis: emailsEnviados + emailsFalharam,
          },
          { status: 200 },
        );
      } catch (error) {
        log.error(error, 'Erro ao enviar notificações de resultado');
        return json({ error: 'Erro ao enviar notificações' }, { status: 500 });
      }
    }),
  ),
});
