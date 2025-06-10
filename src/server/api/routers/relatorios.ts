import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import {
  alunoTable,
  cursoTable,
  departamentoTable,
  inscricaoTable,
  professorTable,
  projetoTable,
} from "@/server/db/schema"
import { ProjetoStatus, StatusInscricao, UserRole } from "@/types/enums"
import { and, count, eq, sum } from "drizzle-orm"
import { z } from "zod"

export const relatoriosRouter = createTRPCRouter({
  getDashboardAnalytics: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/relatorios/dashboard-analytics',
        tags: ['reports'],
        summary: 'Get dashboard analytics',
        description: 'Get comprehensive analytics for admin dashboard',
      },
    })
    .input(
      z.object({
        userRole: z.nativeEnum(UserRole),
        ano: z.number().optional(),
        semestre: z.enum(["SEMESTRE_1", "SEMESTRE_2"]).optional(),
      })
    )
    .output(
      z.object({
        totalProjects: z.number(),
        approvedProjects: z.number(),
        pendingProjects: z.number(),
        rejectedProjects: z.number(),
        totalProfessors: z.number(),
        totalStudents: z.number(),
        totalInscricoes: z.number(),
        approvedInscricoes: z.number(),
        totalBolsas: z.number(),
        bolsasOcupadas: z.number(),
        projectsByStatus: z.record(z.string(), z.number()),
        projectsByDepartment: z.array(
          z.object({
            departamento: z.string(),
            total: z.number(),
            approved: z.number(),
          })
        ),
        inscricoesByStatus: z.record(z.string(), z.number()),
        monthlyTrends: z.array(
          z.object({
            month: z.string(),
            projects: z.number(),
            inscricoes: z.number(),
          })
        ),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = []

      if (input.ano) {
        conditions.push(eq(projetoTable.ano, input.ano))
      }

      if (input.semestre) {
        conditions.push(eq(projetoTable.semestre, input.semestre))
      }

      const [
        totalProjects,
        approvedProjects,
        pendingProjects,
        rejectedProjects,
        totalProfessors,
        totalStudents,
        totalInscricoes,
        approvedInscricoes,
        bolsasData,
      ] = await Promise.all([
        ctx.db.select({ count: count() }).from(projetoTable).where(conditions.length > 0 ? and(...conditions) : undefined),
        ctx.db.select({ count: count() }).from(projetoTable).where(and(eq(projetoTable.status, ProjetoStatus.APPROVED), ...conditions)),
        ctx.db.select({ count: count() }).from(projetoTable).where(and(eq(projetoTable.status, ProjetoStatus.SUBMITTED), ...conditions)),
        ctx.db.select({ count: count() }).from(projetoTable).where(and(eq(projetoTable.status, ProjetoStatus.REJECTED), ...conditions)),
        ctx.db.select({ count: count() }).from(professorTable),
        ctx.db.select({ count: count() }).from(alunoTable),
        ctx.db.select({ count: count() }).from(inscricaoTable),
        ctx.db.select({ count: count() }).from(inscricaoTable).where(eq(inscricaoTable.status, StatusInscricao.ACCEPTED_BOLSISTA)),
        ctx.db
          .select({
            total: sum(projetoTable.bolsasDisponibilizadas).mapWith(Number),
            ocupadas: count(inscricaoTable.id),
          })
          .from(projetoTable)
          .leftJoin(
            inscricaoTable,
            and(eq(projetoTable.id, inscricaoTable.projetoId), eq(inscricaoTable.status, StatusInscricao.ACCEPTED_BOLSISTA))
          )
          .where(eq(projetoTable.status, ProjetoStatus.APPROVED)),
      ])

      const projectsByStatus = await ctx.db
        .select({
          status: projetoTable.status,
          count: count(),
        })
        .from(projetoTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(projetoTable.status)

      const projectsByDepartment = await ctx.db
        .select({
          departamento: departamentoTable,
          total: count(projetoTable.id),
          approved: count(projetoTable.id),
        })
        .from(departamentoTable)
        .leftJoin(projetoTable, eq(departamentoTable.id, projetoTable.departamentoId))
        .groupBy(departamentoTable.id, departamentoTable.nome)

      const inscricoesByStatus = await ctx.db
        .select({
          status: inscricaoTable.status,
          count: count(),
        })
        .from(inscricaoTable)
        .groupBy(inscricaoTable.status)

      const statusCounts = projectsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item.count
          return acc
        },
        {} as Record<string, number>
      )

      const inscricaoStatusCounts = inscricoesByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item.count
          return acc
        },
        {} as Record<string, number>
      )

      const mockMonthlyTrends = [
        { month: "Jan", projects: 12, inscricoes: 45 },
        { month: "Fev", projects: 15, inscricoes: 52 },
        { month: "Mar", projects: 18, inscricoes: 61 },
        { month: "Abr", projects: 22, inscricoes: 78 },
        { month: "Mai", projects: 25, inscricoes: 89 },
        { month: "Jun", projects: 28, inscricoes: 95 },
      ]

      return {
        totalProjects: totalProjects[0]?.count || 0,
        approvedProjects: approvedProjects[0]?.count || 0,
        pendingProjects: pendingProjects[0]?.count || 0,
        rejectedProjects: rejectedProjects[0]?.count || 0,
        totalProfessors: totalProfessors[0]?.count || 0,
        totalStudents: totalStudents[0]?.count || 0,
        totalInscricoes: totalInscricoes[0]?.count || 0,
        approvedInscricoes: approvedInscricoes[0]?.count || 0,
        totalBolsas: bolsasData[0]?.total || 0,
        bolsasOcupadas: bolsasData[0]?.ocupadas || 0,
        projectsByStatus: statusCounts,
        projectsByDepartment: projectsByDepartment.map((p) => ({
          departamento: p.departamento.nome,
          total: p.total,
          approved: p.approved,
        })),
        inscricoesByStatus: inscricaoStatusCounts,
        monthlyTrends: mockMonthlyTrends,
      }
    }),

  getProjectsReport: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/relatorios/projects',
        tags: ['reports'],
        summary: 'Get projects report',
        description: 'Get detailed report about projects with filters',
      },
    })
    .input(
      z.object({
        ano: z.number().optional(),
        semestre: z.enum(["SEMESTRE_1", "SEMESTRE_2"]).optional(),
        departamentoId: z.number().optional(),
        status: z.nativeEnum(ProjetoStatus).optional(),
        formato: z.enum(["json", "csv"]).default("json"),
      })
    )
    .output(
      z.object({
        projects: z.array(
          z.object({
            id: z.number(),
            titulo: z.string(),
            ano: z.number(),
            semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
            status: z.nativeEnum(ProjetoStatus),
            departamento: z.string(),
            professor: z.string(),
            bolsasSolicitadas: z.number(),
            bolsasDisponibilizadas: z.number().nullable(),
            voluntariosSolicitados: z.number(),
            totalInscricoes: z.number(),
            inscricoesAprovadas: z.number(),
            createdAt: z.date(),
          })
        ),
        total: z.number(),
        filters: z.object({
          ano: z.number().nullable(),
          semestre: z.string().nullable(),
          departamentoId: z.number().nullable(),
          status: z.string().nullable(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = []

      if (input.ano) conditions.push(eq(projetoTable.ano, input.ano))
      if (input.semestre) conditions.push(eq(projetoTable.semestre, input.semestre))
      if (input.departamentoId) conditions.push(eq(projetoTable.departamentoId, input.departamentoId))
      if (input.status) conditions.push(eq(projetoTable.status, input.status))

      const projects = await ctx.db
        .select({
          projeto: projetoTable,
          departamento: departamentoTable,
          professor: professorTable,
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)

      const projectsWithInscricoes = await Promise.all(
        projects.map(async (p) => {
          const [totalInscricoes, inscricoesAprovadas] = await Promise.all([
            ctx.db.select({ count: count() }).from(inscricaoTable).where(eq(inscricaoTable.projetoId, p.projeto.id)),
            ctx.db
              .select({ count: count() })
              .from(inscricaoTable)
              .where(
                and(eq(inscricaoTable.projetoId, p.projeto.id), eq(inscricaoTable.status, StatusInscricao.ACCEPTED_BOLSISTA))
              ),
          ])

          return {
            id: p.projeto.id,
            titulo: p.projeto.titulo,
            ano: p.projeto.ano,
            semestre: p.projeto.semestre as "SEMESTRE_1" | "SEMESTRE_2",
            status: p.projeto.status as ProjetoStatus,
            departamento: p.departamento.nome,
            professor: p.professor.nomeCompleto,
            bolsasSolicitadas: p.projeto.bolsasSolicitadas,
            bolsasDisponibilizadas: p.projeto.bolsasDisponibilizadas,
            voluntariosSolicitados: p.projeto.voluntariosSolicitados,
            totalInscricoes: totalInscricoes[0]?.count || 0,
            inscricoesAprovadas: inscricoesAprovadas[0]?.count || 0,
            createdAt: p.projeto.createdAt,
          }
        })
      )

      return {
        projects: projectsWithInscricoes,
        total: projectsWithInscricoes.length,
        filters: {
          ano: input.ano || null,
          semestre: input.semestre || null,
          departamentoId: input.departamentoId || null,
          status: input.status || null,
        },
      }
    }),

  getInscricoesReport: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/relatorios/inscricoes',
        tags: ['reports'],
        summary: 'Get applications report',
        description: 'Get detailed report about student applications',
      },
    })
    .input(
      z.object({
        periodoInscricaoId: z.number().optional(),
        projetoId: z.number().optional(),
        status: z.nativeEnum(StatusInscricao).optional(),
        cursoId: z.number().optional(),
      })
    )
    .output(
      z.object({
        inscricoes: z.array(
          z.object({
            id: z.number(),
            aluno: z.object({
              nome: z.string(),
              matricula: z.string(),
              curso: z.string(),
              cr: z.number(),
            }),
            projeto: z.object({
              titulo: z.string(),
              professor: z.string(),
              departamento: z.string(),
            }),
            tipoVagaPretendida: z.enum(['BOLSISTA', 'VOLUNTARIO', 'ANY']),
            status: z.nativeEnum(StatusInscricao),
            notaFinal: z.number().nullable(),
            createdAt: z.date(),
          })
        ),
        estatisticas: z.object({
          totalInscricoes: z.number(),
          porStatus: z.record(z.string(), z.number()),
          porCurso: z.record(z.string(), z.number()),
          crMedio: z.number(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = []

      if (input.periodoInscricaoId) conditions.push(eq(inscricaoTable.periodoInscricaoId, input.periodoInscricaoId))
      if (input.projetoId) conditions.push(eq(inscricaoTable.projetoId, input.projetoId))
      if (input.status) conditions.push(eq(inscricaoTable.status, input.status))

      const inscricoes = await ctx.db
        .select({
          inscricao: inscricaoTable,
          aluno: alunoTable,
          projeto: projetoTable,
          professor: professorTable,
          departamento: departamentoTable,
          curso: cursoTable,
        })
        .from(inscricaoTable)
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(cursoTable, eq(alunoTable.cursoId, cursoTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)

      const statusCounts = inscricoes.reduce(
        (acc, inscricao) => {
          const status = inscricao.inscricao.status
          acc[status] = (acc[status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      const cursoCounts = inscricoes.reduce(
        (acc, inscricao) => {
          const curso = inscricao.curso.nome
          acc[curso] = (acc[curso] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      const crMedio = inscricoes.reduce((sum, inscricao) => sum + inscricao.aluno.cr, 0) / (inscricoes.length || 1)

      return {
        inscricoes: inscricoes.map((i) => ({
          id: i.inscricao.id,
          aluno: {
            nome: i.aluno.nomeCompleto,
            matricula: i.aluno.matricula,
            curso: i.curso.nome,
            cr: i.aluno.cr,
          },
          projeto: {
            titulo: i.projeto.titulo,
            professor: i.professor.nomeCompleto,
            departamento: i.departamento.nome,
          },
          tipoVagaPretendida: i.inscricao.tipoVagaPretendida as "BOLSISTA" | "VOLUNTARIO" | "ANY",
          status: i.inscricao.status as StatusInscricao,
          notaFinal: i.inscricao.notaFinal ? Number(i.inscricao.notaFinal) : null,
          createdAt: i.inscricao.createdAt,
        })),
        estatisticas: {
          totalInscricoes: inscricoes.length,
          porStatus: statusCounts,
          porCurso: cursoCounts,
          crMedio: Math.round(crMedio * 100) / 100,
        },
      }
    }),

  getBolsasUtilizacao: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/relatorios/bolsas-utilizacao',
        tags: ['reports'],
        summary: 'Get scholarship utilization report',
        description: 'Get report on scholarship allocation and utilization',
      },
    })
    .input(
      z.object({
        ano: z.number().optional(),
        semestre: z.enum(["SEMESTRE_1", "SEMESTRE_2"]).optional(),
        departamentoId: z.number().optional(),
      })
    )
    .output(
      z.object({
        resumo: z.object({
          totalBolsasDisponibilizadas: z.number(),
          totalBolsasOcupadas: z.number(),
          taxaOcupacao: z.number(),
          totalBolsasSolicitadas: z.number(),
          taxaAprovacao: z.number(),
        }),
        porDepartamento: z.array(
          z.object({
            departamento: z.string(),
            solicitadas: z.number(),
            disponibilizadas: z.number(),
            ocupadas: z.number(),
            taxaOcupacao: z.number(),
          })
        ),
        porProjeto: z.array(
          z.object({
            projetoId: z.number(),
            titulo: z.string(),
            professor: z.string(),
            bolsasSolicitadas: z.number(),
            bolsasDisponibilizadas: z.number(),
            bolsasOcupadas: z.number(),
            candidatosInscritos: z.number(),
          })
        ),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(projetoTable.status, ProjetoStatus.APPROVED)]

      if (input.ano) conditions.push(eq(projetoTable.ano, input.ano))
      if (input.semestre) conditions.push(eq(projetoTable.semestre, input.semestre))
      if (input.departamentoId) conditions.push(eq(projetoTable.departamentoId, input.departamentoId))

      const projetos = await ctx.db
        .select({
          projeto: projetoTable,
          departamento: departamentoTable,
          professor: professorTable,
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(and(...conditions))

      const projetosComEstatisticas = await Promise.all(
        projetos.map(async (p) => {
          const [bolsasOcupadas, candidatos] = await Promise.all([
            ctx.db
              .select({ count: count() })
              .from(inscricaoTable)
              .where(
                and(eq(inscricaoTable.projetoId, p.projeto.id), eq(inscricaoTable.status, StatusInscricao.ACCEPTED_BOLSISTA))
              ),
            ctx.db.select({ count: count() }).from(inscricaoTable).where(eq(inscricaoTable.projetoId, p.projeto.id)),
          ])

          return {
            projetoId: p.projeto.id,
            titulo: p.projeto.titulo,
            professor: p.professor.nomeCompleto,
            departamento: p.departamento.nome,
            bolsasSolicitadas: p.projeto.bolsasSolicitadas,
            bolsasDisponibilizadas: p.projeto.bolsasDisponibilizadas || 0,
            bolsasOcupadas: bolsasOcupadas[0]?.count || 0,
            candidatosInscritos: candidatos[0]?.count || 0,
          }
        })
      )

      const resumo = projetosComEstatisticas.reduce(
        (acc, p) => {
          acc.totalBolsasSolicitadas += p.bolsasSolicitadas
          acc.totalBolsasDisponibilizadas += p.bolsasDisponibilizadas
          acc.totalBolsasOcupadas += p.bolsasOcupadas
          return acc
        },
        {
          totalBolsasSolicitadas: 0,
          totalBolsasDisponibilizadas: 0,
          totalBolsasOcupadas: 0,
        }
      )

      const porDepartamento = Object.values(
        projetosComEstatisticas.reduce(
          (acc, p) => {
            if (!acc[p.departamento]) {
              acc[p.departamento] = {
                departamento: p.departamento,
                solicitadas: 0,
                disponibilizadas: 0,
                ocupadas: 0,
              }
            }
            acc[p.departamento].solicitadas += p.bolsasSolicitadas
            acc[p.departamento].disponibilizadas += p.bolsasDisponibilizadas
            acc[p.departamento].ocupadas += p.bolsasOcupadas
            return acc
          },
          {} as Record<string, any>
        )
      ).map((d: any) => ({
        ...d,
        taxaOcupacao: d.disponibilizadas > 0 ? Math.round((d.ocupadas / d.disponibilizadas) * 100) : 0,
      }))

      return {
        resumo: {
          ...resumo,
          taxaOcupacao:
            resumo.totalBolsasDisponibilizadas > 0
              ? Math.round((resumo.totalBolsasOcupadas / resumo.totalBolsasDisponibilizadas) * 100)
              : 0,
          taxaAprovacao:
            resumo.totalBolsasSolicitadas > 0
              ? Math.round((resumo.totalBolsasDisponibilizadas / resumo.totalBolsasSolicitadas) * 100)
              : 0,
        },
        porDepartamento,
        porProjeto: projetosComEstatisticas,
      }
    }),

  exportarRelatorio: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/relatorios/exportar',
        tags: ['reports'],
        summary: 'Export report',
        description: 'Export a report in specified format',
      },
    })
    .input(
      z.object({
        tipo: z.enum(['projetos', 'inscricoes', 'bolsas', 'dashboard']),
        formato: z.enum(['pdf', 'csv', 'xlsx']),
        filtros: z.record(z.any()).optional(),
        incluirGraficos: z.boolean().default(false),
      })
    )
    .output(
      z.object({
        fileUrl: z.string(),
        fileName: z.string(),
        expiresAt: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `relatorio-${input.tipo}-${timestamp}.${input.formato}`

      console.log(`Generating report: ${fileName} with filters:`, input.filtros)

      const fileUrl = `https://reports.gringo.com/temp/${fileName}`
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      return {
        fileUrl,
        fileName,
        expiresAt,
      }
    }),
})
