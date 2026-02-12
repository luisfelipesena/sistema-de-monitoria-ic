import type { db } from '@/server/db'
import {
  importacaoPlanejamentoTable,
  disciplinaTable,
  professorTable,
  projetoTable,
  projetoTemplateTable,
  projetoDisciplinaTable,
  disciplinaProfessorResponsavelTable,
  atividadeProjetoTable,
  periodoInscricaoTable,
  type NewProjeto,
} from '@/server/db/schema'
import type { InferInsertModel } from 'drizzle-orm'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import type { Semestre } from '@/types'
import { findMatchingProfessors } from '@/utils/string-normalization'

type Database = typeof db

export type ImportacaoInsert = InferInsertModel<typeof importacaoPlanejamentoTable>
export type ImportacaoUpdate = Partial<ImportacaoInsert>
export type AtividadeProjetoInsert = InferInsertModel<typeof atividadeProjetoTable>

export function createImportProjectsRepository(db: Database) {
  return {
    async createImportacao(data: ImportacaoInsert) {
      const [importacao] = await db.insert(importacaoPlanejamentoTable).values(data).returning()
      return importacao
    },

    async findImportacao(id: number) {
      return db.query.importacaoPlanejamentoTable.findFirst({
        where: eq(importacaoPlanejamentoTable.id, id),
      })
    },

    async updateImportacao(id: number, data: ImportacaoUpdate) {
      await db.update(importacaoPlanejamentoTable).set(data).where(eq(importacaoPlanejamentoTable.id, id))
    },

    async findDisciplinaByCodigo(codigo: string) {
      return db.query.disciplinaTable.findFirst({
        where: eq(disciplinaTable.codigo, codigo),
      })
    },

    async findProfessoresBySiapes(siapes: string[]) {
      return db.query.professorTable.findMany({
        where: inArray(professorTable.matriculaSiape, siapes),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      })
    },

    async findTemplatePorDisciplina(disciplinaId: number) {
      return db.query.projetoTemplateTable.findFirst({
        where: eq(projetoTemplateTable.disciplinaId, disciplinaId),
      })
    },

    async createProjeto(data: NewProjeto) {
      const [projeto] = await db.insert(projetoTable).values(data).returning()
      return projeto
    },

    async associateProjetoDisciplina(projetoId: number, disciplinaId: number) {
      await db.insert(projetoDisciplinaTable).values({
        projetoId,
        disciplinaId,
      })
    },

    async findAssociacaoProfessorDisciplina(
      disciplinaId: number,
      professorId: number,
      ano: number,
      semestre: Semestre
    ) {
      return db.query.disciplinaProfessorResponsavelTable.findFirst({
        where: and(
          eq(disciplinaProfessorResponsavelTable.disciplinaId, disciplinaId),
          eq(disciplinaProfessorResponsavelTable.professorId, professorId),
          eq(disciplinaProfessorResponsavelTable.ano, ano),
          eq(disciplinaProfessorResponsavelTable.semestre, semestre)
        ),
      })
    },

    async createAssociacaoProfessorDisciplina(
      disciplinaId: number,
      professorId: number,
      ano: number,
      semestre: Semestre
    ) {
      await db.insert(disciplinaProfessorResponsavelTable).values({
        disciplinaId,
        professorId,
        ano,
        semestre,
      })
    },

    async insertAtividades(atividades: AtividadeProjetoInsert[]) {
      await db.insert(atividadeProjetoTable).values(atividades)
    },

    async findProfessoresByIds(userIds: number[]) {
      return db.query.professorTable.findMany({
        where: inArray(professorTable.userId, Array.from(userIds)),
        with: {
          user: {
            columns: {
              email: true,
              username: true,
            },
          },
        },
      })
    },

    async findAllImportacoes() {
      return db.query.importacaoPlanejamentoTable.findMany({
        orderBy: [desc(importacaoPlanejamentoTable.createdAt)],
        with: {
          importadoPor: {
            columns: {
              username: true,
              email: true,
            },
          },
        },
      })
    },

    async findImportacaoComDetalhes(id: number) {
      return db.query.importacaoPlanejamentoTable.findFirst({
        where: eq(importacaoPlanejamentoTable.id, id),
        with: {
          importadoPor: true,
        },
      })
    },

    async deleteImportacao(id: number) {
      await db.delete(importacaoPlanejamentoTable).where(eq(importacaoPlanejamentoTable.id, id))
    },

    async findAllProfessores() {
      return db.query.professorTable.findMany({
        columns: {
          id: true,
          nomeCompleto: true,
          matriculaSiape: true,
          emailInstitucional: true,
        },
        with: {
          departamento: {
            columns: {
              nome: true,
              sigla: true,
            },
          },
        },
      })
    },

    async findAllDisciplinas() {
      return db.query.disciplinaTable.findMany({
        columns: {
          id: true,
          nome: true,
          codigo: true,
        },
        with: {
          departamento: {
            columns: {
              nome: true,
              sigla: true,
            },
          },
        },
      })
    },

    /**
     * Find professor by fuzzy first name match
     * Uses the string normalization utility for accent/case-insensitive matching
     */
    async findProfessorByNameFuzzy(searchName: string) {
      const allProfessors = await db.query.professorTable.findMany({
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      })

      const matches = findMatchingProfessors(searchName, allProfessors)
      return matches.length > 0 ? matches[0] : null
    },

    /**
     * Find or create a discipline by code within a department
     */
    async findOrCreateDisciplina(data: { codigo: string; nome: string; departamentoId: number }) {
      // First try to find by code and department
      const existing = await db.query.disciplinaTable.findFirst({
        where: and(eq(disciplinaTable.codigo, data.codigo), eq(disciplinaTable.departamentoId, data.departamentoId)),
      })

      if (existing) {
        return { disciplina: existing, created: false }
      }

      // Create new discipline
      const [created] = await db
        .insert(disciplinaTable)
        .values({
          codigo: data.codigo,
          nome: data.nome,
          departamentoId: data.departamentoId,
        })
        .returning()

      return { disciplina: created, created: true }
    },

    async findDepartamentoByNome(nome: string) {
      const { departamentoTable } = await import('@/server/db/schema')
      return db.query.departamentoTable.findFirst({
        where: eq(departamentoTable.nome, nome),
      })
    },

    async findDepartamentoBySigla(sigla: string) {
      const { departamentoTable } = await import('@/server/db/schema')
      return db.query.departamentoTable.findFirst({
        where: eq(departamentoTable.sigla, sigla),
      })
    },

    /**
     * Finds all professors with user info (for fuzzy name matching)
     */
    async findAllProfessoresComUsuario() {
      return db.query.professorTable.findMany({
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      })
    },

    /**
     * Find distinct professors linked to projects of an import
     */
    async findProfessoresByImportacao(importacaoId: number) {
      const projetos = await db.query.projetoTable.findMany({
        where: and(eq(projetoTable.importacaoPlanejamentoId, importacaoId), isNull(projetoTable.deletedAt)),
        columns: { professorResponsavelId: true },
      })

      const professorIds = [...new Set(projetos.map((p) => p.professorResponsavelId))]
      if (professorIds.length === 0) return []

      return db.query.professorTable.findMany({
        where: inArray(professorTable.id, professorIds),
        with: {
          user: {
            columns: {
              email: true,
              username: true,
            },
          },
        },
      })
    },

    /**
     * Soft-delete all projects linked to a specific importacao
     */
    async softDeleteProjetosByImportacaoId(importacaoId: number) {
      const now = new Date()
      await db
        .update(projetoTable)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(projetoTable.importacaoPlanejamentoId, importacaoId), isNull(projetoTable.deletedAt)))
    },

    /**
     * Check if an active project already exists for a given professor, discipline, year and semester
     */
    async findExistingProjeto(professorId: number, disciplinaId: number, ano: number, semestre: Semestre) {
      const result = await db
        .select({ id: projetoTable.id })
        .from(projetoTable)
        .innerJoin(projetoDisciplinaTable, eq(projetoDisciplinaTable.projetoId, projetoTable.id))
        .where(
          and(
            eq(projetoTable.professorResponsavelId, professorId),
            eq(projetoDisciplinaTable.disciplinaId, disciplinaId),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            isNull(projetoTable.deletedAt)
          )
        )
        .limit(1)

      return result.length > 0 ? result[0] : null
    },

    async findPeriodoBySemestre(ano: number, semestre: Semestre) {
      return db.query.periodoInscricaoTable.findFirst({
        where: and(eq(periodoInscricaoTable.ano, ano), eq(periodoInscricaoTable.semestre, semestre)),
      })
    },

    async updatePeriodoEditalPrograd(periodoId: number, numeroEditalPrograd: string) {
      await db
        .update(periodoInscricaoTable)
        .set({ numeroEditalPrograd, updatedAt: new Date() })
        .where(eq(periodoInscricaoTable.id, periodoId))
    },
  }
}

export type ImportProjectsRepository = ReturnType<typeof createImportProjectsRepository>
