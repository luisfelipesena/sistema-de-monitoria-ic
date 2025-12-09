import type { db } from '@/server/db'
import { BusinessError, NotFoundError } from '@/server/lib/errors'
import minioClient, { bucketName } from '@/server/lib/minio'
import { logger } from '@/utils/logger'
import { v4 as uuidv4 } from 'uuid'
import { createPublicPdfRepository } from './public-pdf-repository'

const log = logger.child({ context: 'PublicPdfService' })

type Database = typeof db

/**
 * Service for generating and validating public PDF access tokens.
 * These tokens allow external users (PROGRAD, department heads) to access
 * project PDFs without authentication.
 */
export function createPublicPdfService(db: Database) {
  const repo = createPublicPdfRepository(db)

  return {
    /**
     * Generate a public access token for a project PDF.
     * The token expires after the specified number of days (default 30).
     */
    async generatePublicToken(
      projetoId: number,
      userId: number,
      expirationDays: number = 30
    ): Promise<{ token: string; url: string; expiresAt: Date }> {
      // Verify project exists and has a signed PDF
      const projeto = await repo.findProjetoById(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      // Check if project has signed document
      const signedDoc = await repo.findSignedDocumentByProjetoId(projetoId)
      if (!signedDoc) {
        throw new BusinessError(
          'Projeto não possui documento PDF assinado. O projeto precisa estar assinado para gerar link público.',
          'NO_SIGNED_PDF'
        )
      }

      // Generate token
      const token = uuidv4()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expirationDays)

      // Store token in database
      await repo.createPublicPdfToken({
        projetoId,
        token,
        expiresAt,
        createdByUserId: userId,
      })

      // Generate public URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const url = `${baseUrl}/api/public/projeto-pdf/${token}`

      log.info({ projetoId, token, expiresAt }, 'Public PDF token generated')

      return { token, url, expiresAt }
    },

    /**
     * Validate a public token and return the presigned URL for the PDF.
     */
    async getPresignedUrlByToken(
      token: string
    ): Promise<{ url: string; projeto: { titulo: string; ano: number; semestre: string } }> {
      // Find and validate token
      const tokenData = await repo.findValidToken(token)
      if (!tokenData) {
        throw new NotFoundError('Token', token)
      }

      // Check expiration
      if (new Date() > tokenData.expiresAt) {
        throw new BusinessError('Token expirado. Solicite um novo link de acesso.', 'TOKEN_EXPIRED')
      }

      // Update last access time
      await repo.updateTokenAccessTime(token)

      // Find the signed PDF file
      const signedDoc = await repo.findSignedDocumentByProjetoId(tokenData.projetoId)
      if (!signedDoc || !signedDoc.fileId) {
        throw new NotFoundError('PDF do projeto', tokenData.projetoId)
      }

      // Generate presigned URL with extended expiration (1 hour for download)
      const presignedUrl = await minioClient.presignedGetObject(bucketName, signedDoc.fileId, 60 * 60, {
        'Content-Disposition': 'inline',
        'Content-Type': 'application/pdf',
      })

      log.info({ projetoId: tokenData.projetoId, token }, 'Public PDF accessed via token')

      return {
        url: presignedUrl,
        projeto: {
          titulo: tokenData.projeto.titulo,
          ano: tokenData.projeto.ano,
          semestre: tokenData.projeto.semestre,
        },
      }
    },

    /**
     * Generate public tokens for multiple projects (batch operation).
     * Returns a map of projetoId -> url.
     */
    async generateBatchTokens(
      projetoIds: number[],
      userId: number,
      expirationDays: number = 30
    ): Promise<Map<number, { url: string; success: boolean; error?: string }>> {
      const results = new Map<number, { url: string; success: boolean; error?: string }>()

      for (const projetoId of projetoIds) {
        try {
          const { url } = await this.generatePublicToken(projetoId, userId, expirationDays)
          results.set(projetoId, { url, success: true })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
          results.set(projetoId, { url: '', success: false, error: errorMessage })
          log.warn({ projetoId, error: errorMessage }, 'Failed to generate public token for project')
        }
      }

      return results
    },

    /**
     * List all active tokens for a project.
     */
    async listProjectTokens(projetoId: number) {
      return repo.findActiveTokensByProjetoId(projetoId)
    },

    /**
     * Revoke a specific token.
     */
    async revokeToken(token: string, userId: number) {
      await repo.revokeToken(token)
      log.info({ token, userId }, 'Public PDF token revoked')
      return { success: true }
    },
  }
}

export type PublicPdfService = ReturnType<typeof createPublicPdfService>
