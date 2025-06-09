import {
  departamentoTable,
  insertDepartamentoTableSchema,
} from '@/server/database/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const departamentoSchema = createSelectSchema(departamentoTable);

export const departamentoInputSchema = insertDepartamentoTableSchema.extend({
  unidadeUniversitaria: z.string({
    required_error: 'Unidade universitária é obrigatória',
  }).min(1, 'Unidade universitária não pode estar vazia'),
});

export type DepartamentoResponse = z.infer<typeof departamentoSchema>;
export type DepartamentoInput = z.infer<typeof departamentoInputSchema>;
