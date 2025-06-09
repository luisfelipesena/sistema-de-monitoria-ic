import { db } from '@/server/database';
import { professorTable, projetoTable, userTable, departamentoTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { emailService } from '@/server/lib/emailService';
import { projetoComRelationsSchema } from '@/routes/api/projeto/-types';
import { z } from 'zod';

const log = logger.child({
  context: 'SubmitProjetoAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/submit')({
  PATCH: createAPIHandler(
    withAuthMiddleware(
      withRoleMiddleware(['admin', 'professor'], async (ctx) => {
        try {
          const projectId = parseInt(ctx.params.id, 10);
          const userId = parseInt(ctx.state.user.userId, 10);

          if (isNaN(projectId)) {
            return json({ error: 'ID do projeto inválido' }, { status: 400 });
          }

          const projeto = await db.query.projetoTable.findFirst({
            where: eq(projetoTable.id, projectId),
          });

          if (!projeto) {
            return json({ error: 'Projeto não encontrado' }, { status: 404 });
          }

          if (ctx.state.user.role === 'professor') {
            const professorProfile = await db.query.professorTable.findFirst({
              where: eq(professorTable.userId, userId),
            });
            if (
              !professorProfile ||
              projeto.professorResponsavelId !== professorProfile.id
            ) {
              return json(
                { error: 'Acesso não autorizado para submeter este projeto' },
                { status: 403 },
              );
            }
          }
          
          if (projeto.status !== 'DRAFT') {
            return json(
              {
                error: `Projeto com status ${projeto.status} não pode ser submetido.`,
              },
              { status: 400 },
            );
          }

          const [updatedProjeto] = await db
            .update(projetoTable)
            .set({
              status: 'SUBMITTED',
              updatedAt: new Date(),
            })
            .where(eq(projetoTable.id, projectId))
            .returning();

          if (!updatedProjeto) {
            return json(
              { error: 'Falha ao atualizar o status do projeto' },
              { status: 500 },
            );
          }

          log.info(
            { projectId, newStatus: 'SUBMITTED' },
            'Projeto submetido para aprovação',
          );

          try {
            const admins = await db.query.userTable.findMany({
              where: eq(userTable.role, 'admin'),
            });

            const adminEmails = admins
              .map((admin) => admin.email)
              .filter((email): email is string => !!email && email.length > 0);

            if (adminEmails.length > 0) {
              const professor = await db.query.professorTable.findFirst({
                where: eq(professorTable.id, updatedProjeto.professorResponsavelId),
              });

              const departamento = await db.query.departamentoTable.findFirst({
                where: eq(departamentoTable.id, updatedProjeto.departamentoId),
              });

              await emailService.sendProjetoSubmetidoParaAdminsNotification(
                {
                  professorNome: professor?.nomeCompleto || 'Professor Desconhecido',
                  projetoTitulo: updatedProjeto.titulo,
                  projetoId: updatedProjeto.id,
                  departamento: departamento?.nome,
                  semestre: updatedProjeto.semestre,
                  ano: updatedProjeto.ano,
                },
                adminEmails,
              );

              log.info(
                { projectId, adminCount: adminEmails.length },
                'Notificação de submissão enviada para administradores',
              );
            } else {
              log.warn(
                { projectId },
                'Nenhum administrador encontrado para enviar notificação',
              );
            }
          } catch (emailError) {
            log.error(
              { emailError, projectId },
              'Erro ao enviar notificação de submissão',
            );
          }

          const result = await db.query.projetoTable.findFirst({
              where: eq(projetoTable.id, updatedProjeto.id),
              with: {
                  professorResponsavel: true,
                  departamento: true,
                  disciplinas: { with: { disciplina: true } },
                  professoresParticipantes: { with: { professor: true } },
                  atividades: true,
              }
          });

          return json(projetoComRelationsSchema.parse(result), {
            status: 200,
          });
        } catch (error) {
          if (error instanceof z.ZodError) {
            log.error(
              { error: error.flatten() },
              'Erro de validação Zod ao submeter projeto',
            );
            return json(
              { error: 'Dados de resposta inválidos', details: error.errors },
              { status: 500 },
            );
          }
          log.error(error, 'Erro ao submeter projeto para aprovação');
          return json(
            { error: 'Erro interno do servidor ao submeter projeto' },
            { status: 500 },
          );
        }
      }),
    ),
  ),
});
