import { db } from '@/server/database';
import {
  professorTable,
  projetoTable,
  userTable,
} from '@/server/database/schema';
import { sendEmail } from '@/server/lib/emailService';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';

const log = logger.child({
  context: 'ProjetoSubmitAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/submit')({
  POST: createAPIHandler(
    withRoleMiddleware(['professor'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const userId = parseInt(ctx.state.user.userId, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        // Buscar o projeto
        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        // Verificar se o professor é o responsável pelo projeto
        const professor = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, userId),
        });

        if (!professor || projeto.professorResponsavelId !== professor.id) {
          return json(
            { error: 'Apenas o professor responsável pode submeter o projeto' },
            { status: 403 },
          );
        }

        // Verificar se o projeto está em status DRAFT
        if (projeto.status !== 'DRAFT') {
          return json(
            { error: 'Apenas projetos em rascunho podem ser submetidos' },
            { status: 400 },
          );
        }

        // Atualizar status para SUBMITTED
        const [projetoAtualizado] = await db
          .update(projetoTable)
          .set({
            status: 'SUBMITTED',
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, projetoId))
          .returning();

        log.info(
          { projetoId, professorId: professor.id },
          'Projeto submetido para aprovação',
        );

        // Enviar notificação para todos os admins
        const admins = await db.query.userTable.findMany({
          where: eq(userTable.role, 'admin'),
        });

        for (const admin of admins) {
          await sendEmail({
            to: admin.email,
            subject: 'Novo Projeto para Assinatura - Monitoria',
            html: `
              <h2>Novo Projeto de Monitoria Submetido</h2>
              <p>O professor ${professor.nomeCompleto} submeteu um novo projeto de monitoria que precisa da sua assinatura:</p>
              <p><strong>Título:</strong> ${projeto.titulo}</p>
              <p>Acesse a plataforma para revisar e assinar o projeto.</p>
            `,
          });
        }

        return json(
          {
            success: true,
            message: 'Projeto submetido para aprovação com sucesso',
            projeto: projetoAtualizado,
          },
          { status: 200 },
        );
      } catch (error) {
        log.error(error, 'Erro ao submeter projeto');
        return json({ error: 'Erro ao submeter projeto' }, { status: 500 });
      }
    }),
  ),
});
