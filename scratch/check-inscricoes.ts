import { db } from '../src/server/db'
import { inscricaoTable } from '../src/server/db/schema'

async function run() {
  const inscricoes = await db.select().from(inscricaoTable)
  console.log('All registrations in DB:')
  console.log(JSON.stringify(inscricoes, null, 2))
  process.exit(0)
}

run()
