import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import {
  departamentoTable,
  periodoInscricaoTable,
  professorTable,
  projetoTable,
} from '@/server/db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

export const publicRouter = createTRPCRouter({
  getCurrentPeriods: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/public/current-periods',
        tags: ['public'],
        summary: 'Get current application periods',
        description: 'Get all active application periods that are currently open',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
          ano: z.number(),
          dataInicio: z.date(),
          dataFim: z.date(),
          isActive: z.boolean(),
          daysRemaining: z.number(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const today = new Date()

      const periods = await ctx.db
        .select()
        .from(periodoInscricaoTable)
        .where(
          and(
            lte(periodoInscricaoTable.dataInicio, today),
            gte(periodoInscricaoTable.dataFim, today)
          )
        )

      return periods.map((period) => {
        const daysRemaining = Math.ceil(
          (period.dataFim.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
          id: period.id,
          semestre: period.semestre as 'SEMESTRE_1' | 'SEMESTRE_2',
          ano: period.ano,
          dataInicio: period.dataInicio,
          dataFim: period.dataFim,
          isActive: true,
          daysRemaining: Math.max(0, daysRemaining),
        }
      })
    }),

  getPublicProjects: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/public/projects',
        tags: ['public'],
        summary: 'Get public projects',
        description: 'Get approved projects available for applications',
      },
    })
    .input(
      z.object({
        departamentoId: z.number().optional(),
        ano: z.number().optional(),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .output(
      z.object({
        projects: z.array(
          z.object({
            id: z.number(),
            titulo: z.string(),
            descricao: z.string(),
            ano: z.number(),
            semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
            bolsasDisponibilizadas: z.number().nullable(),
            cargaHorariaSemana: z.number(),
            numeroSemanas: z.number(),
            publicoAlvo: z.string(),
            professor: z.object({
              nomeCompleto: z.string(),
              departamento: z.object({
                nome: z.string(),
                sigla: z.string().nullable(),
              }),
            }),
          })
        ),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(projetoTable.status, 'APPROVED')]

      if (input.departamentoId) {
        conditions.push(eq(projetoTable.departamentoId, input.departamentoId))
      }

      if (input.ano) {
        conditions.push(eq(projetoTable.ano, input.ano))
      }

      if (input.semestre) {
        conditions.push(eq(projetoTable.semestre, input.semestre))
      }

      const projects = await ctx.db
        .select({
          projeto: projetoTable,
          professor: professorTable,
          departamento: departamentoTable,
        })
        .from(projetoTable)
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset)

      const total = await ctx.db
        .select({ count: projetoTable.id })
        .from(projetoTable)
        .where(and(...conditions))

      return {
        projects: projects.map((p) => ({
          id: p.projeto.id,
          titulo: p.projeto.titulo,
          descricao: p.projeto.descricao,
          ano: p.projeto.ano,
          semestre: p.projeto.semestre as 'SEMESTRE_1' | 'SEMESTRE_2',
          bolsasDisponibilizadas: p.projeto.bolsasDisponibilizadas,
          cargaHorariaSemana: p.projeto.cargaHorariaSemana,
          numeroSemanas: p.projeto.numeroSemanas,
          publicoAlvo: p.projeto.publicoAlvo,
          professor: {
            nomeCompleto: p.professor.nomeCompleto,
            departamento: {
              nome: p.departamento.nome,
              sigla: p.departamento.sigla,
            },
          },
        })),
        total: total.length,
      }
    }),

  getProjectDetails: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/public/projects/{id}',
        tags: ['public'],
        summary: 'Get project details',
        description: 'Get detailed information about a specific project',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z
        .object({
          id: z.number(),
          titulo: z.string(),
          descricao: z.string(),
          ano: z.number(),
          semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
          tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA']),
          bolsasSolicitadas: z.number(),
          voluntariosSolicitados: z.number(),
          bolsasDisponibilizadas: z.number().nullable(),
          cargaHorariaSemana: z.number(),
          numeroSemanas: z.number(),
          publicoAlvo: z.string(),
          estimativaPessoasBenificiadas: z.number().nullable(),
          professor: z.object({
            nomeCompleto: z.string(),
            departamento: z.object({
              nome: z.string(),
              sigla: z.string().nullable(),
              unidadeUniversitaria: z.string(),
            }),
          }),
          canApply: z.boolean(),
          applicationDeadline: z.date().nullable(),
        })
        .nullable()
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          projeto: projetoTable,
          professor: professorTable,
          departamento: departamentoTable,
        })
        .from(projetoTable)
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(
          and(
            eq(projetoTable.id, input.id),
            eq(projetoTable.status, 'APPROVED')
          )
        )
        .limit(1)

      if (!result[0]) {
        return null
      }

      const { projeto, professor, departamento } = result[0]

      const today = new Date()
      const activePeriod = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(
          lte(periodoInscricaoTable.dataInicio, today),
          gte(periodoInscricaoTable.dataFim, today),
          eq(periodoInscricaoTable.ano, projeto.ano),
          eq(periodoInscricaoTable.semestre, projeto.semestre)
        ),
      })

      return {
        id: projeto.id,
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        ano: projeto.ano,
        semestre: projeto.semestre as 'SEMESTRE_1' | 'SEMESTRE_2',
        tipoProposicao: projeto.tipoProposicao as 'INDIVIDUAL' | 'COLETIVA',
        bolsasSolicitadas: projeto.bolsasSolicitadas,
        voluntariosSolicitados: projeto.voluntariosSolicitados,
        bolsasDisponibilizadas: projeto.bolsasDisponibilizadas,
        cargaHorariaSemana: projeto.cargaHorariaSemana,
        numeroSemanas: projeto.numeroSemanas,
        publicoAlvo: projeto.publicoAlvo,
        estimativaPessoasBenificiadas: projeto.estimativaPessoasBenificiadas,
        professor: {
          nomeCompleto: professor.nomeCompleto,
          departamento: {
            nome: departamento.nome,
            sigla: departamento.sigla,
            unidadeUniversitaria: departamento.unidadeUniversitaria,
          },
        },
        canApply: !!activePeriod,
        applicationDeadline: activePeriod?.dataFim ?? null,
      }
    }),

  getDepartments: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/public/departments',
        tags: ['public'],
        summary: 'Get all departments',
        description: 'Get list of all departments for filtering',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          nome: z.string(),
          sigla: z.string().nullable(),
          unidadeUniversitaria: z.string(),
          projectCount: z.number(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const departments = await ctx.db.select().from(departamentoTable)

      const departmentsWithCounts = await Promise.all(
        departments.map(async (dept) => {
          const projectCount = await ctx.db
            .select({ count: projetoTable.id })
            .from(projetoTable)
            .where(and(eq(projetoTable.departamentoId, dept.id), eq(projetoTable.status, "APPROVED")))

          return {
            id: dept.id,
            nome: dept.nome,
            sigla: dept.sigla,
            unidadeUniversitaria: dept.unidadeUniversitaria,
            projectCount: projectCount.length,
          }
        })
      )

      return departmentsWithCounts
    }),

  getSystemStats: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/public/stats',
        tags: ['public'],
        summary: 'Get system statistics',
        description: 'Get public statistics about the monitoring system',
      },
    })
    .input(z.void())
    .output(
      z.object({
        totalProjects: z.number(),
        totalApprovedProjects: z.number(),
        totalDepartments: z.number(),
        totalProfessors: z.number(),
        currentPeriods: z.number(),
        availableScholarships: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      const [
        totalProjects,
        approvedProjects,
        departments,
        professors,
        activePeriods,
        scholarships,
      ] = await Promise.all([
        ctx.db.select({ count: projetoTable.id }).from(projetoTable),
        ctx.db.select({ count: projetoTable.id }).from(projetoTable).where(eq(projetoTable.status, "APPROVED")),
        ctx.db.select({ count: departamentoTable.id }).from(departamentoTable),
        ctx.db.select({ count: professorTable.id }).from(professorTable),
        ctx.db
          .select({ count: periodoInscricaoTable.id })
          .from(periodoInscricaoTable)
          .where(and(lte(periodoInscricaoTable.dataInicio, new Date()), gte(periodoInscricaoTable.dataFim, new Date()))),
        ctx.db.select({ sum: projetoTable.bolsasDisponibilizadas }).from(projetoTable).where(eq(projetoTable.status, "APPROVED")),
      ])

      const totalScholarships = scholarships.reduce((sum, item) => sum + (item.sum || 0), 0)

      return {
        totalProjects: totalProjects.length,
        totalApprovedProjects: approvedProjects.length,
        totalDepartments: departments.length,
        totalProfessors: professors.length,
        currentPeriods: activePeriods.length,
        availableScholarships: totalScholarships,
      }
    }),

  healthCheck: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/public/health',
        tags: ['public'],
        summary: 'Health check',
        description: 'Check if the API is running and healthy',
      },
    })
    .input(z.void())
    .output(
      z.object({
        status: z.literal('ok'),
        timestamp: z.date(),
        version: z.string(),
        uptime: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      const startTime = Date.now()

      try {
        await ctx.db.select({ test: departamentoTable.id }).from(departamentoTable).limit(1)
      } catch (error) {
        console.error("Database health check failed:", error)
        throw new Error("Database connection failed")
      }

      return {
        status: 'ok' as const,
        timestamp: new Date(),
        version: '1.0.0',
        uptime: Date.now() - startTime,
      }
    }),
}) 