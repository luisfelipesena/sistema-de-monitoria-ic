import { relations } from 'drizzle-orm'
import { decimal, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { tipoVagaEnum } from './enums'
import { alunoTable } from './student'
import { projetoTable } from './project'

export const periodoInscricaoTable = pgTable('periodo_inscricao', {
  id: serial('id').primaryKey(),
  ano: integer('ano').notNull(),
  semestre: text('semestre').notNull(),
  dataInicio: timestamp('data_inicio', { withTimezone: true, mode: 'date' }).notNull(),
  dataFim: timestamp('data_fim', { withTimezone: true, mode: 'date' }).notNull(),
  totalBolsasPrograd: integer('total_bolsas_prograd'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
})

export const inscricaoTable = pgTable('inscricao', {
  id: serial('id').primaryKey(),
  periodoInscricaoId: integer('periodo_inscricao_id')
    .notNull()
    .references(() => periodoInscricaoTable.id),
  projetoId: integer('projeto_id')
    .notNull()
    .references(() => projetoTable.id),
  alunoId: integer('aluno_id')
    .notNull()
    .references(() => alunoTable.id),
  tipoVagaPretendida: tipoVagaEnum('tipo_vaga_pretendida'),
  status: text('status').notNull().default('SUBMITTED'),
  notaDisciplina: decimal('nota_disciplina', { precision: 4, scale: 2 }),
  notaSelecao: decimal('nota_selecao', { precision: 4, scale: 2 }),
  coeficienteRendimento: decimal('coeficiente_rendimento', { precision: 4, scale: 2 }),
  notaFinal: decimal('nota_final', { precision: 4, scale: 2 }),
  feedbackProfessor: text('feedback_professor'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
})

export const inscricaoDocumentoTable = pgTable('inscricao_documento', {
  id: serial('id').primaryKey(),
  inscricaoId: integer('inscricao_id')
    .notNull()
    .references(() => inscricaoTable.id),
  fileId: text('file_id').notNull(),
  tipoDocumento: text('tipo_documento').notNull(),
})

export const inscricaoRelations = relations(inscricaoTable, ({ one, many }) => ({
  periodoInscricao: one(periodoInscricaoTable, {
    fields: [inscricaoTable.periodoInscricaoId],
    references: [periodoInscricaoTable.id],
  }),
  projeto: one(projetoTable, {
    fields: [inscricaoTable.projetoId],
    references: [projetoTable.id],
  }),
  aluno: one(alunoTable, {
    fields: [inscricaoTable.alunoId],
    references: [alunoTable.id],
  }),
  documentos: many(inscricaoDocumentoTable),
}))

export const periodoInscricaoRelations = relations(periodoInscricaoTable, ({ many, one }) => ({
  inscricoes: many(inscricaoTable),
  edital: one(editalTable),
}))

// Import at bottom to avoid circular dependency
import { editalTable } from './edital'

// Type exports
export type Inscricao = typeof inscricaoTable.$inferSelect
export type NewInscricao = typeof inscricaoTable.$inferInsert
export type PeriodoInscricao = typeof periodoInscricaoTable.$inferSelect
export type NewPeriodoInscricao = typeof periodoInscricaoTable.$inferInsert
