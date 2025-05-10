import { FileListItem } from '@/routes/api/files/admin/-admin-types'
import minioClient, { bucketName } from '@/server/lib/minio'
import { createTRPCRouter, privateProcedure } from '@/server/trpc/init'
import * as Minio from 'minio'


export const listFilesRouter = privateProcedure.query(async () => {
  const objectsStream = minioClient.listObjectsV2(bucketName, undefined, true)
  const statPromises: Promise<FileListItem | null>[] = []

  return await new Promise<FileListItem[]>((resolve, reject) => {
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
                originalFilename: stat.metaData['original-filename'],
                mimeType: stat.metaData['content-type'],
              }
            } catch {
              return null
            }
          })()
        )
      }
    })
    objectsStream.on('error', (err: Error) => {
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
      resolve(files)
    })
  })
})

export const listFilesRouterTrpc = createTRPCRouter({
  list: listFilesRouter,
}) 