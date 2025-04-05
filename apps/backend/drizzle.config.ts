import type { Config } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is not set');
}

export default {
  schema: './src/database/schema.ts',
  out: './src/database/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    table: 'migrations',
  },
} satisfies Config;
