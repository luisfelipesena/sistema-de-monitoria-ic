import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import type { InferInsertModel } from 'drizzle-orm'
import type { db } from '@/server/db'
import {
  departamentoTable,
  disciplinaProfessorResponsavelTable,
  disciplinaTable,
  equivalenciaDisciplinasTable,
  notaAlunoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  projetoTemplateTable,
} from '@/server/db/schema'

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

    async getDisciplinaIdsByDepartamento(departamentoId: number) {
      const disciplinas = await db
        .select({ id: disciplinaTable.id })
        .from(disciplinaTable)
        .where(eq(disciplinaTable.departamentoId, departamentoId))
      return disciplinas.map((d) => d.id)
    },

    async deleteProjetoDisciplinasByDisciplinaIds(disciplinaIds: number[]) {
      if (disciplinaIds.length === 0) return
      await db.delete(projetoDisciplinaTable).where(inArray(projetoDisciplinaTable.disciplinaId, disciplinaIds))
    },

    async deleteDisciplinaProfessorResponsavelByDisciplinaIds(disciplinaIds: number[]) {
      if (disciplinaIds.length === 0) return
      await db
        .delete(disciplinaProfessorResponsavelTable)
        .where(inArray(disciplinaProfessorResponsavelTable.disciplinaId, disciplinaIds))
    },

    async deleteNotaAlunoByDisciplinaIds(disciplinaIds: number[]) {
      if (disciplinaIds.length === 0) return
      await db.delete(notaAlunoTable).where(inArray(notaAlunoTable.disciplinaId, disciplinaIds))
    },

    async deleteEquivalenciaDisciplinasByDisciplinaIds(disciplinaIds: number[]) {
      if (disciplinaIds.length === 0) return
      // Delete where disciplina is either origem or equivalente
      await db
        .delete(equivalenciaDisciplinasTable)
        .where(inArray(equivalenciaDisciplinasTable.disciplinaOrigemId, disciplinaIds))
      await db
        .delete(equivalenciaDisciplinasTable)
        .where(inArray(equivalenciaDisciplinasTable.disciplinaEquivalenteId, disciplinaIds))
    },

    async deleteProjetoTemplatesByDisciplinaIds(disciplinaIds: number[]) {
      if (disciplinaIds.length === 0) return
      await db.delete(projetoTemplateTable).where(inArray(projetoTemplateTable.disciplinaId, disciplinaIds))
    },

    async deleteDisciplinasByDepartamento(departamentoId: number) {
      await db.delete(disciplinaTable).where(eq(disciplinaTable.departamentoId, departamentoId))
    },

    async countProjetosAtivos(departamentoId: number) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projetoTable)
        .where(and(eq(projetoTable.departamentoId, departamentoId), isNull(projetoTable.deletedAt)))
      return result?.count || 0
    },

    async softDeleteProjetosByDepartamento(departamentoId: number) {
      // Soft delete and nullify departamentoId to remove FK constraint
      await db
        .update(projetoTable)
        .set({ deletedAt: new Date(), departamentoId: null })
        .where(eq(projetoTable.departamentoId, departamentoId))
    },

    async nullifyProfessorsDepartamento(departamentoId: number) {
      await db
        .update(professorTable)
        .set({ departamentoId: null, updatedAt: new Date() })
        .where(eq(professorTable.departamentoId, departamentoId))
    },
  }
}

export type DepartamentoRepository = ReturnType<typeof createDepartamentoRepository>
