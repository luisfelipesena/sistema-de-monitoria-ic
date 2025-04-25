import { env } from '@/utils/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const DATABASE_URL =
  env.DATABASE_URL || 'postgresql://user:password@host:port/db';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const combinedSchema = { ...schema };

export const db = drizzle(pool, { schema: combinedSchema });
