import { db } from '@/server/db'
import { ataSelecaoTable, assinaturaDocumentoTable, projetoTable } from '@/server/db/schema'

async function main() {
  const atas = await db.select().from(ataSelecaoTable)
  console.log('--- ATAS ---')
  console.log(JSON.stringify(atas, null, 2))

  const assinaturas = await db.select().from(assinaturaDocumentoTable)
  console.log('\n--- ASSINATURAS ---')
  console.log(JSON.stringify(assinaturas, null, 2))

  const projetos = await db.select().from(projetoTable)
  console.log('\n--- PROJETOS ---')
  console.log(
    JSON.stringify(
      projetos.map((p) => ({ id: p.id, status: p.status, professorResponsavelId: p.professorResponsavelId })),
      null,
      2
    )
  )
}

main().catch(console.error)
