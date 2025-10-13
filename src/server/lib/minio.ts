import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import * as Minio from 'minio'

const log = logger.child({
  context: 'Minio',
})

// Lazy initialization of MinIO client to avoid build-time errors
let minioClient: Minio.Client | null = null

function getMinioClient(): Minio.Client {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    })
  }
  return minioClient
}

export const getBucketName = () => env.MINIO_BUCKET_NAME
// Keep for backward compatibility but prefer getBucketName()
export const bucketName = process.env.SKIP_ENV_VALIDATION ? '' : env.MINIO_BUCKET_NAME

/**
 * Verifica se o bucket existe e cria se necessário
 */
export async function ensureBucketExists(bucket?: string): Promise<void> {
  const bucketToUse = bucket ?? getBucketName()
  try {
    const client = getMinioClient()
    const exists = await client.bucketExists(bucketToUse)
    if (!exists) {
      log.info(`Bucket ${bucketToUse} não existe. Criando...`)
      await client.makeBucket(bucketToUse)
      log.info(`Bucket ${bucketToUse} criado com sucesso.`)
    } else {
      log.info(`Bucket ${bucketToUse} já existe.`)
    }
  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)), 'Erro ao verificar ou criar bucket:')
    throw error
  }
}

// Export a function to get the client lazily
export default getMinioClient
