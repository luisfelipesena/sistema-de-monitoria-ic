import { inscricaoTable } from '@/server/database/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const inscricaoResponseSchema = createSelectSchema(inscricaoTable);

export const inscricaoComDetalhesSchema = z.object({
  id: z.number(),
  periodoInscricaoId: z.number(),
  projetoId: z.number(),
  alunoId: z.number(),
  tipoVagaPretendida: z.enum(['BOLSISTA', 'VOLUNTARIO', 'ANY']),
  status: z.enum([
    'SUBMITTED',
    'SELECTED_BOLSISTA',
    'SELECTED_VOLUNTARIO',
    'ACCEPTED_BOLSISTA',
    'ACCEPTED_VOLUNTARIO',
    'REJECTED_BY_PROFESSOR',
    'REJECTED_BY_STUDENT',
  ]),
  feedbackProfessor: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  // Dados do projeto
  projeto: z.object({
    id: z.number(),
    titulo: z.string(),
    departamentoId: z.number(),
    ano: z.number(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']),
    professorResponsavel: z.object({
      id: z.number(),
      nomeCompleto: z.string(),
      emailInstitucional: z.string(),
    }),
  }),
  // Dados do aluno
  aluno: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    emailInstitucional: z.string(),
    matricula: z.string(),
    cr: z.number(),
  }),
  // Dados das disciplinas do projeto
  disciplinas: z.array(
    z.object({
      id: z.number(),
      nome: z.string(),
      codigo: z.string(),
    }),
  ),
});

export type InscricaoResponse = z.infer<typeof inscricaoResponseSchema>;
export type InscricaoComDetalhes = z.infer<typeof inscricaoComDetalhesSchema>;
