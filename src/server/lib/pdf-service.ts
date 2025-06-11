import { renderToBuffer } from '@react-pdf/renderer'
import { MonitoriaFormTemplate, type MonitoriaFormData } from '@/components/features/projects/MonitoriaFormTemplate'
import { PDFDocument } from 'pdf-lib'
import { logger } from '@/utils/logger'
import minioClient, { bucketName } from '@/server/lib/minio'

const log = logger.child({ context: 'PDFService' })

export class PDFService {
  /**
   * Generates a PDF from the MonitoriaFormTemplate with the provided data
   */
  static async generateProjetoPDF(data: MonitoriaFormData): Promise<Buffer> {
    try {
      log.info({ projetoId: data.projetoId }, 'Generating PDF from template')
      
      // Create the PDF using @react-pdf/renderer
      const pdfBuffer = await renderToBuffer(MonitoriaFormTemplate({ data }))
      
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
      
      // Calculate signature position
      const signatureWidth = 150
      const signatureHeight = 60
      const pageWidth = firstPage.getWidth()
      
      // Position signatures differently for professor vs admin
      let x: number, y: number
      if (signatureType === 'professor') {
        // Professor signature goes at bottom left
        x = 50
        y = 50
      } else {
        // Admin signature goes at bottom right
        x = pageWidth - signatureWidth - 50
        y = 50
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
    adminSignature?: string
  ): Promise<string> {
    try {
      log.info({ projetoId: data.projetoId }, 'Generating signed project PDF')
      
      // Generate the base PDF
      let pdfBuffer = await this.generateProjetoPDF(data)
      
      // Add professor signature if provided
      if (professorSignature) {
        pdfBuffer = await this.addSignatureToPDF(pdfBuffer, professorSignature, 'professor')
      }
      
      // Add admin signature if provided
      if (adminSignature) {
        pdfBuffer = await this.addSignatureToPDF(pdfBuffer, adminSignature, 'admin')
      }
      
      // Save the final PDF
      const objectName = await this.saveProjetoPDF(data.projetoId!, pdfBuffer)
      
      log.info({ projetoId: data.projetoId, objectName }, 'Signed project PDF generated and saved')
      return objectName
    } catch (error) {
      log.error({ error, projetoId: data.projetoId }, 'Error generating signed project PDF')
      throw new Error(`Failed to generate signed PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}