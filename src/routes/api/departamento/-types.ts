import { departamentoTable } from '@/server/database/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const departamentoSchema = createSelectSchema(departamentoTable);

export type DepartamentoResponse = z.infer<typeof departamentoSchema>;
