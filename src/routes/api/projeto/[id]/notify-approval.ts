import { db } from '@/server/database';
import { professorTable, projetoTable } from '@/server/database/schema';
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
  context: 'ProjetoNotifyApprovalAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/[id]/notify-approval')(
  {
    POST: createAPIHandler(
      withRoleMiddleware(['admin'], async (ctx) => {
        try {
          const projetoId = parseInt(ctx.params.id, 10);

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

          // Buscar dados do professor responsável
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.id, projeto.professorResponsavelId),
          });

          if (!professor) {
            return json(
              { error: 'Professor responsável não encontrado' },
              { status: 404 },
            );
          }

          let assunto = '';
          let conteudo = '';

          if (projeto.status === 'APPROVED') {
            assunto = `✅ Projeto "${projeto.titulo}" aprovado!`;
            conteudo = `
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2e7d32;">✅ Parabéns! Seu projeto foi aprovado</h2>
                
                <p>Caro(a) Professor(a) ${professor.nomeCompleto},</p>
                
                <p>Temos o prazer de informar que seu projeto de monitoria foi <strong>aprovado</strong>:</p>
                
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0; color: #1b5e20;">${projeto.titulo}</h3>
                  <p style="margin: 5px 0;"><strong>Bolsas disponibilizadas:</strong> ${projeto.bolsasDisponibilizadas}</p>
                  <p style="margin: 5px 0;"><strong>Voluntários:</strong> ${projeto.voluntariosSolicitados}</p>
                  ${projeto.feedbackAdmin ? `<p style="margin: 5px 0;"><strong>Observações:</strong> ${projeto.feedbackAdmin}</p>` : ''}
                </div>
                
                <p>Agora você pode aguardar o período de inscrições dos estudantes e posteriormente realizar o processo de seleção através da plataforma.</p>
                
                <p>Acesse a plataforma para acompanhar o progresso do seu projeto.</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">Sistema de Monitoria - UFBA</p>
              </div>
            </body>
            </html>
          `;
          } else if (projeto.status === 'REJECTED') {
            assunto = `❌ Projeto "${projeto.titulo}" - Revisão necessária`;
            conteudo = `
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">Resultado da análise do projeto</h2>
                
                <p>Caro(a) Professor(a) ${professor.nomeCompleto},</p>
                
                <p>Após análise do seu projeto de monitoria "<strong>${projeto.titulo}</strong>", identificamos alguns pontos que precisam ser revisados.</p>
                
                ${
                  projeto.feedbackAdmin
                    ? `
                <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0;">Observações da coordenação:</h4>
                  <p style="margin: 0;">${projeto.feedbackAdmin}</p>
                </div>
                `
                    : ''
                }
                
                <p>Recomendamos que você revise o projeto considerando as observações acima e resubmeta quando necessário.</p>
                
                <p>Em caso de dúvidas, entre em contato com a coordenação do programa de monitoria.</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">Sistema de Monitoria - UFBA</p>
              </div>
            </body>
            </html>
          `;
          } else {
            return json(
              {
                error:
                  'Projeto deve estar aprovado ou rejeitado para enviar notificação',
              },
              { status: 400 },
            );
          }

          // Enviar email
          await sendEmail({
            to: professor.emailInstitucional,
            subject: assunto,
            html: conteudo,
          });

          log.info(
            { projetoId, professorId: professor.id, status: projeto.status },
            'Notificação de aprovação/rejeição enviada',
          );

          return json(
            {
              success: true,
              message: 'Notificação enviada com sucesso',
            },
            { status: 200 },
          );
        } catch (error) {
          log.error(error, 'Erro ao enviar notificação de aprovação/rejeição');
          return json({ error: 'Erro ao enviar notificação' }, { status: 500 });
        }
      }),
    ),
  },
);
