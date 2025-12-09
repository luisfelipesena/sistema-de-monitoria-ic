import type { db } from '@/server/db'
import { createEditalCrudService } from './edital-crud-service'
import { createEditalPdfService } from './edital-pdf-service'
import { createEditalPublicationService } from './edital-publication-service'
import { createEditalQueryService } from './edital-query-service'
import { createEditalRepository } from './edital-repository'

type Database = typeof db

/**
 * Main Edital Service - Orchestrates all edital-related operations
 * Delegates to specialized services for better maintainability
 */
export function createEditalService(db: Database) {
  const repo = createEditalRepository(db)
  const queryService = createEditalQueryService(repo)
  const pdfService = createEditalPdfService(repo)

  // Publication service needs access to validation function
  const validateEditalForPublication = async (id: number) => {
    const publicationService = createEditalPublicationService(repo, async () => {
      throw new Error('Should not be called directly')
    })
    return publicationService.validateEditalForPublication(id)
  }

  const publicationService = createEditalPublicationService(repo, validateEditalForPublication)

  // CRUD service needs access to getEdital
  const crudService = createEditalCrudService(repo, queryService.getEdital)

  return {
    // Query operations
    getActivePeriod: queryService.getActivePeriod,
    getEditais: queryService.getEditais,
    getEdital: queryService.getEdital,
    getPublicEditais: queryService.getPublicEditais,
    getEditaisBySemestre: queryService.getEditaisBySemestre,
    getCurrentEditalForSemestre: queryService.getCurrentEditalForSemestre,
    getEditaisParaAssinar: queryService.getEditaisParaAssinar,
    getAvailableExamDates: queryService.getAvailableExamDates,

    // CRUD operations
    createEdital: crudService.createEdital,
    updateEdital: crudService.updateEdital,
    updateNumeroEdital: crudService.updateNumeroEdital,
    deleteEdital: crudService.deleteEdital,
    uploadSignedEdital: crudService.uploadSignedEdital,
    setAvailableExamDates: crudService.setAvailableExamDates,
    requestChefeSignature: crudService.requestChefeSignature,
    signAsChefe: crudService.signAsChefe,

    // Token-based signature operations (public)
    getEditalByToken: crudService.getEditalByToken,
    signEditalByToken: crudService.signEditalByToken,

    // Publication operations
    validateEditalForPublication: publicationService.validateEditalForPublication,
    publishEdital: publicationService.publishEdital,
    publishAndNotify: publicationService.publishAndNotify,

    // PDF operations
    generateEditalPdf: pdfService.generateEditalPdf,
  }
}

export type EditalService = ReturnType<typeof createEditalService>
