import {
  createSelectSchema,
  createInsertSchema,
} from 'drizzle-zod';
import {
  disciplinaTable,
  departamentoTable,
  disciplinaProfessorResponsavelTable,
} from '@/server/database/schema';
import { z } from 'zod';

// Base schema for selecting a disciplina
const baseDisciplinaSchema = createSelectSchema(disciplinaTable);

// Base schema for a department
const departamentoSchema = createSelectSchema(departamentoTable);

// Schema for a disciplina with its department relation
export const DisciplinaSchema = baseDisciplinaSchema.extend({
  departamento: departamentoSchema.optional(),
});
export type Disciplina = z.infer<typeof DisciplinaSchema>;

// Alias for response type consistency
export type DisciplinaResponse = Disciplina;

// Schema for creating a new disciplina
export const DisciplinaInputSchema = createInsertSchema(disciplinaTable).pick({
  nome: true,
  codigo: true,
  departamentoId: true,
});
export type DisciplinaInput = z.infer<typeof DisciplinaInputSchema>;

// Base schema for the professor-disciplina association
const baseProfessorDisciplinaSchema = createSelectSchema(
  disciplinaProfessorResponsavelTable
);

// Schema for the professor-disciplina association, including the full disciplina details
export const ProfessorDisciplinaSchema = baseProfessorDisciplinaSchema.extend({
  disciplina: DisciplinaSchema,
});
export type ProfessorDisciplina = z.infer<typeof ProfessorDisciplinaSchema>;

// Schema for professor-disciplina vinculo operations
export const disciplinaProfessorVinculoSchema = z.object({
  disciplinaId: z.number(),
  professorId: z.number(),
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
});
export type DisciplinaProfessorVinculo = z.infer<typeof disciplinaProfessorVinculoSchema>;
