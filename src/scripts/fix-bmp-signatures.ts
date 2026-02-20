/**
 * One-time migration: convert BMP signatures to PNG for user_id=61 (Luciano)
 * and projects 423/425. Also regenerates the PDFs in MinIO.
 *
 * Usage: npx dotenv -e .env -- tsx src/scripts/fix-bmp-signatures.ts
 */
import sharp from 'sharp'
import { db } from '@/server/db'
import {
  atividadeProjetoTable,
  disciplinaTable,
  periodoInscricaoTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import { PDFService } from '@/server/lib/pdf-service'
import { and, eq } from 'drizzle-orm'

async function convertBmpToPng(dataUrl: string): Promise<string | null> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
  if (!match) return null

  const mimeType = match[1]
  if (mimeType === 'image/png' || mimeType === 'image/jpeg') {
    console.log(`  Already ${mimeType}, skipping conversion`)
    return null
  }

  console.log(`  Converting from ${mimeType} to PNG...`)
  const inputBuffer = Buffer.from(match[2], 'base64')
  const pngBuffer = await sharp(inputBuffer).png().toBuffer()
  console.log(`  Converted: ${inputBuffer.length} bytes -> ${pngBuffer.length} bytes`)
  return `data:image/png;base64,${pngBuffer.toString('base64')}`
}

async function regeneratePdf(projetoId: number) {
  console.log(`  Regenerating PDF for projeto_id=${projetoId}...`)

  const projeto = await db.query.projetoTable.findFirst({
    where: eq(projetoTable.id, projetoId),
    with: {
      departamento: true,
      professorResponsavel: true,
    },
  })

  if (!projeto) {
    console.log(`  ERROR: Projeto ${projetoId} not found`)
    return
  }

  if (!projeto.assinaturaProfessor) {
    console.log(`  ERROR: Projeto ${projetoId} has no professor signature`)
    return
  }

  const disciplinas = await db
    .select({
      id: disciplinaTable.id,
      nome: disciplinaTable.nome,
      codigo: disciplinaTable.codigo,
    })
    .from(disciplinaTable)
    .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
    .where(eq(projetoDisciplinaTable.projetoId, projetoId))

  const atividades = await db.query.atividadeProjetoTable.findMany({
    where: eq(atividadeProjetoTable.projetoId, projetoId),
  })

  const periodo = await db.query.periodoInscricaoTable.findFirst({
    where: and(
      eq(periodoInscricaoTable.ano, projeto.ano),
      eq(periodoInscricaoTable.semestre, projeto.semestre)
    ),
    with: {
      edital: { columns: { numeroEdital: true, publicado: true } },
    },
  })

  const numeroEdital = periodo?.numeroEditalPrograd || periodo?.edital?.numeroEdital

  const pdfData = {
    titulo: projeto.titulo,
    descricao: projeto.descricao,
    departamento: projeto.departamento ?? undefined,
    professorResponsavel: projeto.professorResponsavel,
    ano: projeto.ano,
    semestre: projeto.semestre,
    numeroEdital,
    tipoProposicao: projeto.tipoProposicao,
    bolsasSolicitadas: projeto.bolsasSolicitadas,
    voluntariosSolicitados: projeto.voluntariosSolicitados,
    cargaHorariaSemana: projeto.cargaHorariaSemana,
    numeroSemanas: projeto.numeroSemanas,
    publicoAlvo: projeto.publicoAlvo,
    estimativaPessoasBenificiadas: projeto.estimativaPessoasBenificiadas || undefined,
    disciplinas,
    professoresParticipantes: projeto.professoresParticipantes || '',
    atividades: atividades.map((a) => a.descricao),
    assinaturaProfessor: projeto.assinaturaProfessor,
    dataAssinaturaProfessor: new Date().toLocaleDateString('pt-BR'),
    signingMode: 'professor' as const,
    projetoId: projeto.id,
  }

  const objectName = await PDFService.generateAndSaveSignedProjetoPDF(
    pdfData,
    projeto.assinaturaProfessor
  )
  console.log(`  PDF regenerated and saved: ${objectName}`)
}

async function main() {
  const TARGET_USER_ID = 61
  const TARGET_PROJETOS = [423, 425]

  // Step 1: Fix user's default signature
  console.log(`\n=== Step 1: Fix default signature for user_id=${TARGET_USER_ID} ===`)
  const [user] = await db.select().from(userTable).where(eq(userTable.id, TARGET_USER_ID))
  if (user?.assinaturaDefault) {
    const converted = await convertBmpToPng(user.assinaturaDefault)
    if (converted) {
      await db.update(userTable).set({ assinaturaDefault: converted }).where(eq(userTable.id, TARGET_USER_ID))
      console.log('  User default signature updated')
    }
  } else {
    console.log('  No default signature found')
  }

  // Step 2: Fix project signatures in DB
  for (const projetoId of TARGET_PROJETOS) {
    console.log(`\n=== Step 2: Fix signature in DB for projeto_id=${projetoId} ===`)
    const [projeto] = await db.select().from(projetoTable).where(eq(projetoTable.id, projetoId))
    if (!projeto?.assinaturaProfessor) {
      console.log('  No professor signature found, skipping')
      continue
    }

    const converted = await convertBmpToPng(projeto.assinaturaProfessor)
    if (!converted) continue

    await db.update(projetoTable).set({ assinaturaProfessor: converted }).where(eq(projetoTable.id, projetoId))
    console.log('  Project signature updated in DB')
  }

  // Step 3: Regenerate PDFs in MinIO with the now-PNG signatures
  for (const projetoId of TARGET_PROJETOS) {
    console.log(`\n=== Step 3: Regenerate PDF in MinIO for projeto_id=${projetoId} ===`)
    await regeneratePdf(projetoId)
  }

  console.log('\n=== All done! Signatures converted and PDFs regenerated. ===')
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
