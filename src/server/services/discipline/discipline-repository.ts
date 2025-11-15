import type { db } from '@/server/db'
import * as schema from '@/server/db/schema'
import {
  disciplinaProfessorResponsavelTable,
  disciplinaTable,
  equivalenciaDisciplinasTable,
  inscricaoTable,
  projetoDisciplinaTable,
  projetoTable,
  projetoTemplateTable,
  vagaTable,
} from '@/server/db/schema'
import type { Semestre } from '@/types'
import { PROJETO_STATUS_APPROVED, TIPO_VAGA_BOLSISTA, TIPO_VAGA_VOLUNTARIO } from '@/types'
import type { ExtractTablesWithRelations, InferInsertModel } from 'drizzle-orm'
import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'

type Database = typeof db
type Transaction = PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>

export type DisciplinaInsert = InferInsertModel<typeof disciplinaTable>
export type DisciplinaUpdate = Partial<DisciplinaInsert>
export type EquivalenciaInsert = InferInsertModel<typeof equivalenciaDisciplinasTable>
export type DisciplinaProfessorInsert = InferInsertModel<typeof disciplinaProfessorResponsavelTable>

export function createDisciplineRepository(db: Database | Transaction) {
  return {
    async findById(id: number) {
      return db.query.disciplinaTable.findFirst({
        where: eq(disciplinaTable.id, id),
      })
    },

    async findByIds(ids: number[]) {
      return db.query.disciplinaTable.findMany({
        where: inArray(disciplinaTable.id, ids),
      })
    },

    async findAll() {
      return db.query.disciplinaTable.findMany({
        with: {
          departamento: true,
        },
      })
    },

    async findByCode(codigo: string) {
      return db.query.disciplinaTable.findFirst({
        where: eq(disciplinaTable.codigo, codigo),
      })
    },

    async findByDepartment(departamentoId: number) {
      return db.query.disciplinaTable.findMany({
        where: eq(disciplinaTable.departamentoId, departamentoId),
      })
    },

    async findByDepartmentId(departamentoId: number) {
      return db.query.disciplinaTable.findMany({
        where: eq(disciplinaTable.departamentoId, departamentoId),
      })
    },

    async findProfessorResponsavel(disciplinaId: number, ano: number, semestre: Semestre) {
      return db.query.disciplinaProfessorResponsavelTable.findMany({
        where: and(
          eq(disciplinaProfessorResponsavelTable.disciplinaId, disciplinaId),
          eq(disciplinaProfessorResponsavelTable.ano, ano),
          eq(disciplinaProfessorResponsavelTable.semestre, semestre)
        ),
        with: {
          professor: {
            with: {
              user: true,
            },
          },
        },
      })
    },

    async findProfessorDisciplinas(professorId: number, ano: number, semestre: Semestre) {
      return db.query.disciplinaProfessorResponsavelTable.findMany({
        where: and(
          eq(disciplinaProfessorResponsavelTable.professorId, professorId),
          eq(disciplinaProfessorResponsavelTable.ano, ano),
          eq(disciplinaProfessorResponsavelTable.semestre, semestre)
        ),
        with: {
          disciplina: true,
        },
      })
    },

    async create(data: DisciplinaInsert) {
      const [disciplina] = await db.insert(disciplinaTable).values(data).returning()
      return disciplina
    },

    async update(id: number, data: DisciplinaUpdate) {
      const [updated] = await db.update(disciplinaTable).set(data).where(eq(disciplinaTable.id, id)).returning()
      return updated
    },

    async delete(id: number) {
      const [deleted] = await db.delete(disciplinaTable).where(eq(disciplinaTable.id, id)).returning()
      return deleted
    },

    async deleteDependencies(id: number) {
      // Delete in correct order to maintain referential integrity
      await db
        .delete(equivalenciaDisciplinasTable)
        .where(
          or(
            eq(equivalenciaDisciplinasTable.disciplinaOrigemId, id),
            eq(equivalenciaDisciplinasTable.disciplinaEquivalenteId, id)
          )
        )

      await db
        .delete(disciplinaProfessorResponsavelTable)
        .where(eq(disciplinaProfessorResponsavelTable.disciplinaId, id))

      await db.delete(projetoDisciplinaTable).where(eq(projetoDisciplinaTable.disciplinaId, id))
    },

    async checkDependencies(id: number) {
      const [projectTemplates, professoresResponsaveis, equivalences, inscricoes] = await Promise.all([
        db.query.projetoTemplateTable.findMany({
          where: eq(projetoTemplateTable.disciplinaId, id),
        }),
        db.query.disciplinaProfessorResponsavelTable.findMany({
          where: eq(disciplinaProfessorResponsavelTable.disciplinaId, id),
        }),
        db.query.equivalenciaDisciplinasTable.findMany({
          where: or(
            eq(equivalenciaDisciplinasTable.disciplinaOrigemId, id),
            eq(equivalenciaDisciplinasTable.disciplinaEquivalenteId, id)
          ),
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(projetoDisciplinaTable)
          .innerJoin(projetoTable, eq(projetoDisciplinaTable.projetoId, projetoTable.id))
          .innerJoin(inscricaoTable, eq(projetoTable.id, inscricaoTable.projetoId))
          .where(eq(projetoDisciplinaTable.disciplinaId, id))
          .then((result) => result[0]),
      ])

      return {
        hasTemplates: projectTemplates.length > 0,
        hasProfessoresResponsaveis: professoresResponsaveis.length > 0,
        hasEquivalences: equivalences.length > 0,
        hasInscricoes: (inscricoes?.count ?? 0) > 0,
        hasAnyDependency:
          projectTemplates.length > 0 ||
          professoresResponsaveis.length > 0 ||
          equivalences.length > 0 ||
          (inscricoes?.count ?? 0) > 0,
      }
    },

    async createProfessorResponsavel(data: DisciplinaProfessorInsert) {
      const [created] = await db.insert(disciplinaProfessorResponsavelTable).values(data).returning()
      return created
    },

    async removeProfessorResponsavel(disciplinaId: number, professorId: number, ano: number, semestre: Semestre) {
      const [deleted] = await db
        .delete(disciplinaProfessorResponsavelTable)
        .where(
          and(
            eq(disciplinaProfessorResponsavelTable.disciplinaId, disciplinaId),
            eq(disciplinaProfessorResponsavelTable.professorId, professorId),
            eq(disciplinaProfessorResponsavelTable.ano, ano),
            eq(disciplinaProfessorResponsavelTable.semestre, semestre)
          )
        )
        .returning()
      return deleted
    },

    async findEquivalence(disciplinaOrigemId: number, disciplinaEquivalenteId: number) {
      return db.query.equivalenciaDisciplinasTable.findFirst({
        where: and(
          eq(equivalenciaDisciplinasTable.disciplinaOrigemId, disciplinaOrigemId),
          eq(equivalenciaDisciplinasTable.disciplinaEquivalenteId, disciplinaEquivalenteId)
        ),
      })
    },

    async createEquivalence(data: EquivalenciaInsert) {
      const [created] = await db.insert(equivalenciaDisciplinasTable).values(data).returning()
      return created
    },

    async deleteEquivalence(id: number) {
      const [deleted] = await db
        .delete(equivalenciaDisciplinasTable)
        .where(eq(equivalenciaDisciplinasTable.id, id))
        .returning()
      return deleted
    },

    async findAllEquivalences() {
      return db.query.equivalenciaDisciplinasTable.findMany({
        with: {
          disciplinaOrigem: true,
          disciplinaEquivalente: true,
        },
      })
    },

    async getProjetosAtivos(disciplinaIds: number[], professorId: number, ano: number, semestre: Semestre) {
      return db
        .select({
          disciplinaId: projetoDisciplinaTable.disciplinaId,
          count: sql<number>`count(distinct ${projetoTable.id})::int`,
        })
        .from(projetoDisciplinaTable)
        .innerJoin(projetoTable, eq(projetoDisciplinaTable.projetoId, projetoTable.id))
        .where(
          and(
            inArray(projetoDisciplinaTable.disciplinaId, disciplinaIds),
            eq(projetoTable.professorResponsavelId, professorId),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            eq(projetoTable.status, PROJETO_STATUS_APPROVED),
            isNull(projetoTable.deletedAt)
          )
        )
        .groupBy(projetoDisciplinaTable.disciplinaId)
    },

    async getMonitoresCounts(disciplinaIds: number[], professorId: number) {
      return db
        .select({
          disciplinaId: projetoDisciplinaTable.disciplinaId,
          bolsistas: sql<number>`count(case when ${vagaTable.tipo} = ${TIPO_VAGA_BOLSISTA} then 1 end)::int`,
          voluntarios: sql<number>`count(case when ${vagaTable.tipo} = ${TIPO_VAGA_VOLUNTARIO} then 1 end)::int`,
        })
        .from(projetoDisciplinaTable)
        .innerJoin(projetoTable, eq(projetoDisciplinaTable.projetoId, projetoTable.id))
        .innerJoin(vagaTable, eq(projetoTable.id, vagaTable.projetoId))
        .where(
          and(
            inArray(projetoDisciplinaTable.disciplinaId, disciplinaIds),
            eq(projetoTable.professorResponsavelId, professorId),
            isNull(projetoTable.deletedAt)
          )
        )
        .groupBy(projetoDisciplinaTable.disciplinaId)
    },

    async getProfessorAssociations(professorId: number, ano: number, semestre: Semestre) {
      return db.query.disciplinaProfessorResponsavelTable.findMany({
        where: and(
          eq(disciplinaProfessorResponsavelTable.professorId, professorId),
          eq(disciplinaProfessorResponsavelTable.ano, ano),
          eq(disciplinaProfessorResponsavelTable.semestre, semestre)
        ),
        columns: {
          disciplinaId: true,
          ano: true,
          semestre: true,
        },
      })
    },

    async findAssociation(disciplinaId: number, professorId: number, ano: number, semestre: Semestre) {
      return db.query.disciplinaProfessorResponsavelTable.findFirst({
        where: and(
          eq(disciplinaProfessorResponsavelTable.disciplinaId, disciplinaId),
          eq(disciplinaProfessorResponsavelTable.professorId, professorId),
          eq(disciplinaProfessorResponsavelTable.ano, ano),
          eq(disciplinaProfessorResponsavelTable.semestre, semestre)
        ),
      })
    },

    async createAssociation(data: DisciplinaProfessorInsert) {
      const [created] = await db.insert(disciplinaProfessorResponsavelTable).values(data).returning()
      return created
    },

    async deleteAssociation(disciplinaId: number, professorId: number, ano: number, semestre: Semestre) {
      const [deleted] = await db
        .delete(disciplinaProfessorResponsavelTable)
        .where(
          and(
            eq(disciplinaProfessorResponsavelTable.disciplinaId, disciplinaId),
            eq(disciplinaProfessorResponsavelTable.professorId, professorId),
            eq(disciplinaProfessorResponsavelTable.ano, ano),
            eq(disciplinaProfessorResponsavelTable.semestre, semestre)
          )
        )
        .returning()
      return deleted ? [deleted] : []
    },
  }
}

export type DisciplineRepository = ReturnType<typeof createDisciplineRepository>
