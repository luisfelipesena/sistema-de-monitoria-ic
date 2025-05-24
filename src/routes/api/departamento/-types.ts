import {
  departamentoTable,
  insertDepartamentoTableSchema,
} from '@/server/database/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const departamentoSchema = createSelectSchema(departamentoTable);

export const departamentoInputSchema = insertDepartamentoTableSchema;

export type DepartamentoResponse = z.infer<typeof departamentoSchema>;
export type DepartamentoInput = z.infer<typeof departamentoInputSchema>;
