import { defineConfig } from 'drizzle-kit'

import { env } from './src/utils/env'

console.log(env.DATABASE_URL)
export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
})
