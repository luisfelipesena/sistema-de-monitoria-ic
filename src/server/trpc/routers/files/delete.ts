import minioClient, { bucketName } from '@/server/lib/minio'
import { createTRPCRouter, privateProcedure } from '@/server/trpc/init'
import { z } from 'zod'

const deleteBodySchema = z.object({
  objectName: z.string().min(1),
})

export const deleteFileRouter = privateProcedure
  .input(deleteBodySchema)
  .mutation(async ({ input }) => {
    await minioClient.removeObject(bucketName, input.objectName)
    return { message: 'Arquivo excluído com sucesso' }
  })

export const deleteFileRouterTrpc = createTRPCRouter({
  delete: deleteFileRouter,
}) 