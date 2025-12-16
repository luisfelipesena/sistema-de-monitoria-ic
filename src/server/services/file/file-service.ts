import type { db } from '@/server/db'
import { ForbiddenError, NotFoundError } from '@/server/lib/errors'
import minioClient, { bucketName, ensureBucketExists } from '@/server/lib/minio'
import type { FileAction, UserRole } from '@/types'
import { ADMIN, PROFESSOR } from '@/types'
import { logger } from '@/utils/logger'
import type * as Minio from 'minio'
import path from 'path'
import { Readable } from 'stream'
import { v4 as uuidv4 } from 'uuid'
import { createFileRepository } from './file-repository'

const log = logger.child({ context: 'FileService' })

type Database = typeof db

export interface FileListItem {
  objectName: string
  size: number
  lastModified: Date
  metaData: Record<string, string>
  originalFilename: string
  mimeType: string
}

function decodeFilename(encodedFilename: string | undefined): string {
  if (!encodedFilename) return ''

  try {
    return Buffer.from(encodedFilename, 'base64').toString('utf-8')
  } catch {
    return encodedFilename
  }
}

export function createFileService(db: Database) {
  const repo = createFileRepository(db)

  return {
    async listAdminFiles() {
      const objectsStream = minioClient.listObjectsV2(bucketName, undefined, true)
      const statPromises: Promise<FileListItem | null>[] = []

      return new Promise<FileListItem[]>((resolve) => {
        objectsStream.on('data', (obj: Minio.BucketItem) => {
          const objectName = obj.name
          if (objectName) {
            statPromises.push(
              (async () => {
                try {
                  const stat = await minioClient.statObject(bucketName, objectName)
                  return {
                    objectName,
                    size: stat.size,
                    lastModified: stat.lastModified,
                    metaData: stat.metaData,
                    originalFilename: decodeFilename(stat.metaData['original-filename']) || objectName,
                    mimeType: stat.metaData['content-type'] || 'application/octet-stream',
                  }
                } catch (statError) {
                  log.error({ objectName, error: statError }, 'Erro ao obter metadados do objeto MinIO')
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
    },

    async deleteAdminFile(objectName: string) {
      await minioClient.removeObject(bucketName, objectName)
      log.info({ objectName }, 'Arquivo excluído com sucesso')
      return { message: 'Arquivo excluído com sucesso' }
    },

    async getAdminPresignedUrl(objectName: string) {
      const presignedUrl = await minioClient.presignedGetObject(bucketName, objectName, 60 * 5)
      return { url: presignedUrl }
    },

    async uploadFile(
      fileName: string,
      fileData: string,
      mimeType: string,
      entityType: string,
      userId: number,
      entityId?: string
    ) {
      await ensureBucketExists()

      const fileId = uuidv4()
      const extension = path.extname(fileName)
      const finalEntityId = entityId || userId.toString()

      const encodedFileName = Buffer.from(fileName, 'utf-8').toString('base64')

      const metaData = {
        'Content-Type': mimeType || 'application/octet-stream',
        'X-Amz-Meta-Entity-Type': entityType,
        'X-Amz-Meta-Entity-Id': finalEntityId,
        'X-Amz-Meta-User-Id': String(userId),
        'X-Amz-Meta-Original-Filename': encodedFileName,
      }

      const objectName = `${entityType}/${finalEntityId}/${fileId}${extension}`

      const buffer = Buffer.from(fileData, 'base64')
      const fileStream = Readable.from(buffer)

      await minioClient.putObject(bucketName, objectName, fileStream, buffer.length, metaData)

      log.info({ fileId, objectName, entityType, entityId: finalEntityId, userId }, 'Arquivo enviado com sucesso')

      return {
        fileId: objectName,
        fileName: fileName,
        mimeType: mimeType,
        fileSize: buffer.length,
        objectName: objectName,
      }
    },

    async getPresignedUrl(fileId: string, action: FileAction, userId: number, userRole: UserRole) {
      const [aluno, professor, projetoDocumento] = await Promise.all([
        repo.findAlunoByFileId(fileId),
        repo.findProfessorByFileId(fileId),
        repo.findProjetoDocumentoByFileId(fileId),
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
        isAuthorized = true
      }

      if (userRole === ADMIN) {
        isAuthorized = true
      }

      if (!isAuthorized) {
        log.warn(`Unauthorized access attempt for fileId: ${fileId} by userId: ${userId}`)
        throw new ForbiddenError('Acesso não autorizado')
      }

      log.info(
        `Generating presigned URL for authorized access - fileId: ${fileId} by userId: ${userId}, action: ${action}`
      )

      const responseHeaders: Record<string, string> = {}
      if (action === 'view') {
        responseHeaders['Content-Disposition'] = 'inline'
        responseHeaders['Content-Type'] = 'application/pdf'
      }

      const presignedUrl = await minioClient.presignedGetObject(bucketName, fileId, 60 * 5, responseHeaders)

      return presignedUrl
    },

    async deleteFile(fileId: string) {
      await minioClient.removeObject(bucketName, fileId)
      log.info({ fileId }, 'Arquivo excluído com sucesso')
      return { message: 'Arquivo excluído com sucesso' }
    },

    async getFileMetadata(fileId: string) {
      const stat = await minioClient.statObject(bucketName, fileId)
      log.info({ objectName: fileId, size: stat.size }, 'Metadados obtidos')

      return {
        objectName: fileId,
        size: stat.size,
        lastModified: stat.lastModified,
        metaData: stat.metaData,
        originalFilename: decodeFilename(stat.metaData['original-filename']),
        mimeType: stat.metaData['content-type'],
      }
    },

    async getProjetoFiles(projetoId: number, userId: number, userRole: UserRole) {
      const projeto = await repo.findProjetoById(projetoId)

      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      let isAuthorized = false
      if (userRole === ADMIN) {
        isAuthorized = true
      } else if (userRole === PROFESSOR) {
        const professor = await repo.findProfessorByUserId(userId)
        if (professor && professor.id === projeto.professorResponsavelId) {
          isAuthorized = true
        }
      }

      if (!isAuthorized) {
        throw new ForbiddenError('Acesso negado aos arquivos deste projeto')
      }

      const prefix = `projetos/${projetoId}/`
      const objectsStream = minioClient.listObjectsV2(bucketName, prefix, true)
      const statPromises: Promise<FileListItem | null>[] = []

      return new Promise<FileListItem[]>((resolve, reject) => {
        objectsStream.on('data', (obj: Minio.BucketItem) => {
          const objectName = obj.name
          if (objectName) {
            statPromises.push(
              (async () => {
                try {
                  const stat = await minioClient.statObject(bucketName, objectName)
                  return {
                    objectName,
                    size: stat.size,
                    lastModified: stat.lastModified,
                    metaData: stat.metaData,
                    originalFilename: decodeFilename(stat.metaData['original-filename']) || objectName,
                    mimeType: stat.metaData['content-type'] || 'application/octet-stream',
                  }
                } catch (statError) {
                  log.error({ objectName, error: statError }, 'Erro ao obter metadados do objeto MinIO')
                  return null
                }
              })()
            )
          }
        })

        objectsStream.on('error', (err: Error) => {
          log.error(err, 'Erro ao listar arquivos do projeto')
          reject(err)
        })

        objectsStream.on('end', async () => {
          const results = await Promise.allSettled(statPromises)
          const files: FileListItem[] = []
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
              files.push(result.value)
            }
          })
          log.info({ projetoId, fileCount: files.length }, 'Arquivos do projeto recuperados')
          resolve(files)
        })
      })
    },

    async getProjetoPdfUrl(projetoId: number, userId: number, userRole: UserRole) {
      const prefix = `projetos/${projetoId}/`
      const objectsStream = minioClient.listObjectsV2(bucketName, prefix, true)

      return new Promise<{ url: string }>((resolve, reject) => {
        const projectFiles: Array<{ name: string; lastModified: Date; isNewPattern: boolean }> = []

        objectsStream.on('data', (obj: Minio.BucketItem) => {
          if (obj.name?.includes('propostas_assinadas') && obj.name.endsWith('.pdf')) {
            // Check for new pattern: {codigo}_{professor}_{ano}_{semestre}.pdf
            const isNewPattern = /_\d{4}_SEMESTRE_[12]\.pdf$/.test(obj.name || '')
            // Check for old pattern: proposta_{projetoId}_*.pdf
            const isOldPattern = obj.name.includes(`proposta_${projetoId}_`)

            if (isNewPattern || isOldPattern) {
              projectFiles.push({
                name: obj.name,
                lastModified: obj.lastModified || new Date(),
                isNewPattern,
              })
            }
          }
        })

        objectsStream.on('error', (err: Error) => {
          log.error(err, 'Erro ao listar arquivos do projeto')
          reject(err)
        })

        objectsStream.on('end', () => {
          ; (async () => {
            log.info({ projetoId, filesFound: projectFiles.length }, 'Arquivos encontrados para o projeto')

            if (projectFiles.length === 0) {
              log.warn({ projetoId, prefix }, 'Nenhum PDF encontrado para o projeto')
              reject(
                new NotFoundError(
                  'PDF do projeto',
                  `${projetoId} não encontrado. O projeto precisa estar assinado pelo professor.`
                )
              )
              return
            }

            // Prioritize new pattern files, then sort by lastModified
            const sortedFiles = projectFiles.sort((a, b) => {
              // New pattern files first
              if (a.isNewPattern && !b.isNewPattern) return -1
              if (!a.isNewPattern && b.isNewPattern) return 1
              // Then by lastModified (most recent first)
              return b.lastModified.getTime() - a.lastModified.getTime()
            })
            const latestFile = sortedFiles[0]

            if (!latestFile) {
              reject(new NotFoundError('PDF do projeto', 'não encontrado'))
              return
            }

            log.info({ projetoId, fileName: latestFile.name }, 'PDF mais recente selecionado')

            try {
              const projeto = await repo.findProjetoById(projetoId)

              if (!projeto) {
                reject(new NotFoundError('Projeto', projetoId))
                return
              }

              let isAuthorized = false
              if (userRole === ADMIN) {
                isAuthorized = true
              } else if (userRole === PROFESSOR) {
                const professor = await repo.findProfessorByUserId(userId)
                if (professor && professor.id === projeto.professorResponsavelId) {
                  isAuthorized = true
                }
              }

              if (!isAuthorized) {
                reject(new ForbiddenError('Acesso negado ao PDF deste projeto'))
                return
              }

              const presignedUrl = await minioClient.presignedGetObject(bucketName, latestFile.name, 60 * 5, {
                'Content-Disposition': 'inline',
                'Content-Type': 'application/pdf',
              })

              log.info(
                { projetoId, fileName: latestFile.name, lastModified: latestFile.lastModified },
                'PDF mais recente do projeto encontrado'
              )
              resolve({ url: presignedUrl })
            } catch (error) {
              log.error(error, 'Erro ao gerar URL presigned para PDF do projeto')
              reject(error)
            }
          })()
        })
      })
    },
  }
}

export type FileService = ReturnType<typeof createFileService>
