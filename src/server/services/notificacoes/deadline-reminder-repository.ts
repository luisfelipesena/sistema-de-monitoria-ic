import type { db } from '@/server/db'
import {
  alunoTable,
  inscricaoTable,
  periodoInscricaoTable,
  projetoTable,
  relatorioFinalDisciplinaTable,
  relatorioFinalMonitorTable,
  vagaTable,
} from '@/server/db/schema'
import { PROJETO_STATUS_APPROVED, RELATORIO_STATUS_SUBMITTED } from '@/types'
import { and, eq, gte, inArray, lte, not } from 'drizzle-orm'

type Database = typeof db

export function createDeadlineReminderRepository(db: Database) {
  return {
    /**
     * Find inscription periods ending within X days.
     */
    async findPeriodosEndingSoon(diasAntes: number) {
      const hoje = new Date()
      const dataLimite = new Date()
      dataLimite.setDate(hoje.getDate() + diasAntes)

      return db.query.periodoInscricaoTable.findMany({
        where: and(gte(periodoInscricaoTable.dataFim, hoje), lte(periodoInscricaoTable.dataFim, dataLimite)),
      })
    },

    /**
     * Find students who haven't applied to any project in a given period.
     */
    async findStudentsWithoutInscription(periodoId: number) {
      // Get all students who have applied in this period
      const alunosComInscricao = await db
        .select({ alunoId: inscricaoTable.alunoId })
        .from(inscricaoTable)
        .where(eq(inscricaoTable.periodoInscricaoId, periodoId))

      const alunoIdsComInscricao = alunosComInscricao.map((a) => a.alunoId)

      // Get all active students (those with verified accounts)
      const queryConditions =
        alunoIdsComInscricao.length > 0 ? not(inArray(alunoTable.id, alunoIdsComInscricao)) : undefined

      return db.query.alunoTable.findMany({
        where: queryConditions,
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              username: true,
              emailVerifiedAt: true,
            },
          },
        },
        limit: 500, // Limit to prevent overwhelming emails
      })
    },

    /**
     * Find approved projects without a final report submitted.
     */
    async findProjectsWithoutFinalReport(diasLimite: number) {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - diasLimite)

      // Find projects that should have reports but don't
      const projetosComRelatorio = await db
        .select({ projetoId: relatorioFinalDisciplinaTable.projetoId })
        .from(relatorioFinalDisciplinaTable)
        .where(inArray(relatorioFinalDisciplinaTable.status, [RELATORIO_STATUS_SUBMITTED, 'APPROVED']))

      const projetoIdsComRelatorio = projetosComRelatorio.map((p) => p.projetoId)

      const queryConditions =
        projetoIdsComRelatorio.length > 0
          ? and(
              eq(projetoTable.status, PROJETO_STATUS_APPROVED),
              lte(projetoTable.createdAt, dataLimite),
              not(inArray(projetoTable.id, projetoIdsComRelatorio))
            )
          : and(eq(projetoTable.status, PROJETO_STATUS_APPROVED), lte(projetoTable.createdAt, dataLimite))

      return db.query.projetoTable.findMany({
        where: queryConditions,
        with: {
          departamento: true,
          professorResponsavel: {
            with: {
              user: true,
            },
          },
        },
      })
    },

    /**
     * Find monitor reports that are still in draft or not created.
     */
    async findPendingMonitorReports(diasLimite: number) {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - diasLimite)

      // Find accepted inscriptions without completed monitor reports
      const relatoriosCompletos = await db
        .select({ inscricaoId: relatorioFinalMonitorTable.inscricaoId })
        .from(relatorioFinalMonitorTable)
        .where(inArray(relatorioFinalMonitorTable.status, [RELATORIO_STATUS_SUBMITTED, 'APPROVED']))

      const inscricaoIdsComRelatorio = relatoriosCompletos.map((r) => r.inscricaoId)

      // Get vagas (accepted monitors) without completed reports
      const queryConditions =
        inscricaoIdsComRelatorio.length > 0
          ? and(lte(vagaTable.createdAt, dataLimite), not(inArray(vagaTable.inscricaoId, inscricaoIdsComRelatorio)))
          : lte(vagaTable.createdAt, dataLimite)

      return db.query.vagaTable.findMany({
        where: queryConditions,
        with: {
          aluno: {
            with: {
              user: true,
            },
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: {
                  user: true,
                },
              },
            },
          },
        },
        limit: 500,
      })
    },

    /**
     * Find completed vagas for a period (for certificate notifications).
     */
    async findCompletedVagasForPeriod(ano: number, semestre: string) {
      // Find projects for the given period
      const projetos = await db.query.projetoTable.findMany({
        where: and(
          eq(projetoTable.ano, ano),
          eq(projetoTable.semestre, semestre as 'SEMESTRE_1' | 'SEMESTRE_2'),
          eq(projetoTable.status, PROJETO_STATUS_APPROVED)
        ),
        columns: { id: true },
      })

      if (projetos.length === 0) return []

      const projetoIds = projetos.map((p) => p.id)

      return db.query.vagaTable.findMany({
        where: inArray(vagaTable.projetoId, projetoIds),
        with: {
          aluno: {
            with: {
              user: true,
            },
          },
          projeto: true,
        },
      })
    },
  }
}

export type DeadlineReminderRepository = ReturnType<typeof createDeadlineReminderRepository>
