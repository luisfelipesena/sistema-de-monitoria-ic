import { db } from '../src/server/db'
import { periodoInscricaoTable } from '../src/server/db/schema'
import { eq } from 'drizzle-orm'

async function run() {
  const periodId = 17

  // Set dataFim to a future date, say 2026-08-15
  const futureDate = new Date('2026-08-15T23:59:59.000Z')

  await db.update(periodoInscricaoTable).set({ dataFim: futureDate }).where(eq(periodoInscricaoTable.id, periodId))

  console.log(`Successfully extended period ${periodId} dataFim to ${futureDate.toISOString()}`)
  process.exit(0)
}

run()
