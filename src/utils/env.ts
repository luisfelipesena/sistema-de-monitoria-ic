
export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  CAS_SERVER_URL_PREFIX: process.env.CAS_SERVER_URL_PREFIX || 'https://autenticacao.ufba.br/ca',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:3000/api',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin',
  MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME || 'monitoria-arquivos',
};
