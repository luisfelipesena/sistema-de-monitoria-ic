import { disciplinaTable, semestreEnum } from '@/server/database/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const disciplinaSchema = createSelectSchema(disciplinaTable);

export type DisciplinaResponse = z.infer<typeof disciplinaSchema>;

export const disciplinaProfessorVinculoSchema = z.object({
  disciplinaId: z.number().positive(),
  professorId: z.number().positive(),
  ano: z.number().positive(),
  semestre: z.enum(semestreEnum.enumValues),
});

export type DisciplinaProfessorVinculo = z.infer<
  typeof disciplinaProfessorVinculoSchema
>;

export const disciplinaComProfessorSchema = disciplinaSchema.extend({
  professorResponsavel: z.string().nullable(),
  professorResponsavelId: z.number().nullable(),
});

export type DisciplinaComProfessor = z.infer<
  typeof disciplinaComProfessorSchema
>;
