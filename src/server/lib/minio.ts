import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import * as Minio from 'minio'

const log = logger.child({
  context: 'Minio',
})

// Inicializar o cliente Minio
const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
})

export const bucketName = env.MINIO_BUCKET_NAME

/**
 * Verifica se o bucket existe e cria se necessário
 */
export async function ensureBucketExists(bucket: string = bucketName): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(bucket)
    if (!exists) {
      log.info(`Bucket ${bucket} não existe. Criando...`)
      await minioClient.makeBucket(bucket)
      log.info(`Bucket ${bucket} criado com sucesso.`)
    } else {
      log.info(`Bucket ${bucket} já existe.`)
    }
  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)), 'Erro ao verificar ou criar bucket:')
    throw error
  }
}

export default minioClient
