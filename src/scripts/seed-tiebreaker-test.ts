import { db } from '@/server/db'
import { inscricaoTable, alunoTable, userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

async function seedTiebreakerTest() {
  console.log('🌱 Seeding tiebreaker test data for carlos.silva@ufba.br...')

  // 1. Find professor user
  const profUsers = await db.select().from(userTable).where(eq(userTable.email, 'carlos.silva@ufba.br'))
  if (profUsers.length === 0) {
    console.error('❌ User carlos.silva@ufba.br not found')
    process.exit(1)
  }

  // 2. Find students
  const anaUsers = await db.select().from(userTable).where(eq(userTable.email, 'anaclara@ufba.br'))
  const brunoUsers = await db.select().from(userTable).where(eq(userTable.email, 'brunosouza@ufba.br'))

  if (anaUsers.length === 0 || brunoUsers.length === 0) {
    console.error('❌ Students not found')
    process.exit(1)
  }

  const anaAlunos = await db.select().from(alunoTable).where(eq(alunoTable.userId, anaUsers[0].id))
  const brunoAlunos = await db.select().from(alunoTable).where(eq(alunoTable.userId, brunoUsers[0].id))

  if (anaAlunos.length === 0 || brunoAlunos.length === 0) {
    console.error('❌ Aluno profiles not found')
    process.exit(1)
  }

  const anaAluno = anaAlunos[0]
  const brunoAluno = brunoAlunos[0]

  // Set CR to 8.00 for both
  await db.update(alunoTable).set({ cr: 8.0 }).where(eq(alunoTable.id, anaAluno.id))
  await db.update(alunoTable).set({ cr: 8.0 }).where(eq(alunoTable.id, brunoAluno.id))

  // Find candidate registrations
  const anaInscricoes = await db.select().from(inscricaoTable).where(eq(inscricaoTable.alunoId, anaAluno.id))
  const brunoInscricoes = await db.select().from(inscricaoTable).where(eq(inscricaoTable.alunoId, brunoAluno.id))

  if (anaInscricoes.length > 0) {
    // Ana Clara: Selecao = 8.0, Disciplina = 9.0, CR = 8.0 => Nota Final = (8*5 + 9*3 + 8*2)/10 = 8.3
    await db
      .update(inscricaoTable)
      .set({
        notaSelecao: '8.0',
        notaDisciplina: '9.0',
        coeficienteRendimento: '8.0',
        notaFinal: '8.3',
      })
      .where(eq(inscricaoTable.id, anaInscricoes[0].id))
  }

  if (brunoInscricoes.length > 0) {
    // Bruno Souza: Selecao = 8.6, Disciplina = 8.0, CR = 8.0 => Nota Final = (8.6*5 + 8*3 + 8*2)/10 = 8.3
    await db
      .update(inscricaoTable)
      .set({
        notaSelecao: '8.6',
        notaDisciplina: '8.0',
        coeficienteRendimento: '8.0',
        notaFinal: '8.3',
      })
      .where(eq(inscricaoTable.id, brunoInscricoes[0].id))
  }

  console.log('✅ Tiebreaker test data populated successfully!')
  console.log('📌 Ana Clara:   Nota Final = 8.3 | Seleção = 8.0 | Disciplina = 9.0 | CR = 8.00')
  console.log('📌 Bruno Souza: Nota Final = 8.3 | Seleção = 8.6 | Disciplina = 8.0 | CR = 8.00')
  console.log('🏆 Ordem Esperada: 1º Ana Clara (Nota Disciplina 9.0 > 8.0), 2º Bruno Souza')
  process.exit(0)
}

seedTiebreakerTest().catch((err) => {
  console.error('Error seeding tiebreaker test data:', err)
  process.exit(1)
})
