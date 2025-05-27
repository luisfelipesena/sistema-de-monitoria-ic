import { selectProjectTableSchema } from '@/server/database/schema';
import { z } from 'zod';

export const projectResponseSchema = selectProjectTableSchema;

export const projectInputSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  departamentoId: z.number(),
  professorResponsavelId: z.number().optional(), // Opcional no frontend, será resolvido no backend
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA']),
  bolsasSolicitadas: z.number().min(0),
  voluntariosSolicitados: z.number().min(0),
  cargaHorariaSemana: z.number().min(1),
  numeroSemanas: z.number().min(1),
  publicoAlvo: z.string().min(1),
  estimativaPessoasBenificiadas: z.number().optional(),
  disciplinaIds: z
    .array(z.number())
    .min(1, 'Pelo menos uma disciplina deve ser selecionada'),
  professoresParticipantes: z.array(z.number()).optional(),
  atividades: z.array(z.string()).optional(),
});

export const projectListItemSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  departamentoId: z.number(),
  departamentoNome: z.string(),
  professorResponsavelNome: z.string(),
  disciplinas: z.array(
    z.object({
      id: z.number(),
      nome: z.string(),
      codigo: z.string(),
    }),
  ),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']),
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  bolsasSolicitadas: z.number(),
  voluntariosSolicitados: z.number(),
  bolsasDisponibilizadas: z.number().nullable(),
  totalInscritos: z.number(),
  inscritosBolsista: z.number(),
  inscritosVoluntario: z.number(),
  createdAt: z.date(),
});

export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectListItem = z.infer<typeof projectListItemSchema>;

// Backwards compatibility exports (deprecated)
// @deprecated Use projectResponseSchema instead
export const projetoResponseSchema = projectResponseSchema;
// @deprecated Use projectInputSchema instead
export const projetoInputSchema = projectInputSchema;
// @deprecated Use projectListItemSchema instead
export const projetoListItemSchema = projectListItemSchema;
// @deprecated Use ProjectResponse instead
export type ProjetoResponse = ProjectResponse;
// @deprecated Use ProjectInput instead
export type ProjetoInput = ProjectInput;
// @deprecated Use ProjectListItem instead
export type ProjetoListItem = ProjectListItem;
