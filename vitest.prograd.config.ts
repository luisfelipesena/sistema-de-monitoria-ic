import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['src/tests/integration/prograd.integration.ts'],
    fileParallelism: false,
    testTimeout: 30000,
    env: { DATABASE_URL: process.env.PROGRAD_TEST_DATABASE_URL || '', NODE_ENV: 'test' },
  },
})
