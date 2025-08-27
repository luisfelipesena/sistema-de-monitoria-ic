import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import {
  alunoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  vagaTable,
} from '@/server/db/schema'
import { SELECTED_BOLSISTA, SELECTED_VOLUNTARIO } from '@/types'
import { and, count, desc, eq, sum } from 'drizzle-orm'
import { z } from 'zod'

export const scholarshipAllocationRouter = createTRPCRouter({
  getApprovedProjects: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input, ctx }) => {
      const projetos = await ctx.db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          bolsasSolicitadas: projetoTable.bolsasSolicitadas,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          professorResponsavel: {
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
            emailInstitucional: professorTable.emailInstitucional,
          },
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(projetoTable)
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(
          and(
            eq(projetoTable.status, 'APPROVED'),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre)
          )
        )
        .orderBy(desc(projetoTable.titulo))

      // Get disciplines for each project
      const projetosWithDisciplinas = await Promise.all(
        projetos.map(async (projeto) => {
          const disciplinas = await ctx.db
            .select({
              id: disciplinaTable.id,
              codigo: disciplinaTable.codigo,
              nome: disciplinaTable.nome,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, projeto.id))

          // Get current allocations
          const bolsasAlocadas = await ctx.db
            .select({ count: count() })
            .from(vagaTable)
            .where(and(eq(vagaTable.projetoId, projeto.id), eq(vagaTable.tipo, 'BOLSISTA')))

          return {
            ...projeto,
            disciplinas,
            bolsasAlocadas: bolsasAlocadas[0]?.count || 0,
          }
        })
      )

      return projetosWithDisciplinas
    }),

  updateScholarshipAllocation: adminProtectedProcedure
    .input(
      z.object({
        projetoId: z.number(),
        bolsasDisponibilizadas: z.number().int().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(projetoTable)
        .set({
          bolsasDisponibilizadas: input.bolsasDisponibilizadas,
        })
        .where(eq(projetoTable.id, input.projetoId))

      return { success: true }
    }),

  bulkUpdateAllocations: adminProtectedProcedure
    .input(
      z.object({
        allocations: z.array(
          z.object({
            projetoId: z.number(),
            bolsasDisponibilizadas: z.number().int().min(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await Promise.all(
        input.allocations.map(async (allocation) => {
          await ctx.db
            .update(projetoTable)
            .set({
              bolsasDisponibilizadas: allocation.bolsasDisponibilizadas,
            })
            .where(eq(projetoTable.id, allocation.projetoId))
        })
      )

      return { success: true }
    }),

  getAllocationSummary: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input, ctx }) => {
      // Get totals for approved projects
      const summary = await ctx.db
        .select({
          totalProjetos: count(),
          totalBolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          totalBolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
          totalVoluntariosSolicitados: sum(projetoTable.voluntariosSolicitados),
        })
        .from(projetoTable)
        .where(
          and(
            eq(projetoTable.status, 'APPROVED'),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre)
          )
        )

      // Get allocation by department
      const departmentSummary = await ctx.db
        .select({
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
          projetos: count(),
          bolsasSolicitadas: sum(projetoTable.bolsasSolicitadas),
          bolsasDisponibilizadas: sum(projetoTable.bolsasDisponibilizadas),
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(
          and(
            eq(projetoTable.status, 'APPROVED'),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre)
          )
        )
        .groupBy(departamentoTable.id, departamentoTable.nome, departamentoTable.sigla)

      return {
        summary: summary[0] || {
          totalProjetos: 0,
          totalBolsasSolicitadas: 0,
          totalBolsasDisponibilizadas: 0,
          totalVoluntariosSolicitados: 0,
        },
        departmentSummary: departmentSummary.map((dept) => ({
          departamento: dept.departamento,
          projetos: dept.projetos,
          bolsasSolicitadas: Number(dept.bolsasSolicitadas) || 0,
          bolsasDisponibilizadas: Number(dept.bolsasDisponibilizadas) || 0,
        })),
      }
    }),

  getCandidatesForProject: adminProtectedProcedure
    .input(z.object({ projetoId: z.number() }))
    .query(async ({ input, ctx }) => {
      const candidates = await ctx.db
        .select({
          id: inscricaoTable.id,
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            emailInstitucional: alunoTable.emailInstitucional,
            matricula: alunoTable.matricula,
            cr: alunoTable.cr,
          },
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          status: inscricaoTable.status,
          notaFinal: inscricaoTable.notaFinal,
          notaDisciplina: inscricaoTable.notaDisciplina,
          notaSelecao: inscricaoTable.notaSelecao,
          coeficienteRendimento: inscricaoTable.coeficienteRendimento,
        })
        .from(inscricaoTable)
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .where(and(eq(inscricaoTable.projetoId, input.projetoId), eq(inscricaoTable.status, 'SUBMITTED')))
        .orderBy(desc(inscricaoTable.notaFinal))

      return candidates
    }),

  allocateScholarshipToCandidate: adminProtectedProcedure
    .input(
      z.object({
        inscricaoId: z.number(),
        tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Update inscription status
      const statusMap = {
        BOLSISTA: SELECTED_BOLSISTA,
        VOLUNTARIO: SELECTED_VOLUNTARIO,
      }

      await ctx.db
        .update(inscricaoTable)
        .set({
          status: statusMap[input.tipo],
        })
        .where(eq(inscricaoTable.id, input.inscricaoId))

      // Get inscription details to create vaga
      const inscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.id, input.inscricaoId),
      })

      if (!inscricao) {
        throw new Error('Inscrição não encontrada')
      }

      // Create vaga record
      await ctx.db.insert(vagaTable).values({
        alunoId: inscricao.alunoId,
        projetoId: inscricao.projetoId,
        inscricaoId: inscricao.id,
        tipo: input.tipo,
      })

      return { success: true }
    }),
})
