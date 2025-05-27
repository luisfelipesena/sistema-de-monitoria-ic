import { db } from '@/server/database';
import {
  alunoTable,
  inscricaoTable,
  professorTable,
  projetoTable,
} from '@/server/database/schema';
import { sendEmail } from '@/server/lib/emailService';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';

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
        const userId = parseInt(ctx.state.user.userId, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        // Verificar se o projeto existe
        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        // Verificar permissões
        if (ctx.state.user.role === 'professor') {
          // Professor só pode enviar notificações dos seus projetos
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, userId),
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

        // Buscar todas as inscrições do projeto
        const inscricoes = await db
          .select({
            id: inscricaoTable.id,
            status: inscricaoTable.status,
            tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
            feedbackProfessor: inscricaoTable.feedbackProfessor,
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

        // Enviar email para cada inscrito
        for (const inscricao of inscricoes) {
          try {
            const isSelected = inscricao.status.includes('SELECTED');
            const isRejected = inscricao.status === 'REJECTED_BY_PROFESSOR';

            let assunto = '';
            let conteudo = '';

            if (isSelected) {
              assunto = `🎉 Parabéns! Você foi selecionado para a monitoria de ${projeto.titulo}`;
              conteudo = `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2e7d32;">🎉 Parabéns, ${inscricao.alunoNome}!</h2>
                    
                    <p>Temos o prazer de informar que você foi <strong>selecionado(a)</strong> para a monitoria:</p>
                    
                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin: 0; color: #1b5e20;">${projeto.titulo}</h3>
                      <p style="margin: 5px 0;"><strong>Tipo de vaga:</strong> ${inscricao.tipoVagaPretendida}</p>
                      ${inscricao.feedbackProfessor ? `<p style="margin: 5px 0;"><strong>Observações:</strong> ${inscricao.feedbackProfessor}</p>` : ''}
                    </div>
                    
                    <p>Por favor, confirme sua participação através da plataforma de monitoria até [DATA_LIMITE].</p>
                    
                    <p>Em caso de dúvidas, entre em contato com o professor responsável.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="font-size: 12px; color: #666;">Sistema de Monitoria - UFBA</p>
                  </div>
                </body>
                </html>
              `;
            } else if (isRejected) {
              assunto = `Resultado da seleção para monitoria de ${projeto.titulo}`;
              conteudo = `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #d32f2f;">Resultado da Seleção</h2>
                    
                    <p>Caro(a) ${inscricao.alunoNome},</p>
                    
                    <p>Agradecemos seu interesse na monitoria de <strong>${projeto.titulo}</strong>.</p>
                    
                    <p>Infelizmente, informamos que você não foi selecionado(a) para esta monitoria.</p>
                    
                    ${
                      inscricao.feedbackProfessor
                        ? `
                    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <h4 style="margin: 0 0 10px 0;">Feedback do Professor:</h4>
                      <p style="margin: 0;">${inscricao.feedbackProfessor}</p>
                    </div>
                    `
                        : ''
                    }
                    
                    <p>Encorajamos você a se candidatar para outras oportunidades de monitoria.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="font-size: 12px; color: #666;">Sistema de Monitoria - UFBA</p>
                  </div>
                </body>
                </html>
              `;
            } else {
              // Status SUBMITTED - ainda em análise
              continue;
            }

            await sendEmail({
              to: inscricao.alunoEmail,
              subject: assunto,
              html: conteudo,
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
            total: inscricoes.length,
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
