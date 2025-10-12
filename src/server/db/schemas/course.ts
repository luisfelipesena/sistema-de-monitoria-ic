import { relations } from 'drizzle-orm'
import { integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core'
import { grauAcademicoEnum, modalidadeEnum, turnoEnum } from './enums'
import { departamentoTable } from './department'

export const courseTable = pgTable('course', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  codigo: varchar('codigo', { length: 20 }).unique(),
  departamentoId: integer('departamento_id').references(() => departamentoTable.id),
  turno: turnoEnum('turno').notNull(),
  modalidade: modalidadeEnum('modalidade').notNull(),
  grauAcademico: grauAcademicoEnum('grau_academico').notNull(),
  duracaoSemestres: integer('duracao_semestres').notNull(),
})

export const courseRelations = relations(courseTable, ({ one, many }) => ({
  departamento: one(departamentoTable, {
    fields: [courseTable.departamentoId],
    references: [departamentoTable.id],
  }),
  alunosCurso: many(alunoCursoTable),
  disciplinas: many(disciplinaTable),
}))

export const alunoCursoTable = pgTable('aluno_curso', {
  id: serial('id').primaryKey(),
  alunoId: integer('aluno_id')
    .notNull()
    .references(() => alunoTable.id),
  cursoId: integer('curso_id')
    .notNull()
    .references(() => courseTable.id),
  anoIngresso: integer('ano_ingresso').notNull(),
  semestreIngresso: integer('semestre_ingresso').notNull(),
})

export const alunoCursoRelations = relations(alunoCursoTable, ({ one }) => ({
  aluno: one(alunoTable, {
    fields: [alunoCursoTable.alunoId],
    references: [alunoTable.id],
  }),
  curso: one(courseTable, {
    fields: [alunoCursoTable.cursoId],
    references: [courseTable.id],
  }),
}))

// Import is placed at the bottom to avoid circular dependency
import { alunoTable } from './student'
import { disciplinaTable } from './discipline'

// Type exports
export type Course = typeof courseTable.$inferSelect
export type NewCourse = typeof courseTable.$inferInsert
export type AlunoCurso = typeof alunoCursoTable.$inferSelect
export type NewAlunoCurso = typeof alunoCursoTable.$inferInsert
