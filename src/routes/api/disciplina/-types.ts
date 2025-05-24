import { disciplinaTable } from '@/server/database/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const disciplinaSchema = createSelectSchema(disciplinaTable);

export type DisciplinaResponse = z.infer<typeof disciplinaSchema>;
