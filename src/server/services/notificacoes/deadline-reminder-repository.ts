import type { db } from '@/server/db'
import {
  alunoTable,
  inscricaoTable,
  projetoTable,
  relatorioFinalDisciplinaTable,
  relatorioFinalMonitorTable,
  vagaTable,
} from '@/server/db/schema'
import { endedEnrollmentPeriodCondition, enrollmentPeriodsEndingSoonCondition } from '@/server/lib/enrollment-period'
import { PROJETO_STATUS_APPROVED, RELATORIO_STATUS_SUBMITTED } from '@/types'
import { and, eq, inArray, isNull, lte, not, or } from 'drizzle-orm'

type Database = typeof db

export function createDeadlineReminderRepository(db: Database) {
  return {
    /**
     * Find inscription periods ending within X days.
     */
    async findPeriodosEndingSoon(diasAntes: number, now: Date = new Date()) {
      return db.query.periodoInscricaoTable.findMany({
        where: enrollmentPeriodsEndingSoonCondition(diasAntes, now),
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

    /**
     * Find bolsista-selected inscriptions that haven't been accepted/rejected
     * after 24 hours since selection (updatedAt).
     * These are candidates whose professor selected them but they didn't respond.
     */
    async findBolsistasWithoutResponseAfter24h() {
      const vinte4hAtras = new Date()
      vinte4hAtras.setHours(vinte4hAtras.getHours() - 24)

      return db.query.inscricaoTable.findMany({
        where: and(eq(inscricaoTable.status, 'SELECTED_BOLSISTA'), lte(inscricaoTable.updatedAt, vinte4hAtras)),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true },
              },
            },
          },
        },
      })
    },

    /**
     * Find approved projects whose selection/acceptance period has ended,
     * but no student accepted a monitoria position.
     */
    async findProjectsWithoutAcceptedMonitorsAfterDeadline(now: Date = new Date()) {
      // Find inscription periods that have ended
      const endedPeriodos = await db.query.periodoInscricaoTable.findMany({
        where: endedEnrollmentPeriodCondition(now),
        columns: { ano: true, semestre: true },
      })

      if (endedPeriodos.length === 0) return []

      const periodConditions = endedPeriodos.map((p) =>
        and(eq(projetoTable.ano, p.ano), eq(projetoTable.semestre, p.semestre))
      )

      // Find approved projects in these ended periods
      const approvedProjects = await db.query.projetoTable.findMany({
        where: and(
          eq(projetoTable.status, PROJETO_STATUS_APPROVED),
          isNull(projetoTable.deletedAt),
          or(...periodConditions)
        ),
        with: {
          departamento: true,
          professorResponsavel: {
            with: {
              user: true,
            },
          },
          inscricoes: {
            columns: {
              id: true,
              status: true,
            },
          },
        },
      })

      // Filter projects where results were published / candidates evaluated, BUT no student accepted
      return approvedProjects.filter((p) => {
        const hasAccepted = p.inscricoes.some(
          (i) => i.status === 'ACCEPTED_BOLSISTA' || i.status === 'ACCEPTED_VOLUNTARIO'
        )
        const hasEvaluatedOrSelected = p.inscricoes.some(
          (i) =>
            i.status?.startsWith('SELECTED_') ||
            i.status === 'REJECTED_BY_PROFESSOR' ||
            i.status === 'REJECTED_BY_STUDENT' ||
            i.status?.startsWith('ACCEPTED_')
        )
        return hasEvaluatedOrSelected && !hasAccepted
      })
    },
  }
}

export type DeadlineReminderRepository = ReturnType<typeof createDeadlineReminderRepository>
