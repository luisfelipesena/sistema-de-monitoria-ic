import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import {
  alunoTable,
  cursoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoTable,
  vagaTable,
} from '@/server/db/schema'
import { DashboardMetrics, dashboardMetricsSchema } from '@/types'
import { logger } from '@/utils/logger'
import { sendPlanilhaPROGRADEmail } from '@/server/lib/email-service'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import { z } from 'zod'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { PlanilhaPROGRAD } from '@/components/features/prograd/PlanilhaPROGRAD'

const log = logger.child({ context: 'AnalyticsRouter' })

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
        const [periodosAtivosResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(periodoInscricaoTable)
          .where(and(lte(periodoInscricaoTable.dataInicio, now), gte(periodoInscricaoTable.dataFim, now)))

        // 2. Estatísticas de projetos
        const [totalProjetosResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .where(isNull(projetoTable.deletedAt))

        const [projetosAprovadosResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .where(and(eq(projetoTable.status, 'APPROVED'), isNull(projetoTable.deletedAt)))

        const [projetosSubmitedResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .where(and(eq(projetoTable.status, 'SUBMITTED'), isNull(projetoTable.deletedAt)))

        const [projetosRascunhoResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .where(and(eq(projetoTable.status, 'DRAFT'), isNull(projetoTable.deletedAt)))

        // 3. Estatísticas de inscrições
        const [totalInscricoesResult] = await ctx.db.select({ count: sql<number>`count(*)::int` }).from(inscricaoTable)

        // 4. Estatísticas de usuários
        const [totalAlunosResult] = await ctx.db.select({ count: sql<number>`count(*)::int` }).from(alunoTable)

        const [totalProfessoresResult] = await ctx.db.select({ count: sql<number>`count(*)::int` }).from(professorTable)

        const [totalDepartamentosResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(departamentoTable)

        const [totalCursosResult] = await ctx.db.select({ count: sql<number>`count(*)::int` }).from(cursoTable)

        const [totalDisciplinasResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(disciplinaTable)
          .where(isNull(disciplinaTable.deletedAt))

        // 5. Estatísticas de vagas
        const [totalVagasResult] = await ctx.db
          .select({
            bolsas: sql<number>`coalesce(sum(${projetoTable.bolsasDisponibilizadas}), 0)::int`,
            voluntarios: sql<number>`coalesce(sum(${projetoTable.voluntariosSolicitados}), 0)::int`,
          })
          .from(projetoTable)
          .where(and(eq(projetoTable.status, 'APPROVED'), isNull(projetoTable.deletedAt)))

        const [vagasOcupadasResult] = await ctx.db.select({ count: sql<number>`count(*)::int` }).from(vagaTable)

        // 6. Projetos por departamento
        const projetosPorDepartamento = await ctx.db
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
        const inscricoesPorPeriodo = await ctx.db
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
        const alunosPorCurso = await ctx.db
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
        const professoresPorDepartamento = await ctx.db
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

        // 10. Projetos com disciplinas para últimos projetos aprovados
        const projetosComDisciplinas = await ctx.db
          .select({
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            status: projetoTable.status,
            createdAt: projetoTable.createdAt,
            professorResponsavelNome: professorTable.nomeCompleto,
            departamentoNome: departamentoTable.nome,
          })
          .from(projetoTable)
          .leftJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
          .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .where(isNull(projetoTable.deletedAt))
          .orderBy(desc(projetoTable.createdAt))

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
          totalBolsas: Number(totalVagasResult?.bolsas || 0),
          totalVoluntarios: Number(totalVagasResult?.voluntarios || 0),
          vagasOcupadas: vagasOcupadasNum,
          taxaAprovacao: Math.round(taxaAprovacao * 100) / 100,

          totalAlunos: Number(totalAlunosResult?.count || 0),
          totalProfessores: Number(totalProfessoresResult?.count || 0),
          totalDepartamentos: Number(totalDepartamentosResult?.count || 0),
          totalCursos: Number(totalCursosResult?.count || 0),
          totalDisciplinas: Number(totalDisciplinasResult?.count || 0),

          departamentos: projetosPorDepartamento.map((item, index) => ({
            id: index + 1, // Using index as ID since we don't have department ID in the result
            nome: item.departamento || 'Sem departamento',
            projetos: Number(item.total),
            professores: professoresPorDepartamento.find((p) => p.departamento === item.departamento)?.professores || 0,
          })),

          ultimosProjetosAprovados: projetosComDisciplinas
            .filter((p) => p.status === 'APPROVED')
            .slice(0, 5)
            .map((p) => ({
              id: p.id,
              titulo: p.titulo,
              professorResponsavel: p.professorResponsavelNome || 'N/A',
              departamento: p.departamentoNome || 'N/A',
              dataAprovacao: p.createdAt,
            })),

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

          alertas: [
            ...(projetosComDisciplinas.filter((p) => p.status === 'DRAFT').length > 5
              ? [
                  {
                    tipo: 'warning' as const,
                    titulo: 'Projetos pendentes',
                    descricao: `${projetosComDisciplinas.filter((p) => p.status === 'DRAFT').length} projetos ainda em rascunho`,
                  },
                ]
              : []),
            ...(taxaOcupacao < 0.3
              ? [
                  {
                    tipo: 'info' as const,
                    titulo: 'Baixa ocupação',
                    descricao: `Taxa de ocupação das vagas está em ${Math.round(taxaOcupacao * 100)}%`,
                  },
                ]
              : []),
          ],
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

  getProjetosAprovadosPROGRAD: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/analytics/planilha-prograd',
        tags: ['analytics'],
        summary: 'Get approved projects for PROGRAD spreadsheet',
        description: 'Get all approved projects for a specific semester to generate PROGRAD spreadsheet',
      },
    })
    .input(
      z.object({
        ano: z.number().min(2020).max(2050),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .output(
      z.object({
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        ano: z.number(),
        projetos: z.array(
          z.object({
            id: z.number(),
            codigo: z.string(),
            disciplinaNome: z.string(),
            professorNome: z.string(),
            professoresParticipantes: z.string(),
            departamentoNome: z.string(),
            tipoProposicao: z.string(),
          })
        ),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso permitido apenas para administradores',
          })
        }

        const projetos = await ctx.db
          .select({
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            disciplinaNome: projetoTable.disciplinaNome,
            professorNome: professorTable.nomeCompleto,
            professoresParticipantes: projetoTable.professoresParticipantes,
            departamentoNome: departamentoTable.nome,
            tipoProposicao: projetoTable.tipoProposicao,
          })
          .from(projetoTable)
          .leftJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
          .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .where(
            and(
              eq(projetoTable.status, 'APPROVED'),
              eq(projetoTable.ano, input.ano),
              eq(projetoTable.semestre, input.semestre),
              isNull(projetoTable.deletedAt)
            )
          )
          .orderBy(departamentoTable.nome, projetoTable.id)

        log.info(
          { ano: input.ano, semestre: input.semestre, totalProjetos: projetos.length },
          'Projetos aprovados para planilha PROGRAD obtidos'
        )

        return {
          semestre: input.semestre,
          ano: input.ano,
          projetos: projetos.map((p) => ({
            id: p.id,
            codigo: p.disciplinaNome || p.titulo || 'N/A',
            disciplinaNome: p.disciplinaNome || p.titulo || '',
            professorNome: p.professorNome || '',
            professoresParticipantes: p.professoresParticipantes || '',
            departamentoNome: p.departamentoNome || '',
            tipoProposicao: p.tipoProposicao || 'INDIVIDUAL',
          })),
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao buscar projetos aprovados para PROGRAD')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno ao buscar projetos',
        })
      }
    }),

  sendPlanilhaPROGRAD: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/analytics/send-planilha-prograd',
        tags: ['analytics'],
        summary: 'Send PROGRAD spreadsheet via email',
        description: 'Generate and send the PROGRAD spreadsheet PDF via email',
      },
    })
    .input(
      z.object({
        ano: z.number().min(2020).max(2050),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        progradEmail: z.string().email('Email inválido'),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        totalProjetos: z.number(),
        progradEmail: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso permitido apenas para administradores',
          })
        }

        // Get approved projects data
        const projetos = await ctx.db
          .select({
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            disciplinaNome: projetoTable.disciplinaNome,
            professorNome: professorTable.nomeCompleto,
            professoresParticipantes: projetoTable.professoresParticipantes,
            departamentoNome: departamentoTable.nome,
            tipoProposicao: projetoTable.tipoProposicao,
          })
          .from(projetoTable)
          .leftJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
          .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
          .where(
            and(
              eq(projetoTable.status, 'APPROVED'),
              eq(projetoTable.ano, input.ano),
              eq(projetoTable.semestre, input.semestre),
              isNull(projetoTable.deletedAt)
            )
          )
          .orderBy(departamentoTable.nome, projetoTable.id)

        if (projetos.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nenhum projeto aprovado encontrado para o período especificado',
          })
        }

        // Prepare data for PDF generation
        const planilhaData = {
          semestre: input.semestre,
          ano: input.ano,
          projetos: projetos.map((p) => ({
            id: p.id,
            codigo: p.disciplinaNome || p.titulo || 'N/A',
            disciplinaNome: p.disciplinaNome || p.titulo || '',
            professorNome: p.professorNome || '',
            professoresParticipantes: p.professoresParticipantes || '',
            departamentoNome: p.departamentoNome || '',
            tipoProposicao: p.tipoProposicao || 'INDIVIDUAL',
          })),
        }

        // Generate PDF buffer
        const pdfBuffer = await renderToBuffer(React.createElement(PlanilhaPROGRAD, { data: planilhaData }) as any)

        // Send email with PDF attachment
        await sendPlanilhaPROGRADEmail({
          progradEmail: input.progradEmail,
          planilhaPDFBuffer: pdfBuffer,
          semestre: input.semestre,
          ano: input.ano,
          remetenteUserId: ctx.user.id,
        })

        log.info(
          {
            progradEmail: input.progradEmail,
            ano: input.ano,
            semestre: input.semestre,
            totalProjetos: projetos.length,
          },
          'Planilha PROGRAD enviada por email com sucesso'
        )

        return {
          success: true,
          message: 'Planilha PROGRAD enviada com sucesso',
          totalProjetos: projetos.length,
          progradEmail: input.progradEmail,
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Erro ao enviar planilha PROGRAD por email')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno ao enviar planilha',
        })
      }
    }),
})
