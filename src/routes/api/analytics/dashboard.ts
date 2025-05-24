import { db } from '@/server/database';
import {
  inscricaoTable,
  periodoInscricaoTable,
  projetoTable,
  vagaTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'AnalyticsDashboardAPI',
});

const dashboardMetricsSchema = z.object({
  periodosAtivos: z.number(),
  totalProjetos: z.number(),
  projetosAprovados: z.number(),
  projetosSubmetidos: z.number(),
  projetosRascunho: z.number(),
  totalInscricoes: z.number(),
  totalVagas: z.number(),
  vagasOcupadas: z.number(),
  taxaAprovacao: z.number(),
  projetosPorDepartamento: z.array(
    z.object({
      departamento: z.string(),
      total: z.number(),
      aprovados: z.number(),
    }),
  ),
  inscricoesPorPeriodo: z.array(
    z.object({
      periodo: z.string(),
      inscricoes: z.number(),
      projetos: z.number(),
    }),
  ),
  estatisticasVagas: z.object({
    bolsistas: z.number(),
    voluntarios: z.number(),
    totalDisponibilizadas: z.number(),
  }),
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

export const APIRoute = createAPIFileRoute('/api/analytics/dashboard')({
  GET: createAPIHandler(
    withAuthMiddleware(
      withRoleMiddleware(['admin'], async (ctx) => {
        try {
          const now = new Date();

          // 1. Contar períodos ativos
          const periodosAtivos = await db
            .select({ count: sql<number>`count(*)` })
            .from(periodoInscricaoTable)
            .where(
              sql`${periodoInscricaoTable.dataInicio} <= ${now} AND ${periodoInscricaoTable.dataFim} >= ${now}`,
            );

          // 2. Estatísticas de projetos
          const totalProjetos = await db
            .select({ count: sql<number>`count(*)` })
            .from(projetoTable);

          const projetosAprovados = await db
            .select({ count: sql<number>`count(*)` })
            .from(projetoTable)
            .where(eq(projetoTable.status, 'APPROVED'));

          const projetosSubmetidos = await db
            .select({ count: sql<number>`count(*)` })
            .from(projetoTable)
            .where(eq(projetoTable.status, 'SUBMITTED'));

          const projetosRascunho = await db
            .select({ count: sql<number>`count(*)` })
            .from(projetoTable)
            .where(eq(projetoTable.status, 'DRAFT'));

          // 3. Estatísticas de inscrições
          const totalInscricoes = await db
            .select({ count: sql<number>`count(*)` })
            .from(inscricaoTable);

          // 4. Estatísticas de vagas
          const totalVagas = await db
            .select({
              bolsas: sql<number>`sum(${projetoTable.bolsasDisponibilizadas})`,
              voluntarios: sql<number>`sum(${projetoTable.voluntariosSolicitados})`,
            })
            .from(projetoTable)
            .where(eq(projetoTable.status, 'APPROVED'));

          const vagasOcupadas = await db
            .select({ count: sql<number>`count(*)` })
            .from(vagaTable);

          // 5. Projetos por departamento (consulta simplificada)
          const projetosPorDepartamento = await db
            .select({
              departamento: sql<string>`'DCC'`, // Simplificado por enquanto
              total: sql<number>`count(*)`,
              aprovados: sql<number>`sum(case when ${projetoTable.status} = 'APPROVED' then 1 else 0 end)`,
            })
            .from(projetoTable)
            .groupBy(sql`1`);

          // 6. Inscrições por período (simplificado)
          const inscricoesPorPeriodo = await db
            .select({
              periodo: sql<string>`${periodoInscricaoTable.ano} || '.' || ${periodoInscricaoTable.semestre}`,
              inscricoes: sql<number>`count(${inscricaoTable.id})`,
              projetos: sql<number>`0`, // Simplificado
            })
            .from(periodoInscricaoTable)
            .leftJoin(
              inscricaoTable,
              eq(inscricaoTable.periodoInscricaoId, periodoInscricaoTable.id),
            )
            .groupBy(periodoInscricaoTable.ano, periodoInscricaoTable.semestre)
            .orderBy(
              sql`${periodoInscricaoTable.ano} desc, ${periodoInscricaoTable.semestre} desc`,
            )
            .limit(6);

          // Calcular taxa de aprovação
          const totalProjetosNum = Number(totalProjetos[0]?.count || 0);
          const aprovadosNum = Number(projetosAprovados[0]?.count || 0);
          const taxaAprovacao =
            totalProjetosNum > 0 ? (aprovadosNum / totalProjetosNum) * 100 : 0;

          // Montar resposta
          const metrics: DashboardMetrics = {
            periodosAtivos: Number(periodosAtivos[0]?.count || 0),
            totalProjetos: totalProjetosNum,
            projetosAprovados: aprovadosNum,
            projetosSubmetidos: Number(projetosSubmetidos[0]?.count || 0),
            projetosRascunho: Number(projetosRascunho[0]?.count || 0),
            totalInscricoes: Number(totalInscricoes[0]?.count || 0),
            totalVagas:
              Number(totalVagas[0]?.bolsas || 0) +
              Number(totalVagas[0]?.voluntarios || 0),
            vagasOcupadas: Number(vagasOcupadas[0]?.count || 0),
            taxaAprovacao: Math.round(taxaAprovacao * 100) / 100,
            projetosPorDepartamento: projetosPorDepartamento.map((item) => ({
              departamento: item.departamento || 'Não especificado',
              total: Number(item.total),
              aprovados: Number(item.aprovados),
            })),
            inscricoesPorPeriodo: inscricoesPorPeriodo.map((item) => ({
              periodo: item.periodo.replace('SEMESTRE_', ''),
              inscricoes: Number(item.inscricoes),
              projetos: Number(item.projetos),
            })),
            estatisticasVagas: {
              bolsistas: Number(totalVagas[0]?.bolsas || 0),
              voluntarios: Number(totalVagas[0]?.voluntarios || 0),
              totalDisponibilizadas:
                Number(totalVagas[0]?.bolsas || 0) +
                Number(totalVagas[0]?.voluntarios || 0),
            },
          };

          const validatedMetrics = dashboardMetricsSchema.parse(metrics);

          log.info(
            { metrics: validatedMetrics },
            'Métricas do dashboard calculadas',
          );

          return json(validatedMetrics, { status: 200 });
        } catch (error) {
          log.error(error, 'Erro ao calcular métricas do dashboard');
          return json({ error: 'Erro ao calcular métricas' }, { status: 500 });
        }
      }),
    ),
  ),
});
