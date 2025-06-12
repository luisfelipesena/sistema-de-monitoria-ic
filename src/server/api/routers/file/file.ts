import { adminProtectedProcedure, protectedProcedure } from '@/server/api/trpc'
import { createTRPCRouter } from '@/server/api/trpc'
import { alunoTable, projetoDocumentoTable, professorTable, projetoTable } from '@/server/db/schema'
import { logger } from '@/utils/logger'
import { eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { env } from '@/utils/env'
import minioClient, { bucketName, ensureBucketExists } from '@/server/lib/minio'
import * as Minio from 'minio'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { Readable } from 'stream'

export const fileListItemSchema = z.object({
  objectName: z.string(),
  size: z.number(),
  lastModified: z.date(),
  metaData: z.record(z.string()),
  originalFilename: z.string(),
  mimeType: z.string(),
})

export const uploadFileResponseSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  objectName: z.string(),
})

export interface FileListItem {
  objectName: string
  size: number
  lastModified: Date
  metaData: Record<string, string>
  originalFilename: string
  mimeType: string
}

const log = logger.child({ context: 'FileRouter' })
export const fileRouter = createTRPCRouter({
  // Admin file management procedures
  getAdminFileList: adminProtectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id
      log.info({ adminUserId: userId }, 'Listando arquivos para admin...')

      const objectsStream = minioClient.listObjectsV2(bucketName, undefined, true)
      const statPromises: Promise<FileListItem | null>[] = []

      return new Promise<FileListItem[]>((resolve) => {
        objectsStream.on('data', (obj: Minio.BucketItem) => {
          if (obj.name) {
            statPromises.push(
              (async () => {
                try {
                  const stat = await minioClient.statObject(bucketName, obj.name!)
                  return {
                    objectName: obj.name!,
                    size: stat.size,
                    lastModified: stat.lastModified,
                    metaData: stat.metaData,
                    originalFilename: stat.metaData['original-filename'] || obj.name!,
                    mimeType: stat.metaData['content-type'] || 'application/octet-stream',
                  }
                } catch (statError) {
                  log.error({ objectName: obj.name, error: statError }, 'Erro ao obter metadados do objeto MinIO')
                  return null
                }
              })()
            )
          }
        })

        objectsStream.on('error', (err: Error) => {
          log.error(err, 'Erro ao listar objetos no MinIO')
        })

        objectsStream.on('end', async () => {
          const results = await Promise.allSettled(statPromises)
          const files: FileListItem[] = []
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
              files.push(result.value)
            }
          })
          resolve(files)
        })
      })
    } catch (error) {
      log.error(error, 'Erro ao listar arquivos')
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar arquivos' })
    }
  }),

  deleteAdminFile: adminProtectedProcedure
    .input(
      z.object({
        objectName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id
        const { objectName } = input

        log.info({ adminUserId: userId, objectName }, 'Excluindo arquivo...')

        await minioClient.removeObject(bucketName, objectName)

        log.info({ adminUserId: userId, objectName }, 'Arquivo excluído com sucesso.')

        return { message: 'Arquivo excluído com sucesso' }
      } catch (error) {
        if (error instanceof Error && error.message.includes('NoSuchKey')) {
          log.warn({ error }, 'Tentativa de excluir arquivo não encontrado')
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado no bucket' })
        }
        log.error(error, 'Erro ao excluir arquivo do MinIO')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor ao excluir o arquivo' })
      }
    }),

  getAdminFilePresignedUrl: adminProtectedProcedure
    .input(
      z.object({
        objectName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { objectName } = input

        const presignedUrl = await minioClient.presignedGetObject(
          bucketName,
          objectName,
          60 * 5 // 5 minutes validity
        )

        return { url: presignedUrl }
      } catch (error) {
        if (error instanceof Error && (error.message.includes('NoSuchKey') || (error as any).code === 'NoSuchKey')) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado' })
        }
        log.error(error, `Error generating presigned URL`)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao acessar o arquivo' })
      }
    }),

  uploadFile: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/upload',
        tags: ['files'],
        summary: 'Upload file',
        description: 'Upload a file to MinIO storage',
      },
    })
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file data
        mimeType: z.string(),
        entityType: z.string(),
        entityId: z.string().optional(),
      })
    )
    .output(uploadFileResponseSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id
        await ensureBucketExists()

        const { fileName, fileData, mimeType, entityType, entityId } = input

        if (!fileName || !fileData || !entityType) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Nome do arquivo, dados do arquivo ou tipo de entidade não fornecidos',
          })
        }

        const fileId = uuidv4()
        const extension = path.extname(fileName)
        const finalEntityId = entityId || userId.toString()

        const metaData = {
          'Content-Type': mimeType || 'application/octet-stream',
          'X-Amz-Meta-Entity-Type': entityType,
          'X-Amz-Meta-Entity-Id': finalEntityId,
          'X-Amz-Meta-User-Id': String(userId),
          'X-Amz-Meta-Original-Filename': fileName,
        }

        // Caminho no MinIO: entityType/entityId/fileId-originalFilename
        const objectName = `${entityType}/${finalEntityId}/${fileId}${extension}`

        // Converter base64 para buffer
        const buffer = Buffer.from(fileData, 'base64')
        const fileStream = Readable.from(buffer)

        await minioClient.putObject(bucketName, objectName, fileStream, buffer.length, metaData)

        log.info(
          {
            fileId,
            objectName,
            entityType,
            entityId: finalEntityId,
            userId,
          },
          'Arquivo enviado com sucesso'
        )

        return {
          fileId: objectName,
          fileName: fileName,
          mimeType: mimeType,
          fileSize: buffer.length,
          objectName: objectName,
        }
      } catch (error) {
        log.error(error, 'Erro no processamento do upload')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' })
      }
    }),

  uploadFileAdmin: adminProtectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file data
        mimeType: z.string(),
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id
        await ensureBucketExists()

        const { fileName, fileData, mimeType, entityType, entityId } = input

        if (!fileName || !fileData || !entityType || !entityId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Arquivo, tipo de entidade ou ID de entidade não fornecidos',
          })
        }

        const fileId = uuidv4()
        const extension = path.extname(fileName)
        const metaData = {
          'Content-Type': mimeType || 'application/octet-stream',
          'X-Amz-Meta-Entity-Type': entityType,
          'X-Amz-Meta-Entity-Id': entityId,
          'X-Amz-Meta-User-Id': String(userId),
          'X-Amz-Meta-Original-Filename': fileName,
        }

        // Caminho no MinIO: entityType/entityId/fileId-originalFilename
        const objectName = `${entityType}/${entityId}/${fileId}${extension}`

        // Converter base64 para buffer
        const buffer = Buffer.from(fileData, 'base64')
        const fileStream = Readable.from(buffer)

        await minioClient.putObject(bucketName, objectName, fileStream, buffer.length, metaData)

        log.info(
          {
            fileId,
            objectName,
            entityType,
            entityId,
            userId,
          },
          'Arquivo enviado com sucesso'
        )

        return {
          fileId: objectName,
          fileName: fileName,
          mimeType: mimeType,
          fileSize: buffer.length,
          objectName: objectName,
        }
      } catch (error) {
        log.error(error, 'Erro no processamento do upload')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' })
      }
    }),

  getPresignedUrlMutation: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/presigned-url',
        tags: ['files'],
        summary: 'Get presigned url',
        description: 'Retrieve the presigned url',
      },
    })
    .input(
      z.object({
        fileId: z.string(),
        action: z.enum(['view', 'download']),
      })
    )
    .output(z.string())
    .mutation(async ({ input, ctx }) => {
      try {
        const { fileId, action } = input
        const userId = ctx.user.id
        const db = ctx.db

        // We need to verify the user has permission to access this file.
        // For now, we check if the fileId is referenced in their user-related tables.
        // This logic should be expanded as more document types are added.

        const [aluno, professor, projetoDocumento] = await Promise.all([
          db.query.alunoTable.findFirst({
            where: or(eq(alunoTable.historicoEscolarFileId, fileId), eq(alunoTable.comprovanteMatriculaFileId, fileId)),
          }),
          db.query.professorTable.findFirst({
            where: or(
              eq(professorTable.curriculumVitaeFileId, fileId),
              eq(professorTable.comprovanteVinculoFileId, fileId)
            ),
          }),
          db.query.projetoDocumentoTable.findFirst({
            where: eq(projetoDocumentoTable.fileId, fileId),
            with: {
              projeto: {
                with: {
                  professoresParticipantes: true,
                },
              },
            },
          }),
        ])

        let isAuthorized = false
        if (aluno && aluno.userId === userId) {
          isAuthorized = true
        } else if (professor && professor.userId === userId) {
          isAuthorized = true
        } else if (
          projetoDocumento &&
          (projetoDocumento.projeto?.professorResponsavelId === userId ||
            projetoDocumento.projeto?.professoresParticipantes.some((p) => p.professorId === userId))
        ) {
          // Basic check if user is related to the project of the document
          // NOTE: This assumes the user ID is the same as the professor ID, which needs careful management.
          // A better approach would be to check against the professor table's user_id.
          isAuthorized = true
        }

        // Admins can access any file.
        if (ctx.user.role === 'admin') {
          isAuthorized = true
        }

        if (!isAuthorized) {
          log.warn(`Unauthorized access attempt for fileId: ${fileId} by userId: ${userId}`)
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso não autorizado' })
        }

        log.info(
          `Generating presigned URL for authorized access - fileId: ${fileId} by userId: ${userId}, action: ${action}`
        )

        const bucketName = env.MINIO_BUCKET_NAME

        // Para visualização, usar headers que permitem display inline
        const responseHeaders: Record<string, string> = {}
        if (action === 'view') {
          responseHeaders['Content-Disposition'] = 'inline'
          responseHeaders['Content-Type'] = 'application/pdf'
        }

        const presignedUrl = await minioClient.presignedGetObject(
          bucketName,
          fileId,
          60 * 5, // 5 minutes validity
          responseHeaders
        )

        return presignedUrl
      } catch (error) {
        // Tratamento específico para arquivo não encontrado no MinIO
        if (error instanceof Error && (error.message.includes('NoSuchKey') || (error as any).code === 'NoSuchKey')) {
          log.warn(
            { fileId: (error as any).fileId, userId: (error as any).userId, error },
            'Arquivo não encontrado no MinIO'
          )
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado' })
        }

        if (error instanceof z.ZodError) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Dados inválidos' })
        }

        log.error(error, `Error generating presigned URL`)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao acessar o arquivo' })
      }
    }),
  deleteFileMutation: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/files/{fileId}',
        tags: ['files'],
        summary: 'Delete file',
        description: 'Delete a file',
      },
    })
    .input(
      z.object({
        fileId: z.string(),
      })
    )
    .output(
      z.object({
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id
        const { fileId } = input

        log.info({ adminUserId: userId, fileId }, 'Excluindo arquivo...')

        await minioClient.removeObject(bucketName, fileId)

        log.info({ adminUserId: userId, fileId }, 'Arquivo excluído com sucesso.')

        return { message: 'Arquivo excluído com sucesso' }
      } catch (error) {
        if (error instanceof Response) {
          throw error // Return the error response from the middleware
        }

        // Handle specific MinIO errors if needed (e.g., file not found)
        if (error instanceof Error && error.message.includes('NoSuchKey')) {
          log.warn({ error }, 'Tentativa de excluir arquivo não encontrado')
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado no bucket' })
        }
        log.error(error, 'Erro ao excluir arquivo do MinIO')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor ao excluir o arquivo' })
      }
    }),
  getFileMetadataQuery: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/files/{fileId}',
        tags: ['files'],
        summary: 'Get file metadata',
        description: 'Get metadata for a specific file',
      },
    })
    .input(
      z.object({
        fileId: z.string(),
      })
    )
    .output(fileListItemSchema)
    .query(async ({ input, ctx }) => {
      const { fileId } = input
      const userId = ctx.user.id
      log.info({ adminUserId: userId, fileId }, 'Obtendo metadados do arquivo...')

      const stat = await minioClient.statObject(bucketName, fileId)
      log.info({ objectName: fileId, size: stat.size, stat }, 'Metadados obtidos.')

      return {
        objectName: fileId,
        size: stat.size,
        lastModified: stat.lastModified,
        metaData: stat.metaData,
        originalFilename: stat.metaData['original-filename'],
        mimeType: stat.metaData['content-type'],
      }
    }),

  getProjetoPdfUrl: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/projeto-pdf',
        tags: ['files'],
        summary: 'Get project PDF URL',
        description: 'Get presigned URL for project PDF document',
      },
    })
    .input(
      z.object({
        projetoId: z.number(),
      })
    )
    .output(z.object({ url: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { projetoId } = input
        const userId = ctx.user.id

        log.info({ projetoId, userId }, 'Buscando PDF do projeto...')

        // Listar arquivos do projeto
        const prefix = `projetos/${projetoId}/`
        const objectsStream = minioClient.listObjectsV2(bucketName, prefix, true)

        return new Promise<{ url: string }>((resolve, reject) => {
          const projectFiles: Array<{ name: string; lastModified: Date }> = []

          objectsStream.on('data', (obj: Minio.BucketItem) => {
            if (obj.name?.includes('propostas_assinadas') && obj.name.endsWith('.pdf')) {
              projectFiles.push({
                name: obj.name,
                lastModified: obj.lastModified || new Date(),
              })
            }
          })

          objectsStream.on('error', (err: Error) => {
            log.error(err, 'Erro ao listar arquivos do projeto')
            reject(new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao buscar arquivos do projeto' }))
          })

          objectsStream.on('end', async () => {
            if (projectFiles.length === 0) {
              log.warn({ projetoId }, 'Nenhum PDF encontrado para o projeto')
              reject(new TRPCError({ code: 'NOT_FOUND', message: 'PDF do projeto não encontrado' }))
              return
            }

            // Pegar o arquivo mais recente baseado na data de modificação
            const latestFile = projectFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())[0]

            if (!latestFile) {
              reject(new TRPCError({ code: 'NOT_FOUND', message: 'PDF do projeto não encontrado' }))
              return
            }

            try {
              // Verificar autorização baseada no projeto
              const _db = ctx.db
              const projeto = await ctx.db.query.projetoTable.findFirst({
                where: eq(projetoTable.id, projetoId),
                with: {
                  professorResponsavel: true,
                },
              })

              if (!projeto) {
                reject(new TRPCError({ code: 'NOT_FOUND', message: 'Projeto não encontrado' }))
                return
              }

              // Verificar permissões
              let isAuthorized = false
              if (ctx.user.role === 'admin') {
                isAuthorized = true
              } else if (ctx.user.role === 'professor') {
                const professor = await ctx.db.query.professorTable.findFirst({
                  where: eq(professorTable.userId, userId),
                })
                if (professor && professor.id === projeto.professorResponsavelId) {
                  isAuthorized = true
                }
              }

              if (!isAuthorized) {
                reject(new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado ao PDF deste projeto' }))
                return
              }

              // Gerar URL presigned
              const presignedUrl = await minioClient.presignedGetObject(
                bucketName,
                latestFile.name,
                60 * 5, // 5 minutos
                {
                  'Content-Disposition': 'inline',
                  'Content-Type': 'application/pdf',
                }
              )

              log.info(
                {
                  projetoId,
                  fileName: latestFile.name,
                  lastModified: latestFile.lastModified,
                },
                'PDF mais recente do projeto encontrado'
              )
              resolve({ url: presignedUrl })
            } catch (error) {
              log.error(error, 'Erro ao gerar URL presigned para PDF do projeto')
              reject(new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao acessar PDF do projeto' }))
            }
          })
        })
      } catch (error) {
        log.error(error, 'Erro ao buscar PDF do projeto')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao buscar PDF do projeto' })
      }
    }),
})
