import type { db } from '@/server/db'
import {
  alunoTable,
  inscricaoTable,
  professorTable,
  projetoTable,
  relatorioFinalDisciplinaTable,
  relatorioFinalMonitorTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import { relatoriosEmailService } from '@/server/lib/email/relatorios-emails'
import { createAuditService } from '@/server/services/audit/audit-service'
import { APPROVED, type Semestre, AUDIT_ACTION_SEND_NOTIFICATION, AUDIT_ENTITY_NOTIFICATION } from '@/types'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { and, count, eq, inArray, isNull } from 'drizzle-orm'
import { createRelatoriosFinaisExportService } from './relatorios-finais-export-service'

type Database = typeof db

const log = logger.child({ context: 'RelatoriosNotificationsService' })
const clientUrl = env.CLIENT_URL || 'http://localhost:3000'

export function createRelatoriosNotificationsService(database: Database) {
  const auditService = createAuditService(database)
  const exportService = createRelatoriosFinaisExportService(database)

  return {
    /**
     * Notifica professores para gerar relatórios finais
     * Admin dispara essa notificação no final do semestre
     */
    async notifyProfessorsToGenerateReports(
      ano: number,
      semestre: Semestre,
      prazoFinal: Date | undefined,
      remetenteUserId: number
    ): Promise<{ success: boolean; emailsEnviados: number; errors: string[] }> {
      const errors: string[] = []
      let emailsEnviados = 0

      const professoresComProjetos = await database
        .select({
          professorId: professorTable.id,
          professorNome: professorTable.nomeCompleto,
          professorEmail: userTable.email,
          projetoId: projetoTable.id,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          relatorioId: relatorioFinalDisciplinaTable.id,
        })
        .from(projetoTable)
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(userTable, eq(professorTable.userId, userTable.id))
        .leftJoin(relatorioFinalDisciplinaTable, eq(projetoTable.id, relatorioFinalDisciplinaTable.projetoId))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre), eq(projetoTable.status, APPROVED)))

      const projetosSemRelatorio = professoresComProjetos.filter((row) => !row.relatorioId)
      const allProjectIds = projetosSemRelatorio.map((row) => row.projetoId)

      // Pre-fetch all monitor counts in a single query (fix N+1)
      const monitorCountsByProject =
        allProjectIds.length > 0
          ? await database
              .select({
                projetoId: vagaTable.projetoId,
                count: count(),
              })
              .from(vagaTable)
              .where(inArray(vagaTable.projetoId, allProjectIds))
              .groupBy(vagaTable.projetoId)
          : []

      // Convert to Map for O(1) lookup
      const countsMap = new Map(monitorCountsByProject.map((r) => [r.projetoId, r.count]))

      const professoresMap = new Map<
        number,
        {
          email: string
          nome: string
          projetos: { id: number; titulo: string; disciplinaNome: string; qtdMonitores: number }[]
        }
      >()

      for (const row of projetosSemRelatorio) {
        if (!professoresMap.has(row.professorId)) {
          professoresMap.set(row.professorId, {
            email: row.professorEmail,
            nome: row.professorNome,
            projetos: [],
          })
        }

        professoresMap.get(row.professorId)?.projetos.push({
          id: row.projetoId,
          titulo: row.projetoTitulo,
          disciplinaNome: row.disciplinaNome || 'N/A',
          qtdMonitores: countsMap.get(row.projetoId) || 0,
        })
      }

      for (const [_professorId, data] of professoresMap) {
        if (data.projetos.length === 0) continue

        try {
          await relatoriosEmailService.sendProfessorRelatorioNotification({
            professorEmail: data.email,
            professorNome: data.nome,
            projetos: data.projetos,
            ano,
            semestre,
            prazoFinal,
            remetenteUserId,
          })
          emailsEnviados++
        } catch (error) {
          const errorMsg = `Erro ao enviar email para ${data.email}: ${error instanceof Error ? error.message : String(error)}`
          log.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      await auditService.log({
        userId: remetenteUserId,
        action: AUDIT_ACTION_SEND_NOTIFICATION,
        entityType: AUDIT_ENTITY_NOTIFICATION,
        details: {
          type: 'PROFESSOR_RELATORIO_NOTIFICATION',
          ano,
          semestre,
          emailsEnviados,
          errorsCount: errors.length,
        },
      })

      return { success: errors.length === 0, emailsEnviados, errors }
    },

    /**
     * Notifica alunos que têm relatórios pendentes de assinatura
     */
    async notifyStudentsWithPendingReports(
      ano: number,
      semestre: Semestre,
      remetenteUserId: number
    ): Promise<{ success: boolean; emailsEnviados: number; errors: string[] }> {
      const errors: string[] = []
      let emailsEnviados = 0

      const relatoriosPendentes = await database
        .select({
          relatorioId: relatorioFinalMonitorTable.id,
          alunoNome: alunoTable.nomeCompleto,
          alunoEmail: userTable.email,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          professorNome: professorTable.nomeCompleto,
        })
        .from(relatorioFinalMonitorTable)
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(
          and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            isNull(relatorioFinalMonitorTable.alunoAssinouEm)
          )
        )

      for (const relatorio of relatoriosPendentes) {
        try {
          await relatoriosEmailService.sendStudentRelatorioNotification({
            alunoEmail: relatorio.alunoEmail,
            alunoNome: relatorio.alunoNome,
            projetoTitulo: relatorio.projetoTitulo,
            disciplinaNome: relatorio.disciplinaNome || 'N/A',
            professorNome: relatorio.professorNome,
            linkRelatorio: `${clientUrl}/home/student/relatorios?id=${relatorio.relatorioId}`,
            remetenteUserId,
          })
          emailsEnviados++
        } catch (error) {
          const errorMsg = `Erro ao enviar email para ${relatorio.alunoEmail}: ${error instanceof Error ? error.message : String(error)}`
          log.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      await auditService.log({
        userId: remetenteUserId,
        action: AUDIT_ACTION_SEND_NOTIFICATION,
        entityType: AUDIT_ENTITY_NOTIFICATION,
        details: {
          type: 'STUDENT_RELATORIO_NOTIFICATION',
          ano,
          semestre,
          emailsEnviados,
          errorsCount: errors.length,
        },
      })

      return { success: errors.length === 0, emailsEnviados, errors }
    },

    // Delegate to export service
    gerarTextoAta: exportService.gerarTextoAta.bind(exportService),
    gerarPlanilhasCertificados: exportService.gerarPlanilhasCertificados.bind(exportService),
    enviarCertificadosParaNUMOP: exportService.enviarCertificadosParaNUMOP.bind(exportService),
    getValidationStatus: exportService.getValidationStatus.bind(exportService),
  }
}

export type RelatoriosNotificationsService = ReturnType<typeof createRelatoriosNotificationsService>
