import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import { env } from "../config/env"
import runDatabaseMigrations from "./migrate"
import * as schema from "./schema"

console.log(env.DATABASE_URL)
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
})

export const db = drizzle(pool, { schema })

export * from "./schema"
export * from "./type-utils"

export { schema as drizzleSchema, runDatabaseMigrations }