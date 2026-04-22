import { BusinessError } from '@/server/lib/errors'
import minioClient, { bucketName } from '@/server/lib/minio'
import type { AnexoIIIInputs, AnexoITermoInputs, AnexoIVInputs } from '@/types'
import { logger } from '@/utils/logger'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { PDFDocument } from 'pdf-lib'
import React, { type ReactElement } from 'react'

const log = logger.child({ context: 'InscricaoPdfGenerator' })

const ERROR_CODES = {
  pdfGenerationFailed: 'INSCRICAO_PDF_GENERATION_FAILED',
  minioUploadFailed: 'INSCRICAO_MINIO_UPLOAD_FAILED',
  minioDownloadFailed: 'INSCRICAO_MINIO_DOWNLOAD_FAILED',
} as const

const toDocumentElement = (element: ReactElement): ReactElement<DocumentProps> => {
  return element as ReactElement<DocumentProps>
}

export function createInscricaoPdfGenerator() {
  return {
    async renderAnexoIII(inputs: AnexoIIIInputs): Promise<Buffer> {
      try {
        const { AnexoIIIInscricaoBolsistaTemplate } = await import('@/server/lib/pdfTemplates/anexo-iii-inscricao-bolsista')
        const element = toDocumentElement(React.createElement(AnexoIIIInscricaoBolsistaTemplate, { data: inputs }))
        return await renderToBuffer(element)
      } catch (error) {
        log.error({ error }, 'Erro ao gerar Anexo III')
        throw new BusinessError('Falha ao gerar Anexo III', ERROR_CODES.pdfGenerationFailed)
      }
    },

    async renderAnexoIV(inputs: AnexoIVInputs): Promise<Buffer> {
      try {
        const { AnexoIVInscricaoVoluntarioTemplate } = await import('@/server/lib/pdfTemplates/anexo-iv-inscricao-voluntario')
        const element = toDocumentElement(React.createElement(AnexoIVInscricaoVoluntarioTemplate, { data: inputs }))
        return await renderToBuffer(element)
      } catch (error) {
        log.error({ error }, 'Erro ao gerar Anexo IV')
        throw new BusinessError('Falha ao gerar Anexo IV', ERROR_CODES.pdfGenerationFailed)
      }
    },

    async renderAnexoITermo(inputs: AnexoITermoInputs): Promise<Buffer> {
      try {
        const { AnexoITermoCompromissoMonitorTemplate } = await import(
          '@/server/lib/pdfTemplates/anexo-i-termo-compromisso-monitor'
        )
        const element = toDocumentElement(
          React.createElement(AnexoITermoCompromissoMonitorTemplate, { data: inputs })
        )
        return await renderToBuffer(element)
      } catch (error) {
        log.error({ error }, 'Erro ao gerar Anexo I (Termo de Compromisso)')
        throw new BusinessError('Falha ao gerar Termo de Compromisso', ERROR_CODES.pdfGenerationFailed)
      }
    },

    // Combines the anexo (III or IV) followed by the Termo Compromisso into a single PDF
    async mergePdfs(buffers: Buffer[]): Promise<Buffer> {
      try {
        const merged = await PDFDocument.create()
        for (const buf of buffers) {
          const src = await PDFDocument.load(buf)
          const pages = await merged.copyPages(src, src.getPageIndices())
          for (const page of pages) merged.addPage(page)
        }
        const out = await merged.save()
        return Buffer.from(out)
      } catch (error) {
        log.error({ error }, 'Erro ao fazer merge dos PDFs da inscrição')
        throw new BusinessError('Falha ao combinar PDFs', ERROR_CODES.pdfGenerationFailed)
      }
    },

    async uploadToMinio(inscricaoId: number, suffix: string, buffer: Buffer): Promise<string> {
      const objectName = `inscricao/${inscricaoId}/${suffix}.pdf`
      try {
        await minioClient.putObject(bucketName, objectName, buffer, buffer.length, {
          'Content-Type': 'application/pdf',
          'X-Amz-Meta-Inscricao-Id': inscricaoId.toString(),
          'X-Amz-Meta-Kind': suffix,
          'X-Amz-Meta-Generated-At': new Date().toISOString(),
        })
        return objectName
      } catch (error) {
        log.error({ error, objectName }, 'Erro ao enviar PDF da inscrição para o MinIO')
        throw new BusinessError('Falha ao armazenar PDF da inscrição', ERROR_CODES.minioUploadFailed)
      }
    },

    async presignedUrl(objectName: string): Promise<string> {
      try {
        await minioClient.statObject(bucketName, objectName)
        return await minioClient.presignedGetObject(bucketName, objectName, 24 * 60 * 60)
      } catch (error) {
        log.error({ error, objectName }, 'Erro ao gerar presigned URL')
        throw new BusinessError('PDF não encontrado no storage', ERROR_CODES.minioDownloadFailed)
      }
    },
  }
}

export type InscricaoPdfGenerator = ReturnType<typeof createInscricaoPdfGenerator>
