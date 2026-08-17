import { db } from '../src/server/db'
import { editalTable } from '../src/server/db/schema'
import { eq } from 'drizzle-orm'

async function run() {
  const editalId = 4
  const edital = await db.query.editalTable.findFirst({
    where: eq(editalTable.id, editalId),
    with: {
      periodoInscricao: true,
    },
  })

  console.log('Edital Details:')
  console.log(JSON.stringify(edital, null, 2))

  if (edital?.periodoInscricao) {
    const p = edital.periodoInscricao
    const projects = await db.query.projetoTable.findMany({
      where: (table, { and, eq }) =>
        and(eq(table.ano, p.ano), eq(table.semestre, p.semestre), eq(table.status, 'APPROVED')),
    })
    console.log(`Approved projects for ${p.ano}.${p.semestre}:`)
    console.log(projects.map((pr) => ({ id: pr.id, titulo: pr.titulo, status: pr.status })))
  }

  process.exit(0)
}

run()
