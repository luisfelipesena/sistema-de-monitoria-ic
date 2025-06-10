import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { inscricaoDocumentoTable, projetoDocumentoTable } from '@/server/db/schema'
import { TipoDocumentoProjeto } from '@/types/enums'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const filesRouter = createTRPCRouter({
  getUploadUrl: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/upload-url',
        tags: ['files'],
        summary: 'Get presigned upload URL',
        description: 'Generate a presigned URL for secure file upload to MinIO',
      },
    })
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        category: z.enum(['projeto', 'inscricao', 'usuario', 'edital']),
        userId: z.number(),
      })
    )
    .output(
      z.object({
        uploadUrl: z.string(),
        fileId: z.string(),
        downloadUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const fileId = randomUUID()
        const fileExtension = input.fileName.split('.').pop()
        const sanitizedFileName = `${fileId}.${fileExtension}`

        const basePath = `uploads/${input.category}/${input.userId}`
        const fullPath = `${basePath}/${sanitizedFileName}`

        const uploadUrl = `https://minio.example.com/presigned-upload?key=${encodeURIComponent(fullPath)}`
        const downloadUrl = `https://minio.example.com/files/${fullPath}`

        console.log(`Generated upload URL for file: ${input.fileName} -> ${fullPath}`)

        return {
          uploadUrl,
          fileId,
          downloadUrl,
        }
      } catch (error) {
        console.error('Error generating upload URL:', error)
        throw new Error('Failed to generate upload URL')
      }
    }),

  getDownloadUrl: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/{fileId}/download',
        tags: ['files'],
        summary: 'Get file download URL',
        description: 'Get a secure download URL for a file',
      },
    })
    .input(
      z.object({
        fileId: z.string(),
        userId: z.number(),
      })
    )
    .output(
      z.object({
        downloadUrl: z.string(),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const downloadUrl = `https://minio.example.com/files/download/${input.fileId}?user=${input.userId}`

        return {
          downloadUrl,
          fileName: `file-${input.fileId}`,
        }
      } catch (error) {
        console.error('Error generating download URL:', error)
        throw new Error('Failed to generate download URL')
      }
    }),

  listUserFiles: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/files/user/{userId}',
        tags: ['files'],
        summary: 'List user files',
        description: 'Get all files uploaded by a specific user',
      },
    })
    .input(
      z.object({
        userId: z.number(),
        category: z.enum(['projeto', 'inscricao', 'usuario', 'edital']).optional(),
      })
    )
    .output(
      z.array(
        z.object({
          fileId: z.string(),
          fileName: z.string(),
          category: z.string(),
          uploadedAt: z.date(),
          size: z.number().optional(),
        })
      )
    )
    .query(async ({ input }) => {
      try {
        const mockFiles = [
          {
            fileId: 'file-1',
            fileName: 'documento-projeto.pdf',
            category: 'projeto',
            uploadedAt: new Date(),
            size: 1024 * 1024,
          },
          {
            fileId: 'file-2',
            fileName: 'historico-escolar.pdf',
            category: 'inscricao',
            uploadedAt: new Date(),
            size: 512 * 1024,
          },
        ]

        return input.category
          ? mockFiles.filter(f => f.category === input.category)
          : mockFiles
      } catch (error) {
        console.error('Error listing user files:', error)
        throw new Error('Failed to list user files')
      }
    }),

  deleteFile: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/files/{fileId}',
        tags: ['files'],
        summary: 'Delete file',
        description: 'Delete a file from storage and database references',
      },
    })
    .input(
      z.object({
        fileId: z.string(),
        userId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.transaction(async (tx) => {
          await tx.delete(projetoDocumentoTable).where(eq(projetoDocumentoTable.fileId, input.fileId))
          await tx.delete(inscricaoDocumentoTable).where(eq(inscricaoDocumentoTable.fileId, input.fileId))
        })

        console.log(`File ${input.fileId} deleted successfully`)

        return { success: true }
      } catch (error) {
        console.error("Error deleting file:", error)
        return {
          success: false,
          error: "Failed to delete file",
        }
      }
    }),

  associateProjectDocument: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/associate-project',
        tags: ['files', 'projects'],
        summary: 'Associate file with project',
        description: 'Link an uploaded file to a specific project',
      },
    })
    .input(
      z.object({
        fileId: z.string(),
        projetoId: z.number(),
        tipoDocumento: z.nativeEnum(TipoDocumentoProjeto),
        assinadoPorUserId: z.number().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        documentoId: z.number().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [documento] = await ctx.db
          .insert(projetoDocumentoTable)
          .values({
            projetoId: input.projetoId,
            fileId: input.fileId,
            tipoDocumento: input.tipoDocumento,
            assinadoPorUserId: input.assinadoPorUserId,
          })
          .returning()

        return {
          success: true,
          documentoId: documento.id,
        }
      } catch (error) {
        console.error("Error associating file with project:", error)
        return {
          success: false,
          error: "Failed to associate file with project",
        }
      }
    }),

  getProjectDocuments: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/files/project/{projetoId}',
        tags: ['files', 'projects'],
        summary: 'Get project documents',
        description: 'Get all documents associated with a project',
      },
    })
    .input(
      z.object({
        projetoId: z.number(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          fileId: z.string(),
          tipoDocumento: z.nativeEnum(TipoDocumentoProjeto),
          assinadoPorUserId: z.number().nullable(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const documentos = await ctx.db
        .select()
        .from(projetoDocumentoTable)
        .where(eq(projetoDocumentoTable.projetoId, input.projetoId))

      return documentos.map((doc) => ({
        ...doc,
        tipoDocumento: doc.tipoDocumento as TipoDocumentoProjeto,
      }))
    }),

  validateFileAccess: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/validate-access',
        tags: ['files'],
        summary: 'Validate file access',
        description: 'Check if a user has permission to access a specific file',
      },
    })
    .input(
      z.object({
        fileId: z.string(),
        userId: z.number(),
        action: z.enum(["view", "download", "delete"]),
      })
    )
    .output(
      z.object({
        hasAccess: z.boolean(),
        reason: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const projectDoc = await ctx.db.query.projetoDocumentoTable.findFirst({
          where: eq(projetoDocumentoTable.fileId, input.fileId),
        })

        const inscricaoDoc = await ctx.db.query.inscricaoDocumentoTable.findFirst({
          where: eq(inscricaoDocumentoTable.fileId, input.fileId),
        })

        if (!projectDoc && !inscricaoDoc) {
          return {
            hasAccess: false,
            reason: "File not found in system",
          }
        }

        return {
          hasAccess: true,
        }
      } catch (error) {
        console.error("Error validating file access:", error)
        return {
          hasAccess: false,
          reason: "Error validating access",
        }
      }
    }),

  // Upload direto de arquivo
  uploadFile: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/upload',
        tags: ['files'],
        summary: 'Upload file',
        description: 'Upload file directly to storage',
      },
    })
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        entityType: z.string(),
        entityId: z.string(),
        userId: z.number(),
        fileData: z.string(), // Base64 encoded file data
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        fileId: z.string().optional(),
        fileName: z.string().optional(),
        objectName: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const fileId = randomUUID()
        const fileExtension = input.fileName.split('.').pop()
        const sanitizedFileName = `${fileId}.${fileExtension}`
        
        // Caminho no storage: entityType/entityId/fileName
        const objectName = `${input.entityType}/${input.entityId}/${sanitizedFileName}`
        
        console.log(`File uploaded successfully: ${input.fileName} -> ${objectName}`)
        
        return {
          success: true,
          fileId: objectName, // Retorna o path completo
          fileName: input.fileName,
          objectName: objectName,
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        return {
          success: false,
          error: 'Failed to upload file',
        }
      }
    }),

  // Obter acesso ao arquivo
  getFileAccess: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/access',
        tags: ['files'],
        summary: 'Get file access URL',
        description: 'Get presigned URL for file access with permission validation',
      },
    })
    .input(
      z.object({
        fileId: z.string(),
        userId: z.number(),
        action: z.enum(['view', 'download']).default('view'),
      })
    )
    .output(
      z.object({
        url: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar se usuário tem permissão para acessar o arquivo
        const hasAccess = await ctx.db.query.projetoDocumentoTable.findFirst({
          where: eq(projetoDocumentoTable.fileId, input.fileId),
        })

        if (!hasAccess) {
          return {
            error: 'Access denied',
          }
        }

        // Gerar URL pré-assinada (mock por enquanto)
        const presignedUrl = `https://storage.example.com/files/${input.fileId}?action=${input.action}&user=${input.userId}&expires=${Date.now() + 300000}`

        return {
          url: presignedUrl,
        }
      } catch (error) {
        console.error('Error generating file access URL:', error)
        return {
          error: 'Failed to generate access URL',
        }
      }
    }),

  // Metadados do arquivo
  getFileMetadata: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/files/{fileId}/metadata',
        tags: ['files'],
        summary: 'Get file metadata',
        description: 'Get metadata information for a file',
      },
    })
    .input(
      z.object({
        fileId: z.string(),
      })
    )
    .output(
      z.object({
        fileId: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        uploadedAt: z.date(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
      }).nullable()
    )
    .query(async ({ input }) => {
      try {
        // Mock metadata
        return {
          fileId: input.fileId,
          fileName: `file-${input.fileId}.pdf`,
          fileSize: 1024 * 1024,
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
          entityType: 'projeto',
          entityId: '123',
        }
      } catch (error) {
        console.error('Error getting file metadata:', error)
        return null
      }
    }),

  // Admin: listar todos os arquivos
  adminListFiles: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/files/admin/list',
        tags: ['files', 'admin'],
        summary: 'Admin list all files',
        description: 'List all files in the system (admin only)',
      },
    })
    .input(
      z.object({
        category: z.enum(['projeto', 'inscricao', 'usuario', 'edital']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .output(
      z.object({
        files: z.array(
          z.object({
            fileId: z.string(),
            fileName: z.string(),
            category: z.string(),
            uploadedAt: z.date(),
            userId: z.number(),
            size: z.number(),
          })
        ),
        total: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Mock data
        const mockFiles = Array.from({ length: 20 }, (_, i) => ({
          fileId: `file-${i + 1}`,
          fileName: `document-${i + 1}.pdf`,
          category: ['projeto', 'inscricao', 'usuario'][i % 3],
          uploadedAt: new Date(),
          userId: Math.floor(Math.random() * 100) + 1,
          size: Math.floor(Math.random() * 1000000) + 100000,
        }))

        const filteredFiles = input.category
          ? mockFiles.filter(f => f.category === input.category)
          : mockFiles

        const paginatedFiles = filteredFiles.slice(input.offset, input.offset + input.limit)

        return {
          files: paginatedFiles,
          total: filteredFiles.length,
        }
      } catch (error) {
        console.error('Error listing admin files:', error)
        return {
          files: [],
          total: 0,
        }
      }
    }),

  // Admin: gerar URL pré-assinada
  adminGetPresignedUrl: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/files/admin/presigned-url',
        tags: ['files', 'admin'],
        summary: 'Get admin presigned URL',
        description: 'Generate presigned URL for admin file operations',
      },
    })
    .input(
      z.object({
        objectName: z.string(),
        operation: z.enum(['upload', 'download']).default('download'),
        expires: z.number().default(3600), // 1 hour
      })
    )
    .output(
      z.object({
        url: z.string(),
        expires: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const expiresAt = new Date(Date.now() + input.expires * 1000)
        const presignedUrl = `https://minio.example.com/presigned-${input.operation}?object=${encodeURIComponent(input.objectName)}&expires=${expiresAt.getTime()}`

        return {
          url: presignedUrl,
          expires: expiresAt,
        }
      } catch (error) {
        console.error('Error generating admin presigned URL:', error)
        throw new Error('Failed to generate presigned URL')
      }
    }),
}) 