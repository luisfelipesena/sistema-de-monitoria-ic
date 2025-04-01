import { NodePgDatabase } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"

const runDatabaseMigrations = async (database: NodePgDatabase, migrationsFolder: string) => {
  await migrate(database, {
    migrationsFolder,
    migrationsTable: "migrations",
  })
}

export default runDatabaseMigrations