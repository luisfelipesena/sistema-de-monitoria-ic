import { relations } from 'drizzle-orm'
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { tipoVagaEnum } from './enums'
import { alunoTable } from './student'
import { inscricaoTable } from './inscription'

export const vagaTable = pgTable('vaga', {
  id: serial('id').primaryKey(),
  inscricaoId: integer('inscricao_id')
    .notNull()
    .references(() => inscricaoTable.id),
  alunoId: integer('aluno_id')
    .notNull()
    .references(() => alunoTable.id),
  tipo: tipoVagaEnum('tipo').notNull(),
  status: text('status').notNull().default('ATIVA'),
  dataInicio: timestamp('data_inicio', { withTimezone: true, mode: 'date' }),
  dataFim: timestamp('data_fim', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
})

export const vagaRelations = relations(vagaTable, ({ one }) => ({
  inscricao: one(inscricaoTable, {
    fields: [vagaTable.inscricaoId],
    references: [inscricaoTable.id],
  }),
  aluno: one(alunoTable, {
    fields: [vagaTable.alunoId],
    references: [alunoTable.id],
  }),
}))

// Type exports
export type Vaga = typeof vagaTable.$inferSelect
export type NewVaga = typeof vagaTable.$inferInsert