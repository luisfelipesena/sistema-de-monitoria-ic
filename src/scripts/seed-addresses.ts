import { db } from '@/server/db'
import { alunoTable, enderecoTable, userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  console.log('🌱 Seeding addresses for test students...')

  const addressesData = [
    {
      email: 'aluno1@ufba.br',
      rua: 'Rua das Codornas',
      numero: 134,
      complemento: 'Morada Gil Eanes (703)',
      bairro: 'Imbuí',
      cidade: 'Salvador',
      estado: 'Bahia',
      cep: '41720-030',
    },
    {
      email: 'aluno2@ufba.br',
      rua: 'Rua das Margaridas',
      numero: 95,
      complemento: 'Bloco B, Ap. 204',
      bairro: 'Pituba',
      cidade: 'Salvador',
      estado: 'Bahia',
      cep: '41810-000',
    },
  ]

  for (const item of addressesData) {
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.email, item.email),
    })

    if (user) {
      const aluno = await db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, user.id),
      })

      if (aluno) {
        let enderecoId = aluno.enderecoId
        if (!enderecoId) {
          const [inserted] = await db
            .insert(enderecoTable)
            .values({
              rua: item.rua,
              numero: item.numero,
              complemento: item.complemento,
              bairro: item.bairro,
              cidade: item.cidade,
              estado: item.estado,
              cep: item.cep,
            })
            .returning()
          enderecoId = inserted.id
          await db.update(alunoTable).set({ enderecoId }).where(eq(alunoTable.id, aluno.id))
        } else {
          await db
            .update(enderecoTable)
            .set({
              rua: item.rua,
              numero: item.numero,
              complemento: item.complemento,
              bairro: item.bairro,
              cidade: item.cidade,
              estado: item.estado,
              cep: item.cep,
            })
            .where(eq(enderecoTable.id, enderecoId))
        }
        console.log(`✅ Address updated for ${item.email}`)
      }
    }
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
