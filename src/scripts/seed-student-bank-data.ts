import { db } from "@/server/db"
import { alunoTable, userTable } from "@/server/db/schema"
import { eq } from "drizzle-orm"

async function main() {
  console.log("🌱 Updating bank data for test students...")

  const alunosData = [
    { email: "aluno1@ufba.br", banco: "077 - Banco Inter", agencia: "0001", conta: "16215539", digitoConta: "5" },
    { email: "aluno2@ufba.br", banco: "001 - Banco do Brasil", agencia: "1234", conta: "987654", digitoConta: "3" },
    { email: "aluno3@ufba.br", banco: "341 - Itaú Unibanco", agencia: "0456", conta: "12345", digitoConta: "8" },
    { email: "aluno4@ufba.br", banco: "104 - Caixa Econômica", agencia: "0890", conta: "54321", digitoConta: "1" },
    { email: "lucas.ferreira@ufba.br", banco: "077 - Banco Inter", agencia: "0001", conta: "88776655", digitoConta: "9" },
  ]

  for (const item of alunosData) {
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.email, item.email),
    })

    if (user) {
      const aluno = await db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, user.id),
      })

      if (aluno) {
        await db
          .update(alunoTable)
          .set({
            banco: item.banco,
            agencia: item.agencia,
            conta: item.conta,
            digitoConta: item.digitoConta,
          })
          .where(eq(alunoTable.id, aluno.id))
        console.log(`✅ Updated bank data for ${item.email}`)
      }
    }
  }

  console.log("🎉 Student bank data seeding completed!")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
