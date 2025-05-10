import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  CAS_SERVER_URL_PREFIX: z.string(),
  SERVER_URL: z.string(),
  CLIENT_URL: z.string(),
  NODE_ENV: z.string(),
  MINIO_ENDPOINT: z.string(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET_NAME: z.string(),
});

const isWeb = typeof window !== 'undefined';
export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL || '',
  CAS_SERVER_URL_PREFIX:
    process.env.CAS_SERVER_URL_PREFIX || 'https://autenticacao.ufba.br/ca',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:3000/api',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || '',
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || '',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || '',
  MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME || '',
});
