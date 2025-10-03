import { MonitoriaFormTemplate } from '@/components/features/projects/MonitoriaFormTemplate'
import minioClient, { bucketName } from '@/server/lib/minio'
import { AtaSelecaoTemplate } from '@/server/lib/pdfTemplates/ata-selecao'
import { EditalInternoTemplate } from '@/server/lib/pdfTemplates/edital-interno'
import { AtaSelecaoData, MonitoriaFormData } from '@/types'
import { logger } from '@/utils/logger'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { PDFDocument } from 'pdf-lib'
import React, { type ReactElement } from 'react'

const log = logger.child({ context: 'PDFService' })

const toDocumentElement = (element: ReactElement): ReactElement<DocumentProps> => {
  return element as ReactElement<DocumentProps>
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class PDFService {
  /**
   * Generates a PDF from the MonitoriaFormTemplate with the provided data
   */
  static async generateProjetoPDF(data: MonitoriaFormData): Promise<Buffer> {
    try {
      log.info({ projetoId: data.projetoId }, 'Generating PDF from template')

      // Create the PDF using @react-pdf/renderer
      const pdfElement = toDocumentElement(React.createElement(MonitoriaFormTemplate, { data }))
      const pdfBuffer = await renderToBuffer(pdfElement)

      log.info({ projetoId: data.projetoId, size: pdfBuffer.length }, 'PDF generated successfully')
      return pdfBuffer
    } catch (error) {
      log.error({ error, projetoId: data.projetoId }, 'Error generating PDF')
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Saves or updates a project PDF in MinIO
   */
  static async saveProjetoPDF(projetoId: number, pdfBuffer: Buffer, filename?: string): Promise<string> {
    try {
      const baseDirectory = `projetos/${projetoId}/propostas_assinadas`
      const objectName = filename || `${baseDirectory}/proposta_${projetoId}_${Date.now()}.pdf`

      const metadata = {
        'Content-Type': 'application/pdf',
        'X-Amz-Meta-Projeto-Id': projetoId.toString(),
        'X-Amz-Meta-Generated-At': new Date().toISOString(),
      }

      await minioClient.putObject(bucketName, objectName, pdfBuffer, pdfBuffer.length, metadata)

      log.info({ projetoId, objectName, size: pdfBuffer.length }, 'PDF saved to MinIO successfully')
      return objectName
    } catch (error) {
      log.error({ error, projetoId }, 'Error saving PDF to MinIO')
      throw new Error(`Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Gets the latest PDF for a project from MinIO
   */
  static async getLatestProjetoPDF(projetoId: number): Promise<{ objectName: string; buffer: Buffer } | null> {
    try {
      const prefix = `projetos/${projetoId}/propostas_assinadas/`
      const objectsStream = minioClient.listObjectsV2(bucketName, prefix, true)

      return new Promise((resolve, reject) => {
        const projectFiles: Array<{ name: string; lastModified: Date }> = []

        objectsStream.on('data', (obj) => {
          if (obj.name?.endsWith('.pdf')) {
            projectFiles.push({
              name: obj.name,
              lastModified: obj.lastModified || new Date(),
            })
          }
        })

        objectsStream.on('error', (err) => {
          log.error({ error: err, projetoId }, 'Error listing project PDFs')
          reject(err)
        })

        objectsStream.on('end', async () => {
          if (projectFiles.length === 0) {
            log.info({ projetoId }, 'No PDFs found for project')
            resolve(null)
            return
          }

          // Get the most recent file
          const latestFile = projectFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())[0]

          if (!latestFile) {
            resolve(null)
            return
          }

          try {
            // Get the file content
            const stream = await minioClient.getObject(bucketName, latestFile.name)
            const chunks: Buffer[] = []

            stream.on('data', (chunk) => chunks.push(chunk))
            stream.on('end', () => {
              const buffer = Buffer.concat(chunks)
              log.info({ projetoId, objectName: latestFile.name, size: buffer.length }, 'Retrieved latest PDF')
              resolve({ objectName: latestFile.name, buffer })
            })
            stream.on('error', reject)
          } catch (error) {
            log.error({ error, projetoId, fileName: latestFile.name }, 'Error retrieving PDF content')
            reject(error)
          }
        })
      })
    } catch (error) {
      log.error({ error, projetoId }, 'Error getting latest project PDF')
      throw new Error(`Failed to get PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Adds a signature to an existing PDF buffer
   * @deprecated This method is no longer used. Signatures are now rendered directly in the template via generateAndSaveSignedProjetoPDF
   */
  static async addSignatureToPDF(
    pdfBuffer: Buffer,
    signatureDataUrl: string,
    signatureType: 'professor' | 'admin'
  ): Promise<Buffer> {
    try {
      log.info({ signatureType }, 'Adding signature to PDF')

      // Load the existing PDF
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pages = pdfDoc.getPages()
      const firstPage = pages[0]

      if (!firstPage) {
        throw new Error('PDF has no pages')
      }

      // Convert signature image
      const signatureImageBytes = Buffer.from(signatureDataUrl.split(',')[1] || signatureDataUrl, 'base64')
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes)

      // Calculate signature position based on PDF content
      const signatureWidth = 150
      const signatureHeight = 60
      const pageWidth = firstPage.getWidth()

      // Position signatures in designated areas within the document
      let x: number, y: number
      if (signatureType === 'professor') {
        // Professor signature goes in section 5 (professor declaration area)
        x = pageWidth - signatureWidth - 50
        y = 180
      } else {
        // Admin signature goes in section 6 (admin approval area)
        x = pageWidth - signatureWidth - 50
        y = 80
      }

      // Draw the signature
      firstPage.drawImage(signatureImage, {
        x,
        y,
        width: signatureWidth,
        height: signatureHeight,
      })

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save()
      const modifiedBuffer = Buffer.from(modifiedPdfBytes)

      log.info({ signatureType, size: modifiedBuffer.length }, 'Signature added to PDF successfully')
      return modifiedBuffer
    } catch (error) {
      log.error({ error, signatureType }, 'Error adding signature to PDF')
      throw new Error(`Failed to add signature: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generates and saves a new project PDF with signatures
   */
  static async generateAndSaveSignedProjetoPDF(
    data: MonitoriaFormData,
    professorSignature?: string,
    _adminSignature?: string
  ): Promise<string> {
    try {
      log.info({ projetoId: data.projetoId }, 'Generating signed project PDF')

      const pdfData: MonitoriaFormData = {
        ...data,
        assinaturaProfessor: professorSignature,
        dataAssinaturaProfessor: professorSignature ? new Date().toLocaleDateString('pt-BR') : undefined,
      }

      // Generate the complete PDF with signatures included in the template
      const pdfBuffer = await PDFService.generateProjetoPDF(pdfData)

      if (!data.projetoId) {
        throw new Error('Projeto ID inválido para salvar PDF assinado')
      }

      const objectName = await PDFService.saveProjetoPDF(data.projetoId, pdfBuffer)

      log.info({ projetoId: data.projetoId, objectName }, 'Signed project PDF generated and saved')
      return objectName
    } catch (error) {
      log.error({ error, projetoId: data.projetoId }, 'Error generating signed project PDF')
      throw new Error(`Failed to generate signed PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generates a PDF for internal edital
   */
  static async generateEditalInternoPDF(
    data: import('@/server/lib/pdfTemplates/edital-interno').EditalInternoData
  ): Promise<Buffer> {
    try {
      log.info({ numeroEdital: data.numeroEdital }, 'Generating internal edital PDF')

      const pdfElement = toDocumentElement(React.createElement(EditalInternoTemplate, { data }))
      const pdfBuffer = await renderToBuffer(pdfElement)

      log.info(
        { numeroEdital: data.numeroEdital, size: pdfBuffer.length },
        'Internal edital PDF generated successfully'
      )
      return pdfBuffer
    } catch (error) {
      log.error({ error, numeroEdital: data.numeroEdital }, 'Error generating internal edital PDF')
      throw new Error(
        `Failed to generate internal edital PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Saves an internal edital PDF in MinIO
   */
  static async saveEditalInternoPDF(editalId: number, pdfBuffer: Buffer, filename?: string): Promise<string> {
    try {
      const baseDirectory = `editais-internos/${editalId}`
      const objectName = filename || `${baseDirectory}/edital_interno_${editalId}_${Date.now()}.pdf`

      const metadata = {
        'Content-Type': 'application/pdf',
        'X-Amz-Meta-Edital-Id': editalId.toString(),
        'X-Amz-Meta-Generated-At': new Date().toISOString(),
      }

      await minioClient.putObject(bucketName, objectName, pdfBuffer, pdfBuffer.length, metadata)

      log.info({ editalId, objectName, size: pdfBuffer.length }, 'Internal edital PDF saved to MinIO successfully')
      return objectName
    } catch (error) {
      log.error({ error, editalId }, 'Error saving internal edital PDF to MinIO')
      throw new Error(`Failed to save internal edital PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generates a PDF for ata de seleção
   */
  static async generateAtaSelecaoPDF(data: AtaSelecaoData): Promise<Buffer> {
    try {
      log.info({ projetoId: data.projeto.id }, 'Generating ata de seleção PDF')

      const pdfElement = toDocumentElement(React.createElement(AtaSelecaoTemplate, { data }))
      const pdfBuffer = await renderToBuffer(pdfElement)

      log.info({ projetoId: data.projeto.id, size: pdfBuffer.length }, 'Ata de seleção PDF generated successfully')
      return pdfBuffer
    } catch (error) {
      log.error({ error, projetoId: data.projeto.id }, 'Error generating ata de seleção PDF')
      throw new Error(
        `Failed to generate ata de seleção PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Saves an ata de seleção PDF in MinIO
   */
  static async saveAtaSelecaoPDF(projetoId: number, pdfBuffer: Buffer, filename?: string): Promise<string> {
    try {
      const baseDirectory = `projetos/${projetoId}/atas-selecao`
      const objectName = filename || `${baseDirectory}/ata_selecao_${projetoId}_${Date.now()}.pdf`

      const metadata = {
        'Content-Type': 'application/pdf',
        'X-Amz-Meta-Projeto-Id': projetoId.toString(),
        'X-Amz-Meta-Generated-At': new Date().toISOString(),
        'X-Amz-Meta-Document-Type': 'ata-selecao',
      }

      await minioClient.putObject(bucketName, objectName, pdfBuffer, pdfBuffer.length, metadata)

      log.info({ projetoId, objectName, size: pdfBuffer.length }, 'Ata de seleção PDF saved to MinIO successfully')
      return objectName
    } catch (error) {
      log.error({ error, projetoId }, 'Error saving ata de seleção PDF to MinIO')
      throw new Error(`Failed to save ata de seleção PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generates and saves an internal edital PDF with signature
   */
  static async generateAndSaveSignedEditalInternoPDF(
    data: import('@/server/lib/pdfTemplates/edital-interno').EditalInternoData,
    editalId: number,
    chefeSignature?: string
  ): Promise<string> {
    try {
      log.info({ editalId }, 'Generating signed internal edital PDF')

      // Generate the base PDF
      let pdfBuffer = await PDFService.generateEditalInternoPDF(data)

      // Add chefe signature if provided
      if (chefeSignature) {
        pdfBuffer = await PDFService.addSignatureToPDF(pdfBuffer, chefeSignature, 'admin')
      }

      // Save the final PDF
      const objectName = await PDFService.saveEditalInternoPDF(editalId, pdfBuffer)

      log.info({ editalId, objectName }, 'Signed internal edital PDF generated and saved')
      return objectName
    } catch (error) {
      log.error({ error, editalId }, 'Error generating signed internal edital PDF')
      throw new Error(
        `Failed to generate signed internal edital PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Generates and saves an ata de seleção PDF with signature
   */
  static async generateAndSaveSignedAtaSelecaoPDF(data: AtaSelecaoData, professorSignature?: string): Promise<string> {
    try {
      log.info({ projetoId: data.projeto.id }, 'Generating signed ata de seleção PDF')

      // Generate the base PDF
      let pdfBuffer = await PDFService.generateAtaSelecaoPDF(data)

      // Add professor signature if provided
      if (professorSignature) {
        pdfBuffer = await PDFService.addSignatureToPDF(pdfBuffer, professorSignature, 'professor')
      }

      // Save the final PDF
      const objectName = await PDFService.saveAtaSelecaoPDF(data.projeto.id, pdfBuffer)

      log.info({ projetoId: data.projeto.id, objectName }, 'Signed ata de seleção PDF generated and saved')
      return objectName
    } catch (error) {
      log.error({ error, projetoId: data.projeto.id }, 'Error generating signed ata de seleção PDF')
      throw new Error(
        `Failed to generate signed ata de seleção PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
