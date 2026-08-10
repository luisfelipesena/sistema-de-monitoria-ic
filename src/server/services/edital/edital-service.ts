import type { db } from '@/server/db'
import { logger } from '@/utils/logger'
import { createEditalCrudService } from './edital-crud-service'
import { createEditalPdfService } from './edital-pdf-service'
import { createEditalPublicationService } from './edital-publication-service'
import { createEditalQueryService } from './edital-query-service'
import { createEditalRepository } from './edital-repository'

type Database = typeof db

const log = logger.child({ context: 'EditalService' })

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
    getNumeroEditalPrograd: queryService.getNumeroEditalPrograd,
    getAvailableExamDates: queryService.getAvailableExamDates,

    // CRUD operations
    createEdital: crudService.createEdital,
    updateEdital: crudService.updateEdital,
    updateNumeroEdital: crudService.updateNumeroEdital,
    deleteEdital: crudService.deleteEdital,
    uploadSignedEdital: crudService.uploadSignedEdital,
    setAvailableExamDates: crudService.setAvailableExamDates,
    requestChefeSignature: crudService.requestChefeSignature,

    // Sign as chefe + auto-generate signed PDF
    async signAsChefe(id: number, assinatura: string, userId: number) {
      const result = await crudService.signAsChefe(id, assinatura, userId)
      // Auto-generate signed PDF and save reference
      try {
        const pdfResult = await pdfService.generateEditalPdf(id, userId)
        await repo.update(id, { fileIdAssinado: pdfResult.fileId })
        log.info({ editalId: id, fileId: pdfResult.fileId }, 'PDF assinado gerado e salvo automaticamente')
      } catch (error) {
        log.warn({ editalId: id, error }, 'Falha ao gerar PDF automaticamente (assinatura foi salva)')
      }
      return result
    },

    // Token-based signature operations (public) + auto-generate signed PDF
    getEditalByToken: crudService.getEditalByToken,
    async signEditalByToken(token: string, assinatura: string, chefeNome: string) {
      const result = await crudService.signEditalByToken(token, assinatura, chefeNome)
      // Auto-generate signed PDF and save reference
      try {
        const editalId = result.edital?.id
        if (editalId) {
          const pdfResult = await pdfService.generateEditalPdf(editalId, 0)
          await repo.update(editalId, { fileIdAssinado: pdfResult.fileId })
          log.info({ editalId, fileId: pdfResult.fileId }, 'PDF assinado gerado e salvo automaticamente via token')
        }
      } catch (error) {
        log.warn({ error }, 'Falha ao gerar PDF automaticamente (assinatura foi salva)')
      }
      return result
    },

    // Publication operations
    validateEditalForPublication: publicationService.validateEditalForPublication,
    publishEdital: publicationService.publishEdital,
    publishAndNotify: publicationService.publishAndNotify,

    // PDF operations
    generateEditalPdf: pdfService.generateEditalPdf,
  }
}

export type EditalService = ReturnType<typeof createEditalService>
