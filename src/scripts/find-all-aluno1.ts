import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { like } from 'drizzle-orm'

async function main() {
  console.log("🔍 Searching database for ALL users/alunos matching 'aluno1'...")

  const users = await db.query.userTable.findMany({
    where: like(userTable.username, '%aluno1%'),
  })
  console.log("Users matching 'aluno1':", users)

  const alunos = await db.query.alunoTable.findMany({
    with: { user: true, endereco: true },
  })

  console.log('\n--- ALL ALUNOS IN DB ---')
  for (const a of alunos) {
    console.log({
      id: a.id,
      userId: a.userId,
      username: a.user?.username,
      email: a.emailInstitucional || a.user?.email,
      nomeCompleto: a.nomeCompleto,
      cpf: a.cpf,
      rg: a.rg,
      matricula: a.matricula,
      banco: a.banco,
      agencia: a.agencia,
      conta: a.conta,
      digitoConta: a.digitoConta,
      telefone: a.telefone,
      endereco: a.endereco,
    })
  }

  console.log('\n--- ALL INSCRICOES IN DB ---')
  const inscricoes = await db.query.inscricaoTable.findMany({
    with: {
      aluno: true,
      projeto: true,
    },
  })

  for (const i of inscricoes) {
    console.log({
      inscricaoId: i.id,
      alunoId: i.alunoId,
      alunoNome: i.aluno?.nomeCompleto,
      alunoBanco: i.aluno?.banco,
      tipoVaga: i.tipoVagaPretendida,
      projetoTitulo: i.projeto?.titulo,
    })
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
