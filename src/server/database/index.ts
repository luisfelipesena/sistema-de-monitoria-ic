import { env } from '@/utils/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const combinedSchema = { ...schema };

const db = drizzle(pool, { schema: combinedSchema });

export { db };
