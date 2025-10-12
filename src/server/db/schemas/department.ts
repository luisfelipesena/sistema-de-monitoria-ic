import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core'

export const departamentoTable = pgTable('departamento', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  sigla: varchar('sigla', { length: 20 }),
  telefone: varchar('telefone', { length: 20 }),
  email: text('email'),
  parentId: integer('parent_id'),
  chefeAtual: text('chefe_atual'),
  emailChefe: text('email_chefe'),
  ativo: boolean('ativo').notNull().default(true),
})

export const departamentoRelations = relations(departamentoTable, ({ one, many }) => ({
  parent: one(departamentoTable, {
    fields: [departamentoTable.parentId],
    references: [departamentoTable.id],
    relationName: 'departamento_hierarchy',
  }),
  children: many(departamentoTable, {
    relationName: 'departamento_hierarchy',
  }),
  disciplinas: many(disciplinaTable),
  projetos: many(projetoTable),
}))

// Import is placed at the bottom to avoid circular dependency
import { disciplinaTable } from './discipline'
import { projetoTable } from './project'

// Type exports
export type Departamento = typeof departamentoTable.$inferSelect
export type NewDepartamento = typeof departamentoTable.$inferInsert
