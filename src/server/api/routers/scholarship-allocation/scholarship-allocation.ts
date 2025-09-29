import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import {
  alunoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  vagaTable,
} from '@/server/db/schema'
import { sendScholarshipAllocationNotification } from '@/server/lib/email-service'
import { SELECTED_BOLSISTA, SELECTED_VOLUNTARIO } from '@/types'
import { logger } from '@/utils/logger'
import { and, count, desc, eq, isNull, sum } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'ScholarshipAllocationRouter' })

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
            eq(projetoTable.semestre, input.semestre),
            isNull(projetoTable.deletedAt)
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
            eq(projetoTable.semestre, input.semestre),
            isNull(projetoTable.deletedAt)
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
            eq(projetoTable.semestre, input.semestre),
            isNull(projetoTable.deletedAt)
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

  /**
   * Define o total de bolsas disponibilizadas pela PROGRAD para um período
   */
  setTotalScholarshipsFromPrograd: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        totalBolsas: z.number().int().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Buscar ou criar período de inscrição
      const periodo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(eq(periodoInscricaoTable.ano, input.ano), eq(periodoInscricaoTable.semestre, input.semestre)),
      })

      if (periodo) {
        // Atualizar total de bolsas
        await ctx.db
          .update(periodoInscricaoTable)
          .set({ totalBolsasPrograd: input.totalBolsas })
          .where(eq(periodoInscricaoTable.id, periodo.id))

        log.info({ periodoId: periodo.id, totalBolsas: input.totalBolsas }, 'Total de bolsas PROGRAD atualizado')
      } else {
        log.warn(
          { ano: input.ano, semestre: input.semestre },
          'Período de inscrição não encontrado para definir bolsas PROGRAD'
        )
        throw new Error('Período de inscrição não encontrado. Crie o período primeiro.')
      }

      return { success: true, totalBolsas: input.totalBolsas }
    }),

  /**
   * Busca o total de bolsas PROGRAD configurado para um período
   */
  getTotalProgradScholarships: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input, ctx }) => {
      const periodo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(eq(periodoInscricaoTable.ano, input.ano), eq(periodoInscricaoTable.semestre, input.semestre)),
      })

      return {
        totalBolsasPrograd: periodo?.totalBolsasPrograd || 0,
        periodoExists: !!periodo,
      }
    }),

  /**
   * Envia emails para professores após alocação de bolsas
   */
  notifyProfessorsAfterAllocation: adminProtectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Buscar projetos aprovados com bolsas alocadas
      const projetos = await ctx.db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          professorId: professorTable.id,
          professorNome: professorTable.nomeCompleto,
          professorEmail: professorTable.emailInstitucional,
        })
        .from(projetoTable)
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(
          and(
            eq(projetoTable.status, 'APPROVED'),
            eq(projetoTable.ano, input.ano),
            eq(projetoTable.semestre, input.semestre),
            isNull(projetoTable.deletedAt)
          )
        )

      // Filtrar apenas projetos com bolsas alocadas
      const projetosComBolsas = projetos.filter((p) => (p.bolsasDisponibilizadas || 0) > 0)

      let emailsEnviados = 0
      const erros: string[] = []

      // Agrupar por professor para evitar emails duplicados
      const professoresMap = new Map<
        number,
        { nome: string; email: string; projetos: { titulo: string; bolsas: number }[] }
      >()

      for (const projeto of projetosComBolsas) {
        const profId = projeto.professorId
        if (!professoresMap.has(profId)) {
          professoresMap.set(profId, {
            nome: projeto.professorNome,
            email: projeto.professorEmail,
            projetos: [],
          })
        }

        professoresMap.get(profId)?.projetos.push({
          titulo: projeto.titulo,
          bolsas: projeto.bolsasDisponibilizadas || 0,
        })
      }

      // Enviar emails
      for (const [profId, data] of professoresMap.entries()) {
        try {
          await sendScholarshipAllocationNotification({
            to: data.email,
            professorName: data.nome,
            ano: input.ano,
            semestre: input.semestre,
            projetos: data.projetos,
          })

          emailsEnviados++
          log.info({ professorId: profId, email: data.email }, 'Email de alocação enviado')
        } catch (error) {
          log.error(error, 'Erro ao enviar email de alocação')
          erros.push(`Erro ao enviar email para ${data.email}`)
        }
      }

      log.info({ totalEmails: emailsEnviados, erros: erros.length }, 'Notificação de alocação de bolsas finalizada')

      return {
        success: true,
        emailsEnviados,
        professoresNotificados: professoresMap.size,
        erros,
      }
    }),
})
