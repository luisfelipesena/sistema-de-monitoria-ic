import { db } from '@/server/database';
import { professorTable, projetoTable } from '@/server/database/schema';
import { emailService } from '@/server/lib/emailService';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { getCurrentSemester } from '@/utils/get-current-semester';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, notInArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { env } from '@/utils/env';

const log = logger.child({
  context: 'BulkReminderAPI',
});

const bulkReminderSchema = z.object({
  type: z.enum(['PROJECT_SUBMISSION', 'SELECTION_PENDING']),
  customMessage: z.string().optional(),
  targetYear: z.number().int().optional(),
  targetSemester: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
});

export type BulkReminderInput = z.infer<typeof bulkReminderSchema>;

export const APIRoute = createAPIFileRoute('/api/admin/bulk-reminder')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const {
          type,
          customMessage,
          targetYear,
          targetSemester
        } = bulkReminderSchema.parse(body);

        const adminUserId = parseInt(ctx.state.user.userId, 10);

        const { year: defaultYear, semester: defaultSemester } = getCurrentSemester();
        const currentYear = targetYear || defaultYear;
        const currentSemester = targetSemester || defaultSemester;

        let emailsSent = 0;
        let emailsFailed = 0;
        const clientUrl = env.CLIENT_URL || 'http://localhost:3000';

        if (type === 'PROJECT_SUBMISSION') {
          const professoresComProjetos = await db
            .selectDistinct({ professorId: projetoTable.professorResponsavelId })
            .from(projetoTable)
            .where(
              sql`${projetoTable.ano} = ${currentYear} AND ${projetoTable.semestre} = ${currentSemester} AND ${projetoTable.status} != 'DRAFT'`,
            );

          const professorIdsComProjetos = professoresComProjetos.map(
            (p) => p.professorId!
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

          for (const professor of professoresSemProjetos) {
            if (!professor.emailInstitucional) {
              log.warn({ professorId: professor.id }, 'Professor sem email institucional, pulando lembrete de submissão.');
              emailsFailed++;
              continue;
            }
            try {
              await emailService.sendLembreteSubmissaoProjetoPendente({
                professorEmail: professor.emailInstitucional,
                professorNome: professor.nomeCompleto,
                periodoFormatado: `${currentYear}.${currentSemester === 'SEMESTRE_1' ? '1' : '2'}`,
                customMessage,
                linkPlataforma: clientUrl,
                remetenteUserId: adminUserId,
              });
              emailsSent++;
            } catch (error) {
              log.error(
                { error, professorId: professor.id },
                'Erro ao enviar email de lembrete de submissão',
              );
              emailsFailed++;
            }
          }
        } else if (type === 'SELECTION_PENDING') {
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
            if (!projeto.professorEmail) {
                log.warn({ projetoId: projeto.id }, 'Projeto sem email de professor, pulando lembrete de seleção.');
                emailsFailed++;
                continue;
            }
            try {
              await emailService.sendLembreteSelecaoMonitoresPendente({
                professorEmail: projeto.professorEmail,
                professorNome: projeto.professorNome,
                projetoTitulo: projeto.titulo,
                projetoId: projeto.id,
                customMessage,
                linkPlataforma: `${clientUrl}/home/professor/project/${projeto.id}/selection`,
                remetenteUserId: adminUserId,
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
