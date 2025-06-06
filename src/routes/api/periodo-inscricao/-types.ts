import { periodoInscricaoTable } from '@/server/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const periodoInscricaoResponseSchema = createSelectSchema(
  periodoInscricaoTable,
);

export const periodoInscricaoInputSchema = z.object({
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
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
