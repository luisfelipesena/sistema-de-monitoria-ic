import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, real, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { generoEnum, racaEnum } from './enums'
import { userTable } from './auth'

export const alunoTable = pgTable('aluno', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .unique()
    .notNull()
    .references(() => userTable.id),
  nomeCompleto: text('nome_completo').notNull(),
  matricula: varchar('matricula', { length: 20 }).unique(),
  genero: generoEnum('genero'),
  raca: racaEnum('raca'),
  cpf: varchar('cpf', { length: 14 }).unique(),
  rg: varchar('rg', { length: 20 }),
  orgaoExpedidor: varchar('orgao_expedidor', { length: 50 }),
  telefone: varchar('telefone', { length: 20 }),
  onboardingCompletedAt: timestamp('onboarding_completed_at', {
    withTimezone: true,
    mode: 'date',
  }),
  nomeSocial: text('nome_social'),
  cr: real('cr'),
  banco: varchar('banco', { length: 100 }),
  agencia: varchar('agencia', { length: 20 }),
  conta: varchar('conta', { length: 20 }),
  tipoConta: varchar('tipo_conta', { length: 20 }),
  chavePix: varchar('chave_pix', { length: 100 }),
  cotista: boolean('cotista').default(false),
})

export const alunoRelations = relations(alunoTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [alunoTable.userId],
    references: [userTable.id],
  }),
  inscricoes: many(inscricaoTable),
  vagas: many(vagaTable),
}))

// Import is placed at the bottom to avoid circular dependency
import { inscricaoTable } from './inscription'
import { vagaTable } from './vaga'

// Type exports
export type Aluno = typeof alunoTable.$inferSelect
export type NewAluno = typeof alunoTable.$inferInsert
