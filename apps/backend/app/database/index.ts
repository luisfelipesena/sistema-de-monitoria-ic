import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

/**
 * @deprecated Use the `db` instance from the Hono context instead.
 */
export const db = drizzle(pool, { schema });

export * from './schema';
export * from './type-utils';

export { schema as drizzleSchema };
