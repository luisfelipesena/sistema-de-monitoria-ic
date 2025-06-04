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
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { env } from '@/utils/env';

const log = logger.child({
  context: 'FinalizeSelectionAPI',
});

const selecaoFinalSchema = z.object({
  selecionados: z.array(
    z.object({
      inscricaoId: z.number(),
      tipoVaga: z.enum(['BOLSISTA', 'VOLUNTARIO']),
      prioridade: z.number().optional(),
    }),
  ),
  enviarNotificacoes: z.boolean().default(true),
  observacoesGerais: z.string().optional(),
});

export type SelecaoFinal = z.infer<typeof selecaoFinalSchema>;

export const APIRoute = createAPIFileRoute(
  '/api/projeto/$id/finalize-selection',
)({
  POST: createAPIHandler(
    withAuthMiddleware(
      withRoleMiddleware(['professor', 'admin'], async (ctx) => {
        try {
          const projetoId = parseInt(ctx.params.id, 10);
          const remetenteUserId = parseInt(ctx.state.user.userId, 10);

          if (isNaN(projetoId)) {
            return json({ error: 'ID do projeto inválido' }, { status: 400 });
          }

          const body = await ctx.request.json();
          const { selecionados, enviarNotificacoes, observacoesGerais } =
            selecaoFinalSchema.parse(body);

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
          }

          const bolsistasSelecionados = selecionados.filter(
            (s) => s.tipoVaga === 'BOLSISTA',
          ).length;
          const voluntariosSelecionados = selecionados.filter(
            (s) => s.tipoVaga === 'VOLUNTARIO',
          ).length;

          if (bolsistasSelecionados > (projeto.bolsasDisponibilizadas || 0)) {
            return json(
              {
                error: `Muitos bolsistas selecionados. Máximo: ${projeto.bolsasDisponibilizadas}`,
              },
              { status: 400 },
            );
          }

          if (voluntariosSelecionados > (projeto.voluntariosSolicitados || 0)) {
            return json(
              {
                error: `Muitos voluntários selecionados. Máximo: ${projeto.voluntariosSolicitados}`,
              },
              { status: 400 },
            );
          }

          const todasInscricoes = await db
            .select({
              id: inscricaoTable.id,
              alunoId: inscricaoTable.alunoId,
              statusAnterior: inscricaoTable.status,
            })
            .from(inscricaoTable)
            .where(eq(inscricaoTable.projetoId, projetoId));

          const idsInscricoes = todasInscricoes.map((i) => i.id);
          const idsSelecionados = selecionados.map((s) => s.inscricaoId);

          await db.transaction(async (tx) => {
            for (const selecionado of selecionados) {
              const novoStatus =
                selecionado.tipoVaga === 'BOLSISTA'
                  ? 'SELECTED_BOLSISTA'
                  : 'SELECTED_VOLUNTARIO';
              await tx
                .update(inscricaoTable)
                .set({
                  status: novoStatus,
                  feedbackProfessor: observacoesGerais,
                  updatedAt: new Date(),
                })
                .where(eq(inscricaoTable.id, selecionado.inscricaoId));
            }
            const idsRejeitados = idsInscricoes.filter(
              (id) => !idsSelecionados.includes(id),
            );
            if (idsRejeitados.length > 0) {
              await tx
                .update(inscricaoTable)
                .set({
                  status: 'REJECTED_BY_PROFESSOR',
                  feedbackProfessor: observacoesGerais,
                  updatedAt: new Date(),
                })
                .where(inArray(inscricaoTable.id, idsRejeitados));
            }
          });

          let notificacoesEnviadas = 0;
          let notificacoesFalharam = 0;
          const clientUrl = env.CLIENT_URL || 'http://localhost:3000';

          if (enviarNotificacoes) {
            const candidatosParaNotificacao = await db
              .select({
                inscricaoId: inscricaoTable.id,
                alunoId: inscricaoTable.alunoId,
                status: inscricaoTable.status,
                alunoNome: alunoTable.nomeCompleto,
                alunoEmail: alunoTable.emailInstitucional,
                feedbackProfessor: inscricaoTable.feedbackProfessor,
              })
              .from(inscricaoTable)
              .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
              .where(inArray(inscricaoTable.id, idsInscricoes));

            for (const candidato of candidatosParaNotificacao) {
              if (!candidato.alunoEmail) {
                log.warn({ inscricaoId: candidato.inscricaoId }, 'Candidato sem email, pulando notificação.');
                notificacoesFalharam++;
                continue;
              }
              if (candidato.status !== 'SELECTED_BOLSISTA' && 
                  candidato.status !== 'SELECTED_VOLUNTARIO' && 
                  candidato.status !== 'REJECTED_BY_PROFESSOR') {
                continue; 
              }

              try {
                await emailService.sendStudentSelectionResultNotification({
                  studentName: candidato.alunoNome,
                  studentEmail: candidato.alunoEmail,
                  projectTitle: projeto.titulo,
                  professorName: projeto.professorResponsavel.nomeCompleto,
                  status: candidato.status as 'SELECTED_BOLSISTA' | 'SELECTED_VOLUNTARIO' | 'REJECTED_BY_PROFESSOR',
                  linkConfirmacao: `${clientUrl}/home/student/resultados`,
                  feedbackProfessor: candidato.feedbackProfessor === null ? observacoesGerais : candidato.feedbackProfessor,
                  projetoId: projetoId,
                  alunoId: candidato.alunoId,
                  remetenteUserId: remetenteUserId,
                });
                notificacoesEnviadas++;
              } catch (emailError) {
                log.error(
                  { emailError, inscricaoId: candidato.inscricaoId },
                  'Erro ao enviar notificação de resultado da seleção',
                );
                notificacoesFalharam++;
              }
            }
          }

          log.info(
            {
              projetoId,
              selecionadosCount: selecionados.length,
              rejeitadosCount: idsInscricoes.length - selecionados.length,
              notificacoesEnviadas,
              notificacoesFalharam,
            },
            'Processo de seleção finalizado',
          );

          return json({
            success: true,
            message: 'Processo de seleção finalizado com sucesso',
            resultados: {
              selecionados: selecionados.length,
              rejeitados: idsInscricoes.length - selecionados.length,
              totalCandidatos: idsInscricoes.length,
            },
            notificacoes: enviarNotificacoes
              ? {
                  enviadas: notificacoesEnviadas,
                  falharam: notificacoesFalharam,
                }
              : null,
          });
        } catch (error) {
          if (error instanceof z.ZodError) {
            return json(
              { error: 'Dados de seleção inválidos', details: error.errors },
              { status: 400 },
            );
          }

          log.error(error, 'Erro ao finalizar processo de seleção');
          return json(
            { error: 'Erro ao finalizar processo de seleção' },
            { status: 500 },
          );
        }
      }),
    ),
  ),

  // GET: Status do processo de seleção
  GET: createAPIHandler(
    withAuthMiddleware(
      withRoleMiddleware(['professor', 'admin'], async (ctx) => {
        try {
          const projetoId = parseInt(ctx.params.id, 10);

          if (isNaN(projetoId)) {
            return json({ error: 'ID do projeto inválido' }, { status: 400 });
          }

          // Buscar estatísticas da seleção
          const inscricoes = await db
            .select({
              id: inscricaoTable.id,
              status: inscricaoTable.status,
              tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
              feedbackProfessor: inscricaoTable.feedbackProfessor,
            })
            .from(inscricaoTable)
            .where(eq(inscricaoTable.projetoId, projetoId));

          const estatisticas = {
            total: inscricoes.length,
            pendentes: inscricoes.filter((i) => i.status === 'SUBMITTED')
              .length,
            avaliados: inscricoes.filter((i) => i.feedbackProfessor).length,
            selecionadosBolsista: inscricoes.filter(
              (i) => i.status === 'SELECTED_BOLSISTA',
            ).length,
            selecionadosVoluntario: inscricoes.filter(
              (i) => i.status === 'SELECTED_VOLUNTARIO',
            ).length,
            rejeitados: inscricoes.filter(
              (i) => i.status === 'REJECTED_BY_PROFESSOR',
            ).length,
            aceitos: inscricoes.filter((i) => i.status.includes('ACCEPTED'))
              .length,
            recusados: inscricoes.filter(
              (i) => i.status === 'REJECTED_BY_STUDENT',
            ).length,
          };

          const processoFinalizado =
            estatisticas.pendentes === 0 &&
            estatisticas.selecionadosBolsista +
              estatisticas.selecionadosVoluntario +
              estatisticas.rejeitados ===
              estatisticas.total;

          return json({
            estatisticas,
            processoFinalizado,
            proximaEtapa: processoFinalizado
              ? 'aguardando_confirmacao_estudantes'
              : 'avaliar_candidatos',
          });
        } catch (error) {
          log.error(error, 'Erro ao buscar status da seleção');
          return json(
            { error: 'Erro ao buscar status da seleção' },
            { status: 500 },
          );
        }
      }),
    ),
  ),
});
