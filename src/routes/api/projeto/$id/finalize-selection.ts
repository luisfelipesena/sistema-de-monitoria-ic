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
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

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
          const userId = parseInt(ctx.state.user.userId, 10);

          if (isNaN(projetoId)) {
            return json({ error: 'ID do projeto inválido' }, { status: 400 });
          }

          const body = await ctx.request.json();
          const { selecionados, enviarNotificacoes, observacoesGerais } =
            selecaoFinalSchema.parse(body);

          // Verificar se o projeto existe
          const projeto = await db.query.projetoTable.findFirst({
            where: eq(projetoTable.id, projetoId),
          });

          if (!projeto) {
            return json({ error: 'Projeto não encontrado' }, { status: 404 });
          }

          // Verificar permissões do professor
          if (ctx.state.user.role === 'professor') {
            const professor = await db.query.professorTable.findFirst({
              where: eq(professorTable.userId, userId),
            });

            if (!professor || projeto.professorResponsavelId !== professor.id) {
              return json(
                { error: 'Acesso não autorizado a este projeto' },
                { status: 403 },
              );
            }
          }

          // Validar limites de vagas
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

          if (voluntariosSelecionados > projeto.voluntariosSolicitados) {
            return json(
              {
                error: `Muitos voluntários selecionados. Máximo: ${projeto.voluntariosSolicitados}`,
              },
              { status: 400 },
            );
          }

          // Buscar todas as inscrições do projeto
          const todasInscricoes = await db
            .select({
              id: inscricaoTable.id,
              alunoId: inscricaoTable.alunoId,
              tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
              status: inscricaoTable.status,
            })
            .from(inscricaoTable)
            .where(eq(inscricaoTable.projetoId, projetoId));

          const idsInscrições = todasInscricoes.map((i) => i.id);
          const idsSelecionados = selecionados.map((s) => s.inscricaoId);

          // Atualizar status das inscrições
          const resultados = await db.transaction(async (tx) => {
            const resultadosAtualizacao = [];

            // Atualizar selecionados
            for (const selecionado of selecionados) {
              const novoStatus =
                selecionado.tipoVaga === 'BOLSISTA'
                  ? 'SELECTED_BOLSISTA'
                  : 'SELECTED_VOLUNTARIO';

              const [inscricaoAtualizada] = await tx
                .update(inscricaoTable)
                .set({
                  status: novoStatus,
                  updatedAt: new Date(),
                })
                .where(eq(inscricaoTable.id, selecionado.inscricaoId))
                .returning();

              resultadosAtualizacao.push({
                inscricaoId: selecionado.inscricaoId,
                status: novoStatus,
                tipo: 'SELECIONADO',
              });
            }

            // Atualizar rejeitados (não selecionados)
            const idsRejeitados = idsInscrições.filter(
              (id) => !idsSelecionados.includes(id),
            );

            if (idsRejeitados.length > 0) {
              await tx
                .update(inscricaoTable)
                .set({
                  status: 'REJECTED_BY_PROFESSOR',
                  updatedAt: new Date(),
                })
                .where(inArray(inscricaoTable.id, idsRejeitados));

              idsRejeitados.forEach((id) => {
                resultadosAtualizacao.push({
                  inscricaoId: id,
                  status: 'REJECTED_BY_PROFESSOR',
                  tipo: 'REJEITADO',
                });
              });
            }

            return resultadosAtualizacao;
          });

          // Enviar notificações se solicitado
          let notificacoesEnviadas = 0;
          let notificacoesFalharam = 0;

          if (enviarNotificacoes) {
            try {
              // Buscar dados dos candidatos para notificações
              const candidatosNotificacao = await db
                .select({
                  inscricaoId: inscricaoTable.id,
                  status: inscricaoTable.status,
                  alunoNome: alunoTable.nomeCompleto,
                  alunoEmail: alunoTable.emailInstitucional,
                })
                .from(inscricaoTable)
                .innerJoin(
                  alunoTable,
                  eq(inscricaoTable.alunoId, alunoTable.id),
                )
                .where(inArray(inscricaoTable.id, idsInscrições));

              // Enviar notificações
              for (const candidato of candidatosNotificacao) {
                try {
                  const isSelected = candidato.status.includes('SELECTED');
                  const tipoVaga =
                    candidato.status === 'SELECTED_BOLSISTA'
                      ? 'Bolsista'
                      : 'Voluntário';

                  let assunto, conteudo;

                  if (isSelected) {
                    assunto = `🎉 Parabéns! Você foi selecionado para monitoria - ${projeto.titulo}`;
                    conteudo = `
                      <h2>Parabéns, ${candidato.alunoNome}!</h2>
                      <p>Você foi <strong>selecionado(a)</strong> como <strong>${tipoVaga}</strong> para a monitoria:</p>
                      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3>${projeto.titulo}</h3>
                      </div>
                      <p>Próximos passos:</p>
                      <ol>
                        <li>Acesse a plataforma para confirmar sua participação</li>
                        <li>Aguarde orientações do professor responsável</li>
                      </ol>
                      ${observacoesGerais ? `<p><strong>Observações:</strong> ${observacoesGerais}</p>` : ''}
                    `;
                  } else {
                    assunto = `Resultado da seleção para monitoria - ${projeto.titulo}`;
                    conteudo = `
                      <h2>Resultado da Seleção</h2>
                      <p>Caro(a) ${candidato.alunoNome},</p>
                      <p>Agradecemos seu interesse na monitoria de <strong>${projeto.titulo}</strong>.</p>
                      <p>Infelizmente, você não foi selecionado(a) para esta monitoria neste momento.</p>
                      <p>Encorajamos você a se candidatar para outras oportunidades de monitoria.</p>
                      ${observacoesGerais ? `<p><strong>Observações:</strong> ${observacoesGerais}</p>` : ''}
                    `;
                  }

                  await sendEmail({
                    to: candidato.alunoEmail,
                    subject: assunto,
                    html: conteudo,
                  });

                  notificacoesEnviadas++;
                } catch (emailError) {
                  log.error(
                    { emailError, inscricaoId: candidato.inscricaoId },
                    'Erro ao enviar notificação',
                  );
                  notificacoesFalharam++;
                }
              }
            } catch (error) {
              log.error(error, 'Erro geral ao enviar notificações');
            }
          }

          // Log do processo finalizado
          log.info(
            {
              projetoId,
              selecionados: selecionados.length,
              rejeitados: idsInscrições.length - selecionados.length,
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
              rejeitados: idsInscrições.length - selecionados.length,
              totalCandidatos: idsInscrições.length,
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
