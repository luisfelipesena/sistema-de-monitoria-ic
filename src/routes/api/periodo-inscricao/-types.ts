import { periodoInscricaoTable } from '@/server/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const periodoInscricaoResponseSchema = createSelectSchema(
  periodoInscricaoTable,
);

export const periodoInscricaoInputSchema = createInsertSchema(
  periodoInscricaoTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const periodoInscricaoComStatusSchema =
  periodoInscricaoResponseSchema.extend({
    status: z.enum(['ATIVO', 'FUTURO', 'FINALIZADO']),
    totalProjetos: z.number(),
    totalInscricoes: z.number(),
  });

export type PeriodoInscricaoResponse = z.infer<
  typeof periodoInscricaoResponseSchema
>;
export type PeriodoInscricaoInput = z.infer<typeof periodoInscricaoInputSchema>;
export type PeriodoInscricaoComStatus = z.infer<
  typeof periodoInscricaoComStatusSchema
>;
