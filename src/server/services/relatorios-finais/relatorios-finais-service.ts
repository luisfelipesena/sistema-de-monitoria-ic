import type { db } from '@/server/db'
import { createDisciplinaRelatorioService } from './disciplina-relatorio-service'
import { createMonitorRelatorioService } from './monitor-relatorio-service'

type Database = typeof db

/**
 * Facade service for final reports.
 * Delegates to specialized services for discipline and monitor reports.
 */
export function createRelatoriosFinaisService(database: Database) {
  const disciplinaService = createDisciplinaRelatorioService(database)
  const monitorService = createMonitorRelatorioService(database)

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
  }
}

export type RelatoriosFinaisService = ReturnType<typeof createRelatoriosFinaisService>
