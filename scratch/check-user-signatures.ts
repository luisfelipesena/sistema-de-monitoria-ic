import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'

async function main() {
  const users = await db.select().from(userTable)
  console.log(
    JSON.stringify(
      users.map((u) => ({ id: u.id, username: u.username, role: u.role, hasSig: !!u.assinaturaDefault })),
      null,
      2
    )
  )
}

main().catch(console.error)
