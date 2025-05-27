import { db } from '@/server/database';
import {
  alunoTable,
  inscricaoTable,
  professorTable,
  projetoTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'SelectionProcessAPI',
});

const criteriosAvaliacaoSchema = z.object({
  cr: z.number().min(0).max(10),
  experienciaPrevia: z.number().min(0).max(10),
  motivacao: z.number().min(0).max(10),
  disponibilidade: z.number().min(0).max(10),
  entrevista: z.number().min(0).max(10).optional(),
});

const avaliacaoCandidatoSchema = z.object({
  inscricaoId: z.number(),
  criterios: criteriosAvaliacaoSchema,
  notaFinal: z.number().min(0).max(10),
  status: z.enum(['PENDENTE', 'AVALIADO', 'SELECIONADO', 'REJEITADO']),
  observacoes: z.string().optional(),
  prioridade: z.number().min(1).optional(),
});

const bulkEvaluationSchema = z.object({
  avaliacoes: z.array(avaliacaoCandidatoSchema),
  autoCalcularNota: z.boolean().default(true),
});

export type CriteriosAvaliacao = z.infer<typeof criteriosAvaliacaoSchema>;
export type AvaliacaoCandidato = z.infer<typeof avaliacaoCandidatoSchema>;

const calcularNotaFinal = (criterios: CriteriosAvaliacao): number => {
  const { cr, experienciaPrevia, motivacao, disponibilidade, entrevista } =
    criterios;

  // Pesos dos critérios
  const pesos = {
    cr: 0.3,
    experienciaPrevia: 0.2,
    motivacao: 0.2,
    disponibilidade: 0.15,
    entrevista: 0.15,
  };

  let notaFinal =
    cr * pesos.cr +
    experienciaPrevia * pesos.experienciaPrevia +
    motivacao * pesos.motivacao +
    disponibilidade * pesos.disponibilidade;

  if (entrevista !== undefined) {
    notaFinal += entrevista * pesos.entrevista;
  }

  return Math.round(notaFinal * 100) / 100;
};

