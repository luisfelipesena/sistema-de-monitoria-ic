import { db } from '../src/server/db'
import { projetoTable } from '../src/server/db/schema'
import { inArray } from 'drizzle-orm'

async function run() {
  const projects = await db
    .select()
    .from(projetoTable)
    .where(inArray(projetoTable.id, [22, 25]))
  console.log(JSON.stringify(projects, null, 2))
  process.exit(0)
}

run()
