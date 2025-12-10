import type { db } from '@/server/db'
import type { Semestre } from '@/types'
import { createDisciplinaRelatorioService } from './disciplina-relatorio-service'
import { createMonitorRelatorioService } from './monitor-relatorio-service'
import { createRelatoriosFinaisRepository } from './relatorios-finais-repository'

type Database = typeof db

/**
 * Facade service for final reports.
 * Delegates to specialized services for discipline and monitor reports.
 */
export function createRelatoriosFinaisService(database: Database) {
  const disciplinaService = createDisciplinaRelatorioService(database)
  const monitorService = createMonitorRelatorioService(database)
  const repository = createRelatoriosFinaisRepository(database)

  return {
    // ========================================
    // RELATORIO FINAL DISCIPLINA - PROFESSOR
    // ========================================
    listRelatoriosDisciplinaForProfessor: disciplinaService.listRelatoriosDisciplinaForProfessor,
    getRelatorioDisciplina: disciplinaService.getRelatorioDisciplina,
    createRelatorioDisciplina: disciplinaService.createRelatorioDisciplina,
    updateRelatorioDisciplina: disciplinaService.updateRelatorioDisciplina,
    signRelatorioDisciplina: disciplinaService.signRelatorioDisciplina,

    // ========================================
    // RELATORIO FINAL MONITOR - PROFESSOR
    // ========================================
    getRelatorioMonitor: monitorService.getRelatorioMonitor,
    createRelatorioMonitor: monitorService.createRelatorioMonitor,
    updateRelatorioMonitor: monitorService.updateRelatorioMonitor,
    signRelatorioMonitorAsProfessor: monitorService.signRelatorioMonitorAsProfessor,

    // ========================================
    // RELATORIO FINAL MONITOR - ALUNO
    // ========================================
    listRelatoriosPendentesParaAluno: monitorService.listRelatoriosPendentesParaAluno,
    getRelatorioMonitorParaAluno: monitorService.getRelatorioMonitorParaAluno,
    signRelatorioMonitorAsAluno: monitorService.signRelatorioMonitorAsAluno,

    // ========================================
    // ADMIN METHODS
    // ========================================
    async listAllDisciplinaReportsForAdmin(filters: { ano?: number; semestre?: Semestre; departamentoId?: number }) {
      return repository.listAllDisciplinaReportsForAdmin(filters)
    },

    async listAllMonitorReportsForAdmin(filters: { ano?: number; semestre?: Semestre; departamentoId?: number }) {
      return repository.listAllMonitorReportsForAdmin(filters)
    },
  }
}

export type RelatoriosFinaisService = ReturnType<typeof createRelatoriosFinaisService>
