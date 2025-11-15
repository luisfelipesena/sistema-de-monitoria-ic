import { and, eq, isNull, sql } from 'drizzle-orm'
import type { InferInsertModel } from 'drizzle-orm'
import type { db } from '@/server/db'
import { cursoTable, departamentoTable, disciplinaTable, professorTable, projetoTable } from '@/server/db/schema'

export type DepartamentoInsert = InferInsertModel<typeof departamentoTable>
type Database = typeof db

export function createDepartamentoRepository(db: Database) {
  return {
    async findAll() {
      return db.query.departamentoTable.findMany({
        orderBy: (departamentos, { asc }) => [asc(departamentos.nome)],
      })
    },

    async findById(id: number) {
      return db.query.departamentoTable.findFirst({
        where: eq(departamentoTable.id, id),
      })
    },

    async countProfessores(departamentoId: number) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(professorTable)
        .where(eq(professorTable.departamentoId, departamentoId))
      return result?.count || 0
    },

    async countCursos(departamentoId: number) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(cursoTable)
        .where(eq(cursoTable.departamentoId, departamentoId))
      return result?.count || 0
    },

    async countDisciplinas(departamentoId: number) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(disciplinaTable)
        .where(and(eq(disciplinaTable.departamentoId, departamentoId), isNull(disciplinaTable.deletedAt)))
      return result?.count || 0
    },

    async countProjetos(departamentoId: number) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(and(eq(projetoTable.departamentoId, departamentoId), isNull(projetoTable.deletedAt)))
      return result?.count || 0
    },

    async insert(data: DepartamentoInsert) {
      const [departamento] = await db.insert(departamentoTable).values(data).returning()
      return departamento
    },

    async update(id: number, data: Partial<DepartamentoInsert>) {
      const [departamento] = await db
        .update(departamentoTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(departamentoTable.id, id))
        .returning()
      return departamento
    },

    async delete(id: number) {
      await db.delete(departamentoTable).where(eq(departamentoTable.id, id))
    },
  }
}

export type DepartamentoRepository = ReturnType<typeof createDepartamentoRepository>
