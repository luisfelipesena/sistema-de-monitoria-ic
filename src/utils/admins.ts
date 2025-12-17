import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

const ADMIN_EMAILS = [
  'luis.sena+admin@ufba.br',
  'rubisleypl@ufba.br',
  'dcc@ufba.br',
]

export const isAdminEmail = (email: string | null | undefined) => !!email && ADMIN_EMAILS.includes(email.toLowerCase())

export async function ensureAdminRole(userId: number, email: string | null | undefined) {
  if (!isAdminEmail(email)) {
    return null
  }

  const [updatedUser] = await db
    .update(userTable)
    .set({ role: 'admin' })
    .where(eq(userTable.id, userId))
    .returning({ id: userTable.id, role: userTable.role })

  return updatedUser ?? null
}
