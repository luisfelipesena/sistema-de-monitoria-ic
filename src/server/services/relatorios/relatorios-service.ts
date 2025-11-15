import type { db } from '@/server/db'
import type { Semestre } from '@/types'
import { createRelatoriosExportService } from './relatorios-export-service'
import { createRelatoriosQueryService } from './relatorios-query-service'
import { createRelatoriosRepository } from './relatorios-repository'
import { createRelatoriosValidationService } from './relatorios-validation-service'

type Database = typeof db

/**
 * Main Relatorios Service - Orchestrates all report-related operations
 * Delegates to specialized services for better maintainability
 */
export function createRelatoriosService(db: Database) {
  const repo = createRelatoriosRepository(db)
  const queryService = createRelatoriosQueryService(repo)
  const validationService = createRelatoriosValidationService(repo)

  // Export service needs access to validation function
  const checkDadosFaltantes = async (input: {
    ano: number
    semestre: Semestre
    tipo: 'bolsistas' | 'voluntarios' | 'ambos'
  }) => {
    return validationService.validateCompleteData(input.ano, input.semestre, input.tipo)
  }

  const exportService = createRelatoriosExportService(repo, checkDadosFaltantes)

  return {
    // Query operations
    getRelatorioGeral: queryService.getRelatorioGeral,
    getRelatorioPorDepartamento: queryService.getRelatorioPorDepartamento,
    getRelatorioProfessores: queryService.getRelatorioProfessores,
    getRelatorioAlunos: queryService.getRelatorioAlunos,
    getRelatorioDisciplinas: queryService.getRelatorioDisciplinas,
    getRelatorioEditais: queryService.getRelatorioEditais,
    getDashboardMetrics: queryService.getDashboardMetrics,

    // Validation operations
    validateCompleteData: validationService.validateCompleteData,

    // Export operations
    exportRelatorioCsv: exportService.exportRelatorioCsv,
    exportConsolidated: exportService.exportConsolidated,
    getConsolidatedMonitoringData: exportService.getConsolidatedMonitoringData,
    monitoresFinalBolsistas: exportService.monitoresFinalBolsistas,
    monitoresFinalVoluntarios: exportService.monitoresFinalVoluntarios,
  }
}

export type RelatoriosService = ReturnType<typeof createRelatoriosService>
