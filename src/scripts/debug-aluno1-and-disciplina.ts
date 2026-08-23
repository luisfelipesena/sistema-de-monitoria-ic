import { db } from '@/server/db'
import { alunoTable, inscricaoTable, userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  console.log('🔍 Inspecting database for aluno1 and projects...')

  // 1. Inspect aluno1
  const user = await db.query.userTable.findFirst({
    where: eq(userTable.email, 'aluno1@ufba.br'),
  })
  console.log('User aluno1:', user)

  if (user) {
    const aluno = await db.query.alunoTable.findFirst({
      where: eq(alunoTable.userId, user.id),
      with: { endereco: true },
    })
    console.log('Aluno profile for aluno1:', aluno)
  }

  // 2. Inspect Inscriptions for aluno1
  if (user) {
    const aluno = await db.query.alunoTable.findFirst({
      where: eq(alunoTable.userId, user.id),
    })
    if (aluno) {
      const inscricoes = await db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.alunoId, aluno.id),
        with: {
          projeto: {
            with: {
              disciplinas: {
                with: { disciplina: true },
              },
            },
          },
        },
      })
      console.log('Inscricoes of aluno1:', JSON.stringify(inscricoes, null, 2))
    }
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
