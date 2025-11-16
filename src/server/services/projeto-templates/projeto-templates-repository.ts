import type { db } from '@/server/db'
import { projetoTemplateTable } from '@/server/db/schema'
import type { InferInsertModel } from 'drizzle-orm'
import { desc, eq } from 'drizzle-orm'

type Database = typeof db

export type ProjetoTemplateInsert = InferInsertModel<typeof projetoTemplateTable>
export type ProjetoTemplateUpdate = Partial<ProjetoTemplateInsert>

export function createProjetoTemplatesRepository(db: Database) {
  return {
    async findAll() {
      return db.query.projetoTemplateTable.findMany({
        orderBy: [desc(projetoTemplateTable.updatedAt)],
        with: {
          disciplina: {
            with: {
              departamento: {
                columns: {
                  id: true,
                  nome: true,
                  sigla: true,
                },
              },
            },
          },
          criadoPor: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
          ultimaAtualizacaoPor: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      })
    },

    async findAllSimple() {
      return db.query.projetoTemplateTable.findMany({
        orderBy: [desc(projetoTemplateTable.updatedAt)],
        with: {
          disciplina: {
            with: {
              departamento: {
                columns: {
                  id: true,
                  nome: true,
                  sigla: true,
                },
              },
            },
          },
        },
      })
    },

    async findById(id: number) {
      return db.query.projetoTemplateTable.findFirst({
        where: eq(projetoTemplateTable.id, id),
        with: {
          disciplina: {
            with: {
              departamento: true,
            },
          },
          criadoPor: true,
          ultimaAtualizacaoPor: true,
        },
      })
    },

    async findByDisciplinaId(disciplinaId: number) {
      return db.query.projetoTemplateTable.findFirst({
        where: eq(projetoTemplateTable.disciplinaId, disciplinaId),
        with: {
          disciplina: {
            with: {
              departamento: true,
            },
          },
        },
      })
    },

    async create(data: ProjetoTemplateInsert) {
      const [template] = await db.insert(projetoTemplateTable).values(data).returning()
      return template
    },

    async update(id: number, data: ProjetoTemplateUpdate) {
      const [updated] = await db
        .update(projetoTemplateTable)
        .set(data)
        .where(eq(projetoTemplateTable.id, id))
        .returning()
      return updated
    },

    async delete(id: number) {
      await db.delete(projetoTemplateTable).where(eq(projetoTemplateTable.id, id))
    },

    async findAllDisciplinas() {
      return db.query.disciplinaTable.findMany({
        with: {
          departamento: {
            columns: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
        },
      })
    },

    async findAllTemplateIds() {
      return db.query.projetoTemplateTable.findMany({
        columns: {
          disciplinaId: true,
        },
      })
    },

    async countTemplates() {
      const templates = await db.query.projetoTemplateTable.findMany()
      return templates.length
    },

    async countDisciplinas() {
      const disciplinas = await db.query.disciplinaTable.findMany()
      return disciplinas.length
    },
  }
}

export type ProjetoTemplatesRepository = ReturnType<typeof createProjetoTemplatesRepository>
