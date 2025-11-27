import { and, eq, gte, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm'
import type { InferInsertModel } from 'drizzle-orm'
import type { db } from '@/server/db'
import {
  editalTable,
  editalSignatureTokenTable,
  periodoInscricaoTable,
  professorTable,
  projetoTable,
} from '@/server/db/schema'
import type { Semestre, TipoEdital } from '@/types'
import { TIPO_EDITAL_DCC, APPROVED } from '@/types'

export type EditalInsert = InferInsertModel<typeof editalTable>
export type PeriodoInscricaoInsert = InferInsertModel<typeof periodoInscricaoTable>
export type EditalSignatureTokenInsert = InferInsertModel<typeof editalSignatureTokenTable>

type Database = typeof db

export function createEditalRepository(db: Database) {
  return {
    async findById(id: number) {
      return db.query.editalTable.findFirst({
        where: eq(editalTable.id, id),
      })
    },

    async findByIdWithRelations(id: number) {
      return db.query.editalTable.findFirst({
        where: eq(editalTable.id, id),
        with: {
          periodoInscricao: true,
          criadoPor: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      })
    },

    async findByNumeroEdital(numeroEdital: string) {
      return db.query.editalTable.findFirst({
        where: eq(editalTable.numeroEdital, numeroEdital),
      })
    },

    async findAll() {
      return db.query.editalTable.findMany({
        with: {
          periodoInscricao: true,
          criadoPor: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      })
    },

    async findPublished() {
      return db.query.editalTable.findMany({
        where: eq(editalTable.publicado, true),
        with: {
          periodoInscricao: true,
          criadoPor: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: (table, { desc }) => [desc(table.dataPublicacao)],
      })
    },

    async findPendingSignature() {
      return db.query.editalTable.findMany({
        where: and(
          isNull(editalTable.chefeAssinouEm),
          eq(editalTable.tipo, TIPO_EDITAL_DCC),
          isNotNull(editalTable.titulo)
        ),
        with: {
          periodoInscricao: true,
          criadoPor: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      })
    },

    async findBySemestre(ano: number, semestre: Semestre, tipo?: TipoEdital, publicadoApenas = false) {
      const periodos = await db.query.periodoInscricaoTable.findMany({
        where: and(eq(periodoInscricaoTable.ano, ano), eq(periodoInscricaoTable.semestre, semestre)),
      })

      if (periodos.length === 0) return []

      const periodoIds = periodos.map((p) => p.id)

      return db.query.editalTable.findMany({
        where: and(
          inArray(editalTable.periodoInscricaoId, periodoIds),
          tipo ? eq(editalTable.tipo, tipo) : undefined,
          publicadoApenas ? eq(editalTable.publicado, true) : undefined
        ),
        with: {
          periodoInscricao: true,
          criadoPor: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      })
    },

    async insert(data: EditalInsert) {
      const [edital] = await db.insert(editalTable).values(data).returning()
      return edital
    },

    async update(id: number, data: Partial<EditalInsert>) {
      const [edital] = await db
        .update(editalTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(editalTable.id, id))
        .returning()
      return edital
    },

    async delete(id: number) {
      await db.delete(editalTable).where(eq(editalTable.id, id))
    },

    async findActivePeriodo() {
      const now = new Date()
      return db.query.periodoInscricaoTable.findFirst({
        where: and(lte(periodoInscricaoTable.dataInicio, now), gte(periodoInscricaoTable.dataFim, now)),
      })
    },

    async findPeriodoById(id: number) {
      return db.query.periodoInscricaoTable.findFirst({
        where: eq(periodoInscricaoTable.id, id),
      })
    },

    async findPeriodoBySemestre(ano: number, semestre: Semestre) {
      return db.query.periodoInscricaoTable.findFirst({
        where: and(eq(periodoInscricaoTable.ano, ano), eq(periodoInscricaoTable.semestre, semestre)),
      })
    },

    async findOverlappingPeriodo(ano: number, semestre: Semestre, dataInicio: Date, dataFim: Date, excludeId?: number) {
      return db.query.periodoInscricaoTable.findFirst({
        where: and(
          eq(periodoInscricaoTable.ano, ano),
          eq(periodoInscricaoTable.semestre, semestre),
          excludeId ? sql`${periodoInscricaoTable.id} != ${excludeId}` : undefined,
          or(
            and(lte(periodoInscricaoTable.dataInicio, dataInicio), gte(periodoInscricaoTable.dataFim, dataInicio)),
            and(lte(periodoInscricaoTable.dataInicio, dataFim), gte(periodoInscricaoTable.dataFim, dataFim)),
            and(gte(periodoInscricaoTable.dataInicio, dataInicio), lte(periodoInscricaoTable.dataFim, dataFim))
          )
        ),
      })
    },

    async insertPeriodo(data: PeriodoInscricaoInsert) {
      const [periodo] = await db.insert(periodoInscricaoTable).values(data).returning()
      return periodo
    },

    async updatePeriodo(id: number, data: Partial<PeriodoInscricaoInsert>) {
      await db
        .update(periodoInscricaoTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(periodoInscricaoTable.id, id))
    },

    async deletePeriodo(id: number) {
      await db.delete(periodoInscricaoTable).where(eq(periodoInscricaoTable.id, id))
    },

    async findApprovedProjectsByPeriod(ano: number, semestre: Semestre) {
      return db.query.projetoTable.findMany({
        where: and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre), eq(projetoTable.status, APPROVED)),
        with: {
          departamento: true,
          professorResponsavel: {
            with: {
              user: true,
            },
          },
          disciplinas: {
            with: {
              disciplina: true,
            },
          },
        },
      })
    },

    async countApprovedProjectsByPeriod(ano: number, semestre: Semestre) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre), eq(projetoTable.status, APPROVED)))
      return result?.count || 0
    },

    async findProfessorById(professorId: number) {
      return db.query.professorTable.findFirst({
        where: eq(professorTable.userId, professorId),
        with: { departamento: true },
      })
    },

    // Token signature methods
    async createSignatureToken(data: EditalSignatureTokenInsert) {
      const [token] = await db.insert(editalSignatureTokenTable).values(data).returning()
      return token
    },

    async findSignatureTokenByToken(token: string) {
      return db.query.editalSignatureTokenTable.findFirst({
        where: eq(editalSignatureTokenTable.token, token),
        with: {
          edital: {
            with: {
              periodoInscricao: true,
            },
          },
        },
      })
    },

    async findPendingTokenByEditalId(editalId: number) {
      return db.query.editalSignatureTokenTable.findFirst({
        where: and(
          eq(editalSignatureTokenTable.editalId, editalId),
          eq(editalSignatureTokenTable.status, 'PENDING'),
          gte(editalSignatureTokenTable.expiresAt, new Date())
        ),
      })
    },

    async markTokenAsUsed(tokenId: number) {
      const [token] = await db
        .update(editalSignatureTokenTable)
        .set({ status: 'USED', usedAt: new Date() })
        .where(eq(editalSignatureTokenTable.id, tokenId))
        .returning()
      return token
    },

    async expireToken(tokenId: number) {
      const [token] = await db
        .update(editalSignatureTokenTable)
        .set({ status: 'EXPIRED' })
        .where(eq(editalSignatureTokenTable.id, tokenId))
        .returning()
      return token
    },
  }
}

export type EditalRepository = ReturnType<typeof createEditalRepository>
