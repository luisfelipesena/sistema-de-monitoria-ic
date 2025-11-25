import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import * as Minio from 'minio'

const log = logger.child({
  context: 'Minio',
})

// Parse endpoint - handle both "host" and "host:port" formats
function parseMinioEndpoint(endpoint: string): { host: string; port: number; useSSL: boolean } {
  // Remove protocol if present
  const cleanEndpoint = endpoint.replace(/^https?:\/\//, '')

  // Check if it's a production domain (use SSL) or local (no SSL)
  const isLocal = cleanEndpoint.includes('localhost') || cleanEndpoint.includes('127.0.0.1')

  // Parse host:port
  if (cleanEndpoint.includes(':')) {
    const [host, portStr] = cleanEndpoint.split(':')
    return { host, port: parseInt(portStr, 10), useSSL: !isLocal }
  }

  // Default port based on SSL
  return { host: cleanEndpoint, port: isLocal ? 9000 : 443, useSSL: !isLocal }
}

const { host, port, useSSL } = parseMinioEndpoint(env.MINIO_ENDPOINT)

log.info(`MinIO: endpoint=${host}, port=${port}, useSSL=${useSSL}`)

// Inicializar o cliente Minio
const minioClient = new Minio.Client({
  endPoint: host,
  port,
  useSSL,
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
