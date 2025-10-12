import { relations } from 'drizzle-orm'
import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { generoEnum, regimeEnum } from './enums'
import { userTable } from './auth'

export const professorTable = pgTable('professor', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .unique()
    .notNull()
    .references(() => userTable.id),
  nomeCompleto: text('nome_completo').notNull(),
  nomeSocial: text('nome_social'),
  genero: generoEnum('genero'),
  cpf: varchar('cpf', { length: 14 }).unique(),
  matriculaSiape: varchar('matricula_siape', { length: 20 }).unique(),
  regime: regimeEnum('regime'),
  telefone: varchar('telefone', { length: 20 }),
  telefoneInstitucional: varchar('telefone_institucional', { length: 20 }),
  emailInstitucional: text('email_institucional'),
  onboardingCompletedAt: timestamp('onboarding_completed_at', {
    withTimezone: true,
    mode: 'date',
  }),
  departamentoIds: text('departamento_ids'), // JSON array of department IDs - for multiple department association
})

export const professorRelations = relations(professorTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [professorTable.userId],
    references: [userTable.id],
  }),
  projetosResponsavel: many(projetoTable),
  projetosParticipante: many(projetoProfessorParticipanteTable),
  disciplinasResponsavel: many(disciplinaProfessorResponsavelTable),
}))

// Import is placed at the bottom to avoid circular dependency
import { projetoTable } from './project'
import { projetoProfessorParticipanteTable } from './project'
import { disciplinaProfessorResponsavelTable } from './discipline'

// Type exports
export type Professor = typeof professorTable.$inferSelect
export type NewProfessor = typeof professorTable.$inferInsert
