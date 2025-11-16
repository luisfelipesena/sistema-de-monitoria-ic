import { and, eq, sql } from 'drizzle-orm'
import type { InferInsertModel } from 'drizzle-orm'
import type { db } from '@/server/db'
import { alunoTable, cursoTable, disciplinaTable, projetoTable } from '@/server/db/schema'

export type CursoInsert = InferInsertModel<typeof cursoTable>
type Database = typeof db

export function createCourseRepository(db: Database) {
  return {
    async findAll() {
      return db.query.cursoTable.findMany({
        orderBy: (curso, { asc }) => [asc(curso.nome)],
      })
    },

    async findById(id: number) {
      return db.query.cursoTable.findFirst({
        where: eq(cursoTable.id, id),
      })
    },

    async countAlunos(cursoId: number) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(alunoTable)
        .where(eq(alunoTable.cursoId, cursoId))
      return result?.count || 0
    },

    async countDisciplinas(departamentoId: number) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(disciplinaTable)
        .where(eq(disciplinaTable.departamentoId, departamentoId))
      return result?.count || 0
    },

    async countProjetos(departamentoId: number) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(and(eq(projetoTable.departamentoId, departamentoId)))
      return result?.count || 0
    },

    async insert(data: CursoInsert) {
      const [curso] = await db.insert(cursoTable).values(data).returning()
      return curso
    },

    async update(id: number, data: Partial<CursoInsert>) {
      const [curso] = await db.update(cursoTable).set(data).where(eq(cursoTable.id, id)).returning()
      return curso
    },

    async delete(id: number) {
      const [result] = await db.delete(cursoTable).where(eq(cursoTable.id, id)).returning()
      return result
    },
  }
}

export type CourseRepository = ReturnType<typeof createCourseRepository>
