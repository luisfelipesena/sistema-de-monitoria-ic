import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { createFileService } from '@/server/services/file/file-service'
import { fileActionSchema } from '@/types'
import { BusinessError } from '@/server/lib/errors'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

const getMinioErrorCode = (error: unknown): string | undefined => {
  if (error && typeof error === 'object' && 'code' in error) {
    const { code } = error as { code?: unknown }
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

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

export const fileRouter = createTRPCRouter({
  getAdminFileList: adminProtectedProcedure.query(async ({ ctx }) => {
    try {
      const service = createFileService(ctx.db)
      return service.listAdminFiles()
    } catch (_error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar arquivos' })
    }
  }),

  deleteAdminFile: adminProtectedProcedure
    .input(z.object({ objectName: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createFileService(ctx.db)
        return service.deleteAdminFile(input.objectName)
      } catch (error) {
        if (error instanceof Error) {
          const code = getMinioErrorCode(error)
          if (error.message.includes('NoSuchKey') || code === 'NoSuchKey') {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado no bucket' })
          }
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor ao excluir o arquivo' })
      }
    }),

  getAdminFilePresignedUrl: adminProtectedProcedure
    .input(z.object({ objectName: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createFileService(ctx.db)
        return service.getAdminPresignedUrl(input.objectName)
      } catch (error) {
        if (error instanceof Error) {
          const code = getMinioErrorCode(error)
          if (error.message.includes('NoSuchKey') || code === 'NoSuchKey') {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado' })
          }
        }
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
        fileData: z.string(),
        mimeType: z.string(),
        entityType: z.string(),
        entityId: z.string().optional(),
      })
    )
    .output(uploadFileResponseSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!input.fileName || !input.fileData || !input.entityType) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Nome do arquivo, dados do arquivo ou tipo de entidade não fornecidos',
          })
        }

        const service = createFileService(ctx.db)
        return service.uploadFile(
          input.fileName,
          input.fileData,
          input.mimeType,
          input.entityType,
          ctx.user.id,
          input.entityId
        )
      } catch (error) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' })
      }
    }),

  uploadFileAdmin: adminProtectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(),
        mimeType: z.string(),
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!input.fileName || !input.fileData || !input.entityType || !input.entityId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Arquivo, tipo de entidade ou ID de entidade não fornecidos',
          })
        }

        const service = createFileService(ctx.db)
        return service.uploadFile(
          input.fileName,
          input.fileData,
          input.mimeType,
          input.entityType,
          ctx.user.id,
          input.entityId
        )
      } catch (error) {
        if (error instanceof TRPCError) throw error
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
    .input(z.object({ fileId: z.string(), action: fileActionSchema }))
    .output(z.string())
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createFileService(ctx.db)
        return service.getPresignedUrl(input.fileId, input.action, ctx.user.id, ctx.user.role)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as 'NOT_FOUND' | 'FORBIDDEN' | 'BAD_REQUEST', message: error.message })
        }

        if (error instanceof Error) {
          const code = getMinioErrorCode(error)
          if (error.message.includes('NoSuchKey') || code === 'NoSuchKey') {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado' })
          }
        }

        if (error instanceof z.ZodError) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Dados inválidos' })
        }

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
    .input(z.object({ fileId: z.string() }))
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createFileService(ctx.db)
        return service.deleteFile(input.fileId)
      } catch (error) {
        if (error instanceof Response) {
          throw error
        }

        if (error instanceof Error) {
          const code = getMinioErrorCode(error)
          if (error.message.includes('NoSuchKey') || code === 'NoSuchKey') {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Arquivo não encontrado no bucket' })
          }
        }
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
    .input(z.object({ fileId: z.string() }))
    .output(fileListItemSchema)
    .query(async ({ input, ctx }) => {
      const service = createFileService(ctx.db)
      return service.getFileMetadata(input.fileId)
    }),

  getProjetoFiles: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/files/projeto/{projetoId}',
        tags: ['files'],
        summary: 'Get project files',
        description: 'Get all files associated with a project',
      },
    })
    .input(z.object({ projetoId: z.number() }))
    .output(z.array(fileListItemSchema))
    .query(async ({ input, ctx }) => {
      try {
        const service = createFileService(ctx.db)
        return service.getProjetoFiles(input.projetoId, ctx.user.id, ctx.user.role)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as 'NOT_FOUND' | 'FORBIDDEN' | 'BAD_REQUEST', message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao buscar arquivos do projeto' })
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
    .input(z.object({ projetoId: z.number() }))
    .output(z.object({ url: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createFileService(ctx.db)
        return service.getProjetoPdfUrl(input.projetoId, ctx.user.id, ctx.user.role)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as 'NOT_FOUND' | 'FORBIDDEN' | 'BAD_REQUEST', message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao buscar PDF do projeto' })
      }
    }),
})
