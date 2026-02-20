/**
 * One-time migration: convert BMP signatures to PNG for user_id=61 (Luciano)
 * and projects 423/425.
 *
 * Usage: npx dotenv -e .env -- tsx src/scripts/fix-bmp-signatures.ts
 */
import sharp from 'sharp'
import { db } from '@/server/db'
import { projetoTable, userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

async function convertBmpToPng(dataUrl: string): Promise<string | null> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
  if (!match) return null

  const mimeType = match[1]
  if (mimeType === 'image/png' || mimeType === 'image/jpeg') {
    console.log(`  Already ${mimeType}, skipping`)
    return null
  }

  console.log(`  Converting from ${mimeType} to PNG...`)
  const inputBuffer = Buffer.from(match[2], 'base64')
  const pngBuffer = await sharp(inputBuffer).png().toBuffer()
  console.log(`  Converted: ${inputBuffer.length} bytes -> ${pngBuffer.length} bytes`)
  return `data:image/png;base64,${pngBuffer.toString('base64')}`
}

async function main() {
  const TARGET_USER_ID = 61
  const TARGET_PROJETOS = [423, 425]

  // Fix user's default signature
  console.log(`\n--- Fixing default signature for user_id=${TARGET_USER_ID} ---`)
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

  // Fix project signatures
  for (const projetoId of TARGET_PROJETOS) {
    console.log(`\n--- Fixing signature for projeto_id=${projetoId} ---`)
    const [projeto] = await db.select().from(projetoTable).where(eq(projetoTable.id, projetoId))
    if (!projeto?.assinaturaProfessor) {
      console.log('  No professor signature found')
      continue
    }

    const converted = await convertBmpToPng(projeto.assinaturaProfessor)
    if (!converted) continue

    await db.update(projetoTable).set({ assinaturaProfessor: converted }).where(eq(projetoTable.id, projetoId))
    console.log('  Project signature updated in DB')
  }

  console.log('\n--- Done ---')
  console.log('NOTE: You may want to regenerate PDFs for projects 423 and 425 via the admin panel or a separate script.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
