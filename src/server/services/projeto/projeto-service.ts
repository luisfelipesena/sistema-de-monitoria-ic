import type { db } from '@/server/db'
import { createProjetoApprovalService } from './projeto-approval-service'
import { createProjetoCreationService } from './projeto-creation-service'
import { createProjetoQueryService } from './projeto-query-service'
import { createProjetoRepository } from './projeto-repository'
import { createProjetoSelectionService } from './projeto-selection-service'

type Database = typeof db

/**
 * Main Projeto Service - Orchestrates all projeto-related operations
 * Delegates to specialized services for better maintainability
 */
export function createProjetoService(db: Database) {
  const repo = createProjetoRepository(db)
  const queryService = createProjetoQueryService(repo)
  const creationService = createProjetoCreationService(repo, db)
  const approvalService = createProjetoApprovalService(repo)
  const selectionService = createProjetoSelectionService(repo)

  return {
    // Query operations
    getProjetos: queryService.getProjetos,
    getProjetosFiltered: queryService.getProjetosFiltered,
    getProjeto: queryService.getProjeto,
    getAvailableProjects: queryService.getAvailableProjects,
    getVolunteers: queryService.getVolunteers,

    // Creation/Update operations
    createProjeto: creationService.createProjeto,
    updateProjeto: creationService.updateProjeto,
    deleteProjeto: creationService.deleteProjeto,
    updateVolunteerStatus: creationService.updateVolunteerStatus,

    // Approval workflow operations
    submitProjeto: approvalService.submitProjeto,
    approveProjeto: approvalService.approveProjeto,
    rejectProjeto: approvalService.rejectProjeto,
    signProfessor: approvalService.signProfessor,

    // Selection operations
    generateSelectionMinutesData: selectionService.generateSelectionMinutesData,
    saveSelectionMinutes: selectionService.saveSelectionMinutes,
    notifySelectionResults: selectionService.notifySelectionResults,
  }
}

export type ProjetoService = ReturnType<typeof createProjetoService>
