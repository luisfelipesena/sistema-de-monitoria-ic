import { cursoTable } from '@/server/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const cursoSchema = createSelectSchema(cursoTable);
export const cursoInputSchema = createInsertSchema(cursoTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type CursoResponse = z.infer<typeof cursoSchema>[];
