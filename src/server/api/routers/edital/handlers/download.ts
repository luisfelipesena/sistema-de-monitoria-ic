import { protectedProcedure } from '@/server/api/trpc'
import { editalTable } from '@/server/db/schema'
import getMinioClient, { bucketName } from '@/server/lib/minio'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'EditalRouter.Download' })

export const getEditalPdfUrlHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/editais/{id}/pdf-url',
      tags: ['editais'],
      summary: 'Get edital PDF URL',
      description: 'Get a pre-signed URL to download the edital PDF',
    },
  })
  .input(
    z.object({
      id: z.number(),
    })
  )
  .output(z.object({ url: z.string().nullable() }))
  .query(async ({ input, ctx }) => {
    try {
      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
      })

      if (!edital) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Edital não encontrado',
        })
      }

      // Determinar qual arquivo usar baseado no tipo
      let objectName: string | null = null

      if (edital.tipo === 'DCC' && edital.fileIdAssinado) {
        objectName = edital.fileIdAssinado
      } else if (edital.tipo === 'PROGRAD' && edital.fileIdProgradOriginal) {
        objectName = edital.fileIdProgradOriginal
      }

      if (!objectName) {
        log.warn({ editalId: input.id }, 'Edital sem arquivo PDF associado')
        return { url: null }
      }

      // Gerar URL pré-assinada para download
      const url = await getMinioClient().presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60) // 7 dias

      log.info({ editalId: input.id, objectName }, 'URL de download do edital gerada')
      return { url }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      log.error(error, 'Erro ao gerar URL de download do edital')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao gerar link de download',
      })
    }
  })

export const checkEditalFileHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/editais/{id}/check-file',
      tags: ['editais'],
      summary: 'Check edital file',
      description: 'Check if edital has a PDF file available',
    },
  })
  .input(
    z.object({
      id: z.number(),
    })
  )
  .output(
    z.object({
      hasFile: z.boolean(),
      fileType: z.enum(['SIGNED', 'PROGRAD', 'NONE']),
    })
  )
  .query(async ({ input, ctx }) => {
    try {
      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
      })

      if (!edital) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Edital não encontrado',
        })
      }

      if (edital.tipo === 'DCC' && edital.fileIdAssinado) {
        return { hasFile: true, fileType: 'SIGNED' }
      }
      if (edital.tipo === 'PROGRAD' && edital.fileIdProgradOriginal) {
        return { hasFile: true, fileType: 'PROGRAD' }
      }

      return { hasFile: false, fileType: 'NONE' }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      log.error(error, 'Erro ao verificar arquivo do edital')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao verificar arquivo',
      })
    }
  })
