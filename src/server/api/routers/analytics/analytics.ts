import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  inscricaoTable,
  periodoInscricaoTable,
  projetoTable,
  vagaTable,
  departamentoTable,
  alunoTable,
  professorTable,
  cursoTable,
  disciplinaTable,
} from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
import { eq, sql, and, isNull, gte, lte, desc } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'AnalyticsRouter' })

const dashboardMetricsSchema = z.object({
  // Estatísticas gerais
  periodosAtivos: z.number(),
  totalProjetos: z.number(),
  projetosAprovados: z.number(),
  projetosSubmetidos: z.number(),
  projetosRascunho: z.number(),
  totalInscricoes: z.number(),
  totalVagas: z.number(),
  vagasOcupadas: z.number(),
  taxaAprovacao: z.number(),

  // Estatísticas de usuários
  totalAlunos: z.number(),
  totalProfessores: z.number(),
  totalDepartamentos: z.number(),
  totalCursos: z.number(),
  totalDisciplinas: z.number(),

  // Distribuições
  projetosPorDepartamento: z.array(
    z.object({
      departamento: z.string(),
      sigla: z.string(),
      total: z.number(),
      aprovados: z.number(),
      submetidos: z.number(),
    })
  ),
  inscricoesPorPeriodo: z.array(
    z.object({
      periodo: z.string(),
      ano: z.number(),
      semestre: z.string(),
      inscricoes: z.number(),
      projetos: z.number(),
    })
  ),
  estatisticasVagas: z.object({
    bolsistas: z.number(),
    voluntarios: z.number(),
    totalDisponibilizadas: z.number(),
    ocupadas: z.number(),
    taxaOcupacao: z.number(),
  }),

  // Indicadores de engajamento
  alunosPorCurso: z.array(
    z.object({
      curso: z.string(),
      alunos: z.number(),
      inscricoes: z.number(),
    })
  ),
  professoresPorDepartamento: z.array(
    z.object({
      departamento: z.string(),
      professores: z.number(),
      projetosAtivos: z.number(),
    })
  ),
})

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>

