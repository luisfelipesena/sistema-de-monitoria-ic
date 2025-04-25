import { defineConfig } from 'drizzle-kit';
import { env } from './src/utils/env';

const dbUrl = env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default defineConfig({
  schema: './src/server/database/schema.ts',
  out: './src/server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
