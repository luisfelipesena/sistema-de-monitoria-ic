import { editalTable } from '@/server/database/schema';
import { periodoInscricaoComStatusSchema } from '@/routes/api/periodo-inscricao/-types';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Schema para um edital individual (resposta da API)
export const editalResponseSchema = createSelectSchema(editalTable);
export type EditalResponse = z.infer<typeof editalResponseSchema>;

// Schema para entrada de dados ao criar/atualizar um edital
export const editalInputSchema = createInsertSchema(editalTable, {
  // Campos obrigatórios para criação/atualização
  periodoInscricaoId: z.number({
    required_error: 'O período de inscrição é obrigatório.',
    invalid_type_error: 'ID do período de inscrição deve ser um número.',
  }).min(1, "Período de inscrição é obrigatório."),
  numeroEdital: z.string({
    required_error: 'O número do edital é obrigatório.',
  }).min(1, "Número do edital é obrigatório."),
  titulo: z.string({
    required_error: 'O título do edital é obrigatório.',
  }).min(1, "Título é obrigatório."),
  descricaoHtml: z.string().optional(), // Pode ser opcional inicialmente
}).omit({
  id: true,
  criadoPorUserId: true, // Será pego do usuário autenticado
  createdAt: true,
  updatedAt: true,
  fileIdAssinado: true, // Será atualizado por outro endpoint
  dataPublicacao: true, // Será atualizado ao publicar
  publicado: true,      // Será atualizado ao publicar
});
export type EditalInput = z.infer<typeof editalInputSchema>;

// Schema para a lista de editais, incluindo o status do período
export const editalListItemSchema = editalResponseSchema.extend({
  periodoInscricao: periodoInscricaoComStatusSchema.optional(), // Opcional, mas idealmente sempre incluído
  // Adicionar contagem de projetos/vagas vinculadas se necessário no futuro
});
export type EditalListItem = z.infer<typeof editalListItemSchema>; 