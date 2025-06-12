import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: 'src/tests/setup.ts',
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      NODE_ENV: 'test',
      CAS_SERVER_URL_PREFIX: 'https://test-cas.example.com',
      SERVER_URL: 'https://test-server.example.com/api',
      CLIENT_URL: 'https://test-client.example.com',
      MINIO_ENDPOINT: 'localhost',
      MINIO_PORT: '9000',
      MINIO_ACCESS_KEY: 'test',
      MINIO_SECRET_KEY: 'test',
      MINIO_BUCKET_NAME: 'test-bucket',
      NEXT_PUBLIC_APP_URL: 'https://test-app.example.com',
      SKIP_ENV_VALIDATION: 'false',
    },
  },
})
