import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { tipoEditalEnum } from './enums'
import { periodoInscricaoTable } from './inscription'
import { userTable } from './auth'

export const editalTable = pgTable('edital', {
  id: serial('id').primaryKey(),
  periodoInscricaoId: integer('periodo_inscricao_id')
    .notNull()
    .references(() => periodoInscricaoTable.id),
  tipo: tipoEditalEnum('tipo').notNull().default('DCC'),
  numeroEdital: varchar('numero_edital', { length: 100 }).notNull(),
  titulo: text('titulo').notNull().default('Edital Interno de Seleção de Monitores'),
  descricaoHtml: text('descricao_html'),
  fileIdAssinado: text('file_id_assinado'),
  fileIdProgradOriginal: text('file_id_prograd_original'),
  dataPublicacao: timestamp('data_publicacao', { withTimezone: true, mode: 'date' }),
  publicado: boolean('publicado').notNull().default(false),
  valorBolsa: varchar('valor_bolsa', { length: 20 }).default('400.00'),
  datasProvasDisponiveis: text('datas_provas_disponiveis'), // JSON array
  dataDivulgacaoResultado: timestamp('data_divulgacao_resultado', { withTimezone: true, mode: 'date' }),
  chefeAssinouEm: timestamp('chefe_assinou_em', { withTimezone: true, mode: 'date' }),
  chefeAssinatura: text('chefe_assinatura'),
  chefeDepartamentoId: integer('chefe_departamento_id'),
  criadoPorUserId: integer('criado_por_user_id')
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
})

export const editalRelations = relations(editalTable, ({ one }) => ({
  periodoInscricao: one(periodoInscricaoTable, {
    fields: [editalTable.periodoInscricaoId],
    references: [periodoInscricaoTable.id],
  }),
  criadoPor: one(userTable, {
    fields: [editalTable.criadoPorUserId],
    references: [userTable.id],
  }),
}))

// Type exports
export type Edital = typeof editalTable.$inferSelect
export type NewEdital = typeof editalTable.$inferInsert