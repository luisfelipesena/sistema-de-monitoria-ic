import { relations } from 'drizzle-orm'
import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { semestreEnum } from './enums'
import { departamentoTable } from './department'
import { courseTable } from './course'
import { professorTable } from './professor'

export const disciplinaTable = pgTable('disciplina', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  codigo: varchar('codigo', { length: 20 }).notNull(),
  cargaHoraria: integer('carga_horaria').notNull(),
  departamentoId: integer('departamento_id').references(() => departamentoTable.id),
  courseId: integer('course_id').references(() => courseTable.id),
  turma: varchar('turma', { length: 10 }).notNull(),
})

export const disciplinaProfessorResponsavelTable = pgTable('disciplina_professor_responsavel', {
  id: serial('id').primaryKey(),
  disciplinaId: integer('disciplina_id')
    .notNull()
    .references(() => disciplinaTable.id),
  professorId: integer('professor_id')
    .notNull()
    .references(() => professorTable.id),
  ano: integer('ano').notNull(),
  semestre: semestreEnum('semestre').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .notNull()
    .defaultNow(),
})

export const disciplinaRelations = relations(disciplinaTable, ({ one, many }) => ({
  departamento: one(departamentoTable, {
    fields: [disciplinaTable.departamentoId],
    references: [departamentoTable.id],
  }),
  course: one(courseTable, {
    fields: [disciplinaTable.courseId],
    references: [courseTable.id],
  }),
  projetos: many(projetoDisciplinaTable),
  professoresResponsaveis: many(disciplinaProfessorResponsavelTable),
}))

export const disciplinaProfessorResponsavelRelations = relations(disciplinaProfessorResponsavelTable, ({ one }) => ({
  disciplina: one(disciplinaTable, {
    fields: [disciplinaProfessorResponsavelTable.disciplinaId],
    references: [disciplinaTable.id],
  }),
  professor: one(professorTable, {
    fields: [disciplinaProfessorResponsavelTable.professorId],
    references: [professorTable.id],
  }),
}))

// Import is placed at the bottom to avoid circular dependency
import { projetoDisciplinaTable } from './project'

// Type exports
export type Disciplina = typeof disciplinaTable.$inferSelect
export type NewDisciplina = typeof disciplinaTable.$inferInsert
export type DisciplinaProfessorResponsavel = typeof disciplinaProfessorResponsavelTable.$inferSelect
export type NewDisciplinaProfessorResponsavel = typeof disciplinaProfessorResponsavelTable.$inferInsert
