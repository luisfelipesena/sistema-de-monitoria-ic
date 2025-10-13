import { relations } from 'drizzle-orm'
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { projetoStatusEnum, semestreEnum, tipoProposicaoEnum } from './enums'
import { departamentoTable } from './department'
import { professorTable } from './professor'
import { disciplinaTable } from './discipline'

export const projetoTable = pgTable('projeto', {
  id: serial('id').primaryKey(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao').notNull(),
  departamentoId: integer('departamento_id')
    .notNull()
    .references(() => departamentoTable.id),
  professorResponsavelId: integer('professor_responsavel_id')
    .notNull()
    .references(() => professorTable.id),
  status: projetoStatusEnum('status').notNull().default('DRAFT'),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  tipoProposicao: tipoProposicaoEnum('tipo_proposicao').notNull(),
  bolsasSolicitadas: integer('bolsas_solicitadas').notNull().default(0),
  voluntariosSolicitados: integer('voluntarios_solicitados').notNull().default(0),
  bolsasDisponibilizadas: integer('bolsas_disponibilizadas'),
  cargaHorariaSemana: integer('carga_horaria_semana').notNull().default(12),
  numeroSemanas: integer('numero_semanas').notNull().default(16),
  publicoAlvo: text('publico_alvo').notNull(),
  estimativaPessoasBenificiadas: integer('estimativa_pessoas_benificiadas'),
  assinaturaProfessor: text('assinatura_professor'),
  feedbackAdmin: text('feedback_admin'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
})

export const projetoDisciplinaTable = pgTable('projeto_disciplina', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .notNull()
    .references(() => projetoTable.id),
  disciplinaId: integer('disciplina_id')
    .notNull()
    .references(() => disciplinaTable.id),
})

export const projetoProfessorParticipanteTable = pgTable('projeto_professor_participante', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .notNull()
    .references(() => projetoTable.id),
  professorId: integer('professor_id')
    .notNull()
    .references(() => professorTable.id),
})

export const atividadeProjetoTable = pgTable('atividade_projeto', {
  id: serial('id').primaryKey(),
  projetoId: integer('projeto_id')
    .notNull()
    .references(() => projetoTable.id),
  descricao: text('descricao').notNull(),
})

export const projetoRelations = relations(projetoTable, ({ one, many }) => ({
  departamento: one(departamentoTable, {
    fields: [projetoTable.departamentoId],
    references: [departamentoTable.id],
  }),
  professorResponsavel: one(professorTable, {
    fields: [projetoTable.professorResponsavelId],
    references: [professorTable.id],
  }),
  disciplinas: many(projetoDisciplinaTable),
  professoresParticipantes: many(projetoProfessorParticipanteTable),
  atividades: many(atividadeProjetoTable),
  inscricoes: many(inscricaoTable),
}))

export const projetoDisciplinaRelations = relations(projetoDisciplinaTable, ({ one }) => ({
  projeto: one(projetoTable, {
    fields: [projetoDisciplinaTable.projetoId],
    references: [projetoTable.id],
  }),
  disciplina: one(disciplinaTable, {
    fields: [projetoDisciplinaTable.disciplinaId],
    references: [disciplinaTable.id],
  }),
}))

// Import at bottom to avoid circular dependency
import { inscricaoTable } from './inscription'

// Type exports
export type Projeto = typeof projetoTable.$inferSelect
export type NewProjeto = typeof projetoTable.$inferInsert
