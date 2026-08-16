import { db } from '../src/server/db'
import { periodoInscricaoTable, projetoTable } from '../src/server/db/schema'
import { eq, inArray } from 'drizzle-orm'

async function run() {
  const periodId = 17
  const projectIds = [22, 25]

  // Update Period 17 to 2026.SEMESTRE_2
  await db
    .update(periodoInscricaoTable)
    .set({
      ano: 2026,
      semestre: 'SEMESTRE_2',
      dataInicio: new Date('2026-08-01T00:00:00.000Z'),
      dataFim: new Date('2026-08-15T23:59:59.000Z'),
    })
    .where(eq(periodoInscricaoTable.id, periodId))

  console.log(`Updated period ${periodId} to 2026.SEMESTRE_2 and set dates to Aug 2026.`)

  // Update Projects 22 and 25 to 2026.SEMESTRE_2
  await db
    .update(projetoTable)
    .set({
      ano: 2026,
      semestre: 'SEMESTRE_2',
    })
    .where(inArray(projetoTable.id, projectIds))

  console.log(`Updated projects ${projectIds.join(', ')} to 2026.SEMESTRE_2.`)
  process.exit(0)
}

run()