export const APIRoute = createAPIFileRoute(
  '/api/projeto/$id/selection-process',
)({
  // GET: Buscar candidatos com avaliações
  GET: createAPIHandler(
    withAuthMiddleware(
      withRoleMiddleware(['professor', 'admin'], async (ctx) => {
        try {
          const projetoId = parseInt(ctx.params.id, 10);
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

          // Buscar inscrições com dados do aluno
          const inscricoes = await db
            .select({
              inscricaoId: inscricaoTable.id,
              tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
              status: inscricaoTable.status,
              feedbackProfessor: inscricaoTable.feedbackProfessor,
              createdAt: inscricaoTable.createdAt,
              alunoId: alunoTable.id,
              alunoNome: alunoTable.nomeCompleto,
              alunoEmail: alunoTable.emailInstitucional,
              alunoMatricula: alunoTable.matricula,
              alunoCr: alunoTable.cr,
            })
            .from(inscricaoTable)
            .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
            .where(eq(inscricaoTable.projetoId, projetoId))
            .orderBy(inscricaoTable.createdAt);

          // Processar avaliações existentes do feedback
          const candidatosComAvaliacao = inscricoes.map((inscricao) => {
            let avaliacao = null;

            if (inscricao.feedbackProfessor) {
              try {
                const feedback = JSON.parse(inscricao.feedbackProfessor);
                if (feedback.criterios) {
                  avaliacao = {
                    criterios: feedback.criterios,
                    notaFinal: feedback.notaFinal || 0,
                    observacoes: feedback.observacoes,
                    dataAvaliacao: feedback.dataAvaliacao,
                  };
                }
              } catch (error) {
                log.warn(
                  { inscricaoId: inscricao.inscricaoId },
                  'Erro ao parsear feedback',
                );
              }
            }

            return {
              inscricaoId: inscricao.inscricaoId,
              tipoVagaPretendida: inscricao.tipoVagaPretendida,
              status: inscricao.status,
              aluno: {
                id: inscricao.alunoId,
                nome: inscricao.alunoNome,
                email: inscricao.alunoEmail,
                matricula: inscricao.alunoMatricula,
                cr: inscricao.alunoCr,
              },
              avaliacao,
              dataInscricao: inscricao.createdAt,
            };
          });

          // Estatísticas do processo de seleção
          const estatisticas = {
            totalCandidatos: candidatosComAvaliacao.length,
            candidatosBolsista: candidatosComAvaliacao.filter(
              (c) =>
                c.tipoVagaPretendida === 'BOLSISTA' ||
                c.tipoVagaPretendida === 'ANY',
            ).length,
            candidatosVoluntario: candidatosComAvaliacao.filter(
              (c) =>
                c.tipoVagaPretendida === 'VOLUNTARIO' ||
                c.tipoVagaPretendida === 'ANY',
            ).length,
            avaliados: candidatosComAvaliacao.filter((c) => c.avaliacao).length,
            selecionados: candidatosComAvaliacao.filter((c) =>
              c.status.includes('SELECTED'),
            ).length,
            vagasDisponiveis: {
              bolsistas: projeto.bolsasDisponibilizadas || 0,
              voluntarios: projeto.voluntariosSolicitados || 0,
            },
          };

          log.info(
            { projetoId, totalCandidatos: estatisticas.totalCandidatos },
            'Processo de seleção consultado',
          );

          return json({
            projeto: {
              id: projeto.id,
              titulo: projeto.titulo,
              status: projeto.status,
              vagasDisponiveis: estatisticas.vagasDisponiveis,
            },
            candidatos: candidatosComAvaliacao,
            estatisticas,
          });
        } catch (error) {
          log.error(error, 'Erro ao buscar processo de seleção');
          return json(
            { error: 'Erro ao buscar processo de seleção' },
            { status: 500 },
          );
        }
      }),
    ),
  ),

  // POST: Salvar avaliações em lote
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
          const { avaliacoes, autoCalcularNota } =
            bulkEvaluationSchema.parse(body);

          // Verificar permissões (mesmo código da função GET)
          const projeto = await db.query.projetoTable.findFirst({
            where: eq(projetoTable.id, projetoId),
          });

          if (!projeto) {
            return json({ error: 'Projeto não encontrado' }, { status: 404 });
          }

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

          // Processar cada avaliação
          const resultados = [];
          for (const avaliacao of avaliacoes) {
            const notaFinal = autoCalcularNota
              ? calcularNotaFinal(avaliacao.criterios)
              : avaliacao.notaFinal;

            const feedbackData = {
              criterios: avaliacao.criterios,
              notaFinal,
              observacoes: avaliacao.observacoes,
              prioridade: avaliacao.prioridade,
              dataAvaliacao: new Date().toISOString(),
              avaliadoPor: userId,
            };

            // Atualizar inscrição
            const [inscricaoAtualizada] = await db
              .update(inscricaoTable)
              .set({
                feedbackProfessor: JSON.stringify(feedbackData),
                status:
                  avaliacao.status === 'SELECIONADO'
                    ? 'SELECTED_BOLSISTA' // Pode ser ajustado baseado no tipo de vaga
                    : avaliacao.status === 'REJEITADO'
                      ? 'REJECTED_BY_PROFESSOR'
                      : 'SUBMITTED',
                updatedAt: new Date(),
              })
              .where(eq(inscricaoTable.id, avaliacao.inscricaoId))
              .returning();

            resultados.push({
              inscricaoId: avaliacao.inscricaoId,
              notaFinal,
              status: avaliacao.status,
            });
          }

          log.info(
            { projetoId, avaliacoesProcessadas: resultados.length },
            'Avaliações salvas em lote',
          );

          return json({
            success: true,
            message: `${resultados.length} avaliações processadas com sucesso`,
            resultados,
          });
        } catch (error) {
          if (error instanceof z.ZodError) {
            return json(
              { error: 'Dados de avaliação inválidos', details: error.errors },
              { status: 400 },
            );
          }

          log.error(error, 'Erro ao salvar avaliações em lote');
          return json({ error: 'Erro ao salvar avaliações' }, { status: 500 });
        }
      }),
    ),
  ),
});
