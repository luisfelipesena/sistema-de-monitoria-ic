import type { db } from '@/server/db'
import { projetoDocumentoTable, projetoTable, publicPdfTokenTable } from '@/server/db/schema'
import { TIPO_DOCUMENTO_PROPOSTA_ASSINADA_ADMIN, TIPO_DOCUMENTO_PROPOSTA_ASSINADA_PROFESSOR } from '@/types'
import type { InferInsertModel } from 'drizzle-orm'
import { and, eq, gt, isNull } from 'drizzle-orm'

type Database = typeof db

export type PublicPdfTokenInsert = InferInsertModel<typeof publicPdfTokenTable>

export function createPublicPdfRepository(db: Database) {
  return {
    async findProjetoById(projetoId: number) {
      return db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, projetoId),
        with: {
          departamento: true,
          professorResponsavel: true,
        },
      })
    },

    async findSignedDocumentByProjetoId(projetoId: number) {
      // Find the most recent signed document (either by professor or admin)
      const docs = await db.query.projetoDocumentoTable.findMany({
        where: eq(projetoDocumentoTable.projetoId, projetoId),
        orderBy: (doc, { desc }) => [desc(doc.createdAt)],
      })

      // Prioritize admin-signed, then professor-signed
      const adminSigned = docs.find((d) => d.tipoDocumento === TIPO_DOCUMENTO_PROPOSTA_ASSINADA_ADMIN)
      if (adminSigned) return adminSigned

      const professorSigned = docs.find((d) => d.tipoDocumento === TIPO_DOCUMENTO_PROPOSTA_ASSINADA_PROFESSOR)
      return professorSigned || null
    },

    async createPublicPdfToken(data: {
      projetoId: number
      token: string
      expiresAt: Date
      createdByUserId: number
    }) {
      await db.insert(publicPdfTokenTable).values(data)
    },

    async findValidToken(token: string) {
      return db.query.publicPdfTokenTable.findFirst({
        where: and(
          eq(publicPdfTokenTable.token, token),
          gt(publicPdfTokenTable.expiresAt, new Date()),
          isNull(publicPdfTokenTable.revokedAt)
        ),
        with: {
          projeto: {
            columns: {
              id: true,
              titulo: true,
              ano: true,
              semestre: true,
            },
          },
        },
      })
    },

    async updateTokenAccessTime(token: string) {
      await db
        .update(publicPdfTokenTable)
        .set({ lastAccessedAt: new Date() })
        .where(eq(publicPdfTokenTable.token, token))
    },

    async findActiveTokensByProjetoId(projetoId: number) {
      return db.query.publicPdfTokenTable.findMany({
        where: and(
          eq(publicPdfTokenTable.projetoId, projetoId),
          gt(publicPdfTokenTable.expiresAt, new Date()),
          isNull(publicPdfTokenTable.revokedAt)
        ),
        with: {
          createdBy: {
            columns: { id: true, username: true, email: true },
          },
        },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      })
    },

    async revokeToken(token: string) {
      await db.update(publicPdfTokenTable).set({ revokedAt: new Date() }).where(eq(publicPdfTokenTable.token, token))
    },
  }
}

export type PublicPdfRepository = ReturnType<typeof createPublicPdfRepository>
