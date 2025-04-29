import { env } from '@/utils/env';
import * as Minio from 'minio';


// Inicializar o cliente Minio
const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const bucketName = env.MINIO_BUCKET_NAME || 'monitoria-arquivos';

/**
 * Verifica se o bucket existe e cria se necessário
 */
export async function ensureBucketExists(bucket: string = bucketName): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      console.log(`Bucket ${bucket} não existe. Criando...`);
      await minioClient.makeBucket(bucket);
      console.log(`Bucket ${bucket} criado com sucesso.`);
    } else {
      console.log(`Bucket ${bucket} já existe.`);
    }
  } catch (error) {
    console.error('Erro ao verificar ou criar bucket:', error);
    throw error;
  }
}

export default minioClient; 