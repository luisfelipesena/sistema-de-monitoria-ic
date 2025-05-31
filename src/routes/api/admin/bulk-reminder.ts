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
import { eq, notInArray, sql } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'BulkReminderAPI',
});

const bulkReminderSchema = z.object({
  type: z.enum(['PROJECT_SUBMISSION', 'SELECTION_PENDING']),
  customMessage: z.string().optional(),
  targetYear: z.number().optional(),
  targetSemester: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
});

export type BulkReminderInput = z.infer<typeof bulkReminderSchema>;

export const APIRoute = createAPIFileRoute('/api/admin/bulk-reminder')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const { type, customMessage, targetYear, targetSemester } =
          bulkReminderSchema.parse(body);

        const currentYear = targetYear || new Date().getFullYear();
        const currentSemester =
          targetSemester ||
          (new Date().getMonth() <= 6 ? 'SEMESTRE_1' : 'SEMESTRE_2');

        let emailsSent = 0;
        let emailsFailed = 0;

        if (type === 'PROJECT_SUBMISSION') {
          // Buscar professores que não submeteram projetos no período atual
          const professoresComProjetos = await db
            .select({ professorId: projetoTable.professorResponsavelId })
            .from(projetoTable)
            .where(
              sql`${projetoTable.ano} = ${currentYear} AND ${projetoTable.semestre} = ${currentSemester} AND ${projetoTable.status} != 'DRAFT'`,
            );

          const professorIdsComProjetos = professoresComProjetos.map(
            (p) => p.professorId,
          );

          let professoresSemProjetos;
          if (professorIdsComProjetos.length > 0) {
            professoresSemProjetos = await db
              .select({
                id: professorTable.id,
                nomeCompleto: professorTable.nomeCompleto,
                emailInstitucional: professorTable.emailInstitucional,
              })
              .from(professorTable)
              .where(notInArray(professorTable.id, professorIdsComProjetos));
          } else {
            professoresSemProjetos = await db
              .select({
                id: professorTable.id,
                nomeCompleto: professorTable.nomeCompleto,
                emailInstitucional: professorTable.emailInstitucional,
              })
              .from(professorTable);
          }

          // Enviar emails para professores sem projetos
          for (const professor of professoresSemProjetos) {
            try {
              await sendEmail({
                to: professor.emailInstitucional,
                subject: `Lembrete: Submissão de Projeto de Monitoria - ${currentYear}.${currentSemester === 'SEMESTRE_1' ? '1' : '2'}`,
                html: `
                  <html>
                  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h2 style="color: #1B2A50;">Lembrete: Submissão de Projeto de Monitoria</h2>
                      
                      <p>Caro(a) Professor(a) ${professor.nomeCompleto},</p>
                      
                      <p>Este é um lembrete sobre a submissão do seu projeto de monitoria para o período <strong>${currentYear}.${currentSemester === 'SEMESTRE_1' ? '1' : '2'}</strong>.</p>
                      
                      <p>Nossos registros indicam que você ainda não submeteu um projeto para este período. Se você planeja oferecer monitoria, por favor:</p>
                      
                      <ol>
                        <li>Acesse a plataforma de monitoria</li>
                        <li>Crie seu projeto de monitoria</li>
                        <li>Submeta o projeto para aprovação</li>
                      </ol>
                      
                      ${customMessage ? `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;"><p><strong>Mensagem adicional:</strong> ${customMessage}</p></div>` : ''}
                      
                      <p>Se você não planeja oferecer monitoria neste período, pode desconsiderar este email.</p>
                      
                      <p>Em caso de dúvidas, entre em contato com a coordenação do programa de monitoria.</p>
                      
                      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                      <p style="font-size: 12px; color: #666;">Sistema de Monitoria - UFBA</p>
                    </div>
                  </body>
                  </html>
                `,
              });
              emailsSent++;
            } catch (error) {
              log.error(
                { error, professorId: professor.id },
                'Erro ao enviar email de lembrete',
              );
              emailsFailed++;
            }
          }
        } else if (type === 'SELECTION_PENDING') {
          // Buscar projetos aprovados que ainda não finalizaram seleção
          const projetosComSelecaoPendente = await db
            .select({
              id: projetoTable.id,
              titulo: projetoTable.titulo,
              professorNome: professorTable.nomeCompleto,
              professorEmail: professorTable.emailInstitucional,
            })
            .from(projetoTable)
            .innerJoin(
              professorTable,
              eq(projetoTable.professorResponsavelId, professorTable.id),
            )
            .where(
              sql`${projetoTable.status} = 'APPROVED' AND ${projetoTable.ano} = ${currentYear} AND ${projetoTable.semestre} = ${currentSemester}`,
            );

          for (const projeto of projetosComSelecaoPendente) {
            try {
              await sendEmail({
                to: projeto.professorEmail,
                subject: `Lembrete: Seleção de Monitores Pendente - ${projeto.titulo}`,
                html: `
                  <html>
                  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h2 style="color: #1B2A50;">Lembrete: Seleção de Monitores</h2>
                      
                      <p>Caro(a) Professor(a) ${projeto.professorNome},</p>
                      
                      <p>Este é um lembrete sobre a seleção de monitores para o projeto:</p>
                      
                      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0; color: #1b5e20;">${projeto.titulo}</h3>
                      </div>
                      
                      <p>Favor verificar se há candidatos inscritos e proceder com a seleção através da plataforma.</p>
                      
                      ${customMessage ? `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;"><p><strong>Mensagem adicional:</strong> ${customMessage}</p></div>` : ''}
                      
                      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                      <p style="font-size: 12px; color: #666;">Sistema de Monitoria - UFBA</p>
                    </div>
                  </body>
                  </html>
                `,
              });
              emailsSent++;
            } catch (error) {
              log.error(
                { error, projetoId: projeto.id },
                'Erro ao enviar email de lembrete de seleção',
              );
              emailsFailed++;
            }
          }
        }

        log.info(
          { type, emailsSent, emailsFailed, currentYear, currentSemester },
          'Envio de lembretes em lote concluído',
        );

        return json({
          success: true,
          message: 'Lembretes enviados com sucesso',
          emailsSent,
          emailsFailed,
          total: emailsSent + emailsFailed,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao enviar lembretes em lote');
        return json({ error: 'Erro ao enviar lembretes' }, { status: 500 });
      }
    }),
  ),
});
