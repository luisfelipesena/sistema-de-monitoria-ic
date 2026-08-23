import { db } from "@/server/db"
import { alunoTable, disciplinaTable, enderecoTable, inscricaoTable, userTable } from "@/server/db/schema"
import { createInscricaoPdfService } from "@/server/services/inscricao/pdf/inscricao-pdf-service"
import { eq } from "drizzle-orm"

async function main() {
  console.log("🛠️ Fixing aluno1 profile, bank data, address, and discipline names...")

  // 1. Fix discipline MATC99
  const matc99 = await db.query.disciplinaTable.findFirst({
    where: eq(disciplinaTable.codigo, "MATC99"),
  })
  if (matc99) {
    await db
      .update(disciplinaTable)
      .set({ nome: "Introdução à Programação" })
      .where(eq(disciplinaTable.id, matc99.id))
    console.log("✅ Updated MATC99 name to 'Introdução à Programação'")
  }

  // 2. Fix aluno1 user & profile
  const aluno1User = await db.query.userTable.findFirst({
    where: eq(userTable.email, "aluno1@ufba.br"),
  })

  if (!aluno1User) {
    throw new Error("aluno1@ufba.br not found")
  }

  // Create address if needed
  let enderecoId: number
  const aluno1 = await db.query.alunoTable.findFirst({
    where: eq(alunoTable.userId, aluno1User.id),
    with: { endereco: true },
  })

  if (aluno1?.enderecoId) {
    enderecoId = aluno1.enderecoId
    await db
      .update(enderecoTable)
      .set({
        rua: "Rua Barão de Itapoan",
        numero: 142,
        bairro: "Ondina",
        cidade: "Salvador",
        estado: "BA",
        cep: "40140-060",
      })
      .where(eq(enderecoTable.id, enderecoId))
  } else {
    const [newAddr] = await db
      .insert(enderecoTable)
      .values({
        rua: "Rua Barão de Itapoan",
        numero: 142,
        bairro: "Ondina",
        cidade: "Salvador",
        estado: "BA",
        cep: "40140-060",
      })
      .returning()
    enderecoId = newAddr.id
  }

  if (aluno1) {
    await db
      .update(alunoTable)
      .set({
        nomeCompleto: "João da Silva",
        banco: "077 - Banco Inter",
        agencia: "0001",
        conta: "16215539",
        digitoConta: "5",
        telefone: "(71) 99740-2722",
        enderecoId,
      })
      .where(eq(alunoTable.id, aluno1.id))
    console.log("✅ Updated aluno1 profile: Nome = João da Silva, Bank = 077 - Banco Inter, Address = Rua Barão de Itapoan")
  }

  // 3. Find all inscriptions of aluno1 and regenerate PDFs
  if (aluno1) {
    const inscricoes = await db.query.inscricaoTable.findMany({
      where: eq(inscricaoTable.alunoId, aluno1.id),
    })

    const pdfService = createInscricaoPdfService(db)
    for (const insc of inscricoes) {
      console.log(`🔄 Regenerating PDF for inscricao #${insc.id}...`)
      await pdfService.generateAndPersist(insc.id, aluno1User.id)
      console.log(`✅ PDF regenerated and stored for inscricao #${insc.id}`)
    }
  }

  console.log("🎉 All fixes applied successfully!")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
