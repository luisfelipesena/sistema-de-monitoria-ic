import type { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

type Database = typeof db

export const createSignatureRepository = (database: Database) => {
  return {
    async getDefaultSignature(userId: number) {
      return database.query.userTable.findFirst({
        where: eq(userTable.id, userId),
        columns: {
          assinaturaDefault: true,
          dataAssinaturaDefault: true,
        },
      })
    },

    async saveDefaultSignature(userId: number, signatureData: string) {
      await database
        .update(userTable)
        .set({
          assinaturaDefault: signatureData,
          dataAssinaturaDefault: new Date(),
        })
        .where(eq(userTable.id, userId))
    },

    async deleteDefaultSignature(userId: number) {
      await database
        .update(userTable)
        .set({
          assinaturaDefault: null,
          dataAssinaturaDefault: null,
        })
        .where(eq(userTable.id, userId))
    },
  }
}
