import { projetoTemplateTable } from '@/server/database/schema';
import { disciplinaTable } from '@/server/database/schema'; // For relation
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const projetoTemplateSchema = createSelectSchema(projetoTemplateTable);

export const projetoTemplateWithRelationsSchema = projetoTemplateSchema.extend({
  disciplina: createSelectSchema(disciplinaTable).optional(), // Assuming disciplina might not always be eager loaded or could be null
});

export const insertProjetoTemplateSchema = createInsertSchema(projetoTemplateTable, {
  // Override default Zod types if necessary, e.g., for number coercion
  disciplinaId: z.number({
    required_error: 'Disciplina é obrigatória',
    invalid_type_error: 'ID da disciplina deve ser um número',
  }),
  tituloDefault: z.string().optional(),
  descricaoDefault: z.string().optional(),
  cargaHorariaSemanaDefault: z.number().positive().optional().nullable(),
  numeroSemanasDefault: z.number().positive().optional().nullable(),
  publicoAlvoDefault: z.string().optional(),
  atividadesDefault: z.string().optional(),
  // criadoPorUserId will be set by the backend from ctx.state.user.userId
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  criadoPorUserId: true, // Will be handled by backend context
  ultimaAtualizacaoUserId: true, // Will be handled by backend context
});

export type ProjetoTemplate = z.infer<typeof projetoTemplateSchema>;
export type ProjetoTemplateWithRelations = z.infer<typeof projetoTemplateWithRelationsSchema>;
export type ProjetoTemplateInput = z.infer<typeof insertProjetoTemplateSchema>; 