export const analyticsRouter = createTRPCRouter({
  getDashboard: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/analytics/dashboard',
        tags: ['analytics'],
        summary: 'Get dashboard analytics',
        description: 'Get comprehensive analytics data for admin dashboard',
      },
    })
    .input(z.void())
    .output(dashboardMetricsSchema)
    .query(async ({ ctx }) => {
      try {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso permitido apenas para administradores',
          })
        }

        const now = new Date()

        // 1. Períodos ativos
        const [periodosAtivosResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(periodoInscricaoTable)
          .where(and(lte(periodoInscricaoTable.dataInicio, now), gte(periodoInscricaoTable.dataFim, now)))

        // 2. Estatísticas de projetos
        const [totalProjetosResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .where(isNull(projetoTable.deletedAt))

        const [projetosAprovadosResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .where(and(eq(projetoTable.status, 'APPROVED'), isNull(projetoTable.deletedAt)))

        const [projetosSubmitedResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .where(and(eq(projetoTable.status, 'SUBMITTED'), isNull(projetoTable.deletedAt)))

        const [projetosRascunhoResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .where(and(eq(projetoTable.status, 'DRAFT'), isNull(projetoTable.deletedAt)))

        // 3. Estatísticas de inscrições
        const [totalInscricoesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(inscricaoTable)

        // 4. Estatísticas de usuários
        const [totalAlunosResult] = await db.select({ count: sql<number>`count(*)::int` }).from(alunoTable)

        const [totalProfessoresResult] = await db.select({ count: sql<number>`count(*)::int` }).from(professorTable)

        const [totalDepartamentosResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(departamentoTable)

        const [totalCursosResult] = await db.select({ count: sql<number>`count(*)::int` }).from(cursoTable)

        const [totalDisciplinasResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(disciplinaTable)
          .where(isNull(disciplinaTable.deletedAt))

        // 5. Estatísticas de vagas
        const [totalVagasResult] = await db
          .select({
            bolsas: sql<number>`coalesce(sum(${projetoTable.bolsasDisponibilizadas}), 0)::int`,
            voluntarios: sql<number>`coalesce(sum(${projetoTable.voluntariosSolicitados}), 0)::int`,
          })
          .from(projetoTable)
          .where(and(eq(projetoTable.status, 'APPROVED'), isNull(projetoTable.deletedAt)))

        const [vagasOcupadasResult] = await db.select({ count: sql<number>`count(*)::int` }).from(vagaTable)

        // 6. Projetos por departamento
        const projetosPorDepartamento = await db
          .select({
            departamento: departamentoTable.nome,
            sigla: departamentoTable.sigla,
            total: sql<number>`count(${projetoTable.id})::int`,
            aprovados: sql<number>`sum(case when ${projetoTable.status} = 'APPROVED' then 1 else 0 end)::int`,
            submetidos: sql<number>`sum(case when ${projetoTable.status} = 'SUBMITTED' then 1 else 0 end)::int`,
          })
          .from(departamentoTable)
          .leftJoin(
            projetoTable,
            and(eq(projetoTable.departamentoId, departamentoTable.id), isNull(projetoTable.deletedAt))
          )
          .groupBy(departamentoTable.id, departamentoTable.nome, departamentoTable.sigla)
          .orderBy(sql`count(${projetoTable.id}) desc`)

        // 7. Inscrições por período
        const inscricoesPorPeriodo = await db
          .select({
            periodo: sql<string>`${periodoInscricaoTable.ano} || '.' || ${periodoInscricaoTable.semestre}`,
            ano: periodoInscricaoTable.ano,
            semestre: periodoInscricaoTable.semestre,
            inscricoes: sql<number>`count(${inscricaoTable.id})::int`,
            projetos: sql<number>`count(distinct ${inscricaoTable.projetoId})::int`,
          })
          .from(periodoInscricaoTable)
          .leftJoin(inscricaoTable, eq(inscricaoTable.periodoInscricaoId, periodoInscricaoTable.id))
          .groupBy(periodoInscricaoTable.id, periodoInscricaoTable.ano, periodoInscricaoTable.semestre)
          .orderBy(desc(periodoInscricaoTable.ano), desc(periodoInscricaoTable.semestre))
          .limit(6)

        // 8. Alunos por curso
        const alunosPorCurso = await db
          .select({
            curso: cursoTable.nome,
            alunos: sql<number>`count(${alunoTable.id})::int`,
            inscricoes: sql<number>`count(${inscricaoTable.id})::int`,
          })
          .from(cursoTable)
          .leftJoin(alunoTable, eq(alunoTable.cursoId, cursoTable.id))
          .leftJoin(inscricaoTable, eq(inscricaoTable.alunoId, alunoTable.id))
          .groupBy(cursoTable.id, cursoTable.nome)
          .orderBy(sql`count(${alunoTable.id}) desc`)
          .limit(10)

        // 9. Professores por departamento
        const professoresPorDepartamento = await db
          .select({
            departamento: departamentoTable.nome,
            professores: sql<number>`count(${professorTable.id})::int`,
            projetosAtivos: sql<number>`count(${projetoTable.id})::int`,
          })
          .from(departamentoTable)
          .leftJoin(professorTable, eq(professorTable.departamentoId, departamentoTable.id))
          .leftJoin(
            projetoTable,
            and(
              eq(projetoTable.professorResponsavelId, professorTable.id),
              eq(projetoTable.status, 'APPROVED'),
              isNull(projetoTable.deletedAt)
            )
          )
          .groupBy(departamentoTable.id, departamentoTable.nome)
          .orderBy(sql`count(${professorTable.id}) desc`)

        // Calcular métricas
        const totalProjetosNum = Number(totalProjetosResult?.count || 0)
        const aprovadosNum = Number(projetosAprovadosResult?.count || 0)
        const taxaAprovacao = totalProjetosNum > 0 ? (aprovadosNum / totalProjetosNum) * 100 : 0

        const totalVagasNum = Number(totalVagasResult?.bolsas || 0) + Number(totalVagasResult?.voluntarios || 0)
        const vagasOcupadasNum = Number(vagasOcupadasResult?.count || 0)
        const taxaOcupacao = totalVagasNum > 0 ? (vagasOcupadasNum / totalVagasNum) * 100 : 0

        const metrics: DashboardMetrics = {
          periodosAtivos: Number(periodosAtivosResult?.count || 0),
          totalProjetos: totalProjetosNum,
          projetosAprovados: aprovadosNum,
          projetosSubmetidos: Number(projetosSubmitedResult?.count || 0),
          projetosRascunho: Number(projetosRascunhoResult?.count || 0),
          totalInscricoes: Number(totalInscricoesResult?.count || 0),
          totalVagas: totalVagasNum,
          vagasOcupadas: vagasOcupadasNum,
          taxaAprovacao: Math.round(taxaAprovacao * 100) / 100,

          totalAlunos: Number(totalAlunosResult?.count || 0),
          totalProfessores: Number(totalProfessoresResult?.count || 0),
          totalDepartamentos: Number(totalDepartamentosResult?.count || 0),
          totalCursos: Number(totalCursosResult?.count || 0),
          totalDisciplinas: Number(totalDisciplinasResult?.count || 0),

          projetosPorDepartamento: projetosPorDepartamento.map((item) => ({
            departamento: item.departamento || 'Sem departamento',
            sigla: item.sigla || 'N/A',
            total: Number(item.total),
            aprovados: Number(item.aprovados),
            submetidos: Number(item.submetidos),
          })),

          inscricoesPorPeriodo: inscricoesPorPeriodo.map((item) => ({
            periodo: item.periodo.replace('SEMESTRE_', ''),
            ano: Number(item.ano),
            semestre: item.semestre.replace('SEMESTRE_', ''),
            inscricoes: Number(item.inscricoes),
            projetos: Number(item.projetos),
          })),

          estatisticasVagas: {
            bolsistas: Number(totalVagasResult?.bolsas || 0),
            voluntarios: Number(totalVagasResult?.voluntarios || 0),
            totalDisponibilizadas: totalVagasNum,
            ocupadas: vagasOcupadasNum,
            taxaOcupacao: Math.round(taxaOcupacao * 100) / 100,
          },

          alunosPorCurso: alunosPorCurso.map((item) => ({
            curso: item.curso || 'Curso não especificado',
            alunos: Number(item.alunos),
            inscricoes: Number(item.inscricoes),
          })),

          professoresPorDepartamento: professoresPorDepartamento.map((item) => ({
            departamento: item.departamento || 'Departamento não especificado',
            professores: Number(item.professores),
            projetosAtivos: Number(item.projetosAtivos),
          })),
        }

        log.info({ metrics }, 'Métricas do dashboard calculadas com sucesso')

        return metrics
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao calcular métricas do dashboard')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno ao calcular métricas',
        })
      }
    }),
})
