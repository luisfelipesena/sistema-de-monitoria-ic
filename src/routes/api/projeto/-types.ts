import {
  atividadeProjetoTable,
  departamentoTable,
  disciplinaTable,
  insertProjetoTableSchema,
  professorTable,
  projetoDisciplinaTable,
  projetoProfessorParticipanteTable,
  projetoStatusEnum,
  selectProjetoTableSchema,
} from '@/server/database/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const baseProjetoSchema = selectProjetoTableSchema;

const simpleDisciplinaSchema = createSelectSchema(disciplinaTable).pick({
  id: true,
  nome: true,
  codigo: true,
});
const simpleProfessorSchema = createSelectSchema(professorTable).pick({
  id: true,
  nomeCompleto: true,
});
const simpleDepartamentoSchema = createSelectSchema(departamentoTable).pick({
  id: true,
  nome: true,
});
const atividadeSchema = createSelectSchema(atividadeProjetoTable).pick({
  id: true,
  descricao: true,
});

const projetoDisciplinaRelationSchema = createSelectSchema(
  projetoDisciplinaTable,
).extend({
  disciplina: simpleDisciplinaSchema,
});
const projetoProfessorParticipanteRelationSchema = createSelectSchema(
  projetoProfessorParticipanteTable,
).extend({
  professor: simpleProfessorSchema,
});

export const projetoComRelationsSchema = baseProjetoSchema.extend({
  professorResponsavel: simpleProfessorSchema.optional(),
  departamento: simpleDepartamentoSchema.optional(),
  disciplinas: z.array(projetoDisciplinaRelationSchema).optional(),
  professoresParticipantes: z
    .array(projetoProfessorParticipanteRelationSchema)
    .optional(),
  atividades: z.array(atividadeSchema).optional(),
});

export type ProjetoResponse = z.infer<typeof projetoComRelationsSchema>;

export const projetoInputSchema = insertProjetoTableSchema.extend({
  disciplinaIds: z
    .array(z.number())
    .min(1, 'Pelo menos uma disciplina deve ser selecionada'),
  professoresParticipantes: z.array(z.number()).optional(),
  atividades: z.array(z.string()).optional(),
});

export const projetoListItemSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  departamentoId: z.number(),
  departamentoNome: z.string(),
  professorResponsavelId: z.number(),
  professorResponsavelNome: z.string(),
  disciplinas: z.array(simpleDisciplinaSchema),
  status: z.enum(projetoStatusEnum.enumValues),
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  bolsasSolicitadas: z.number(),
  voluntariosSolicitados: z.number(),
  bolsasDisponibilizadas: z.number().nullable().optional(),
  totalInscritos: z.number(),
  inscritosBolsista: z.number(),
  inscritosVoluntario: z.number(),
  createdAt: z.date(),
  feedbackAdmin: z.string().nullable().optional(),
  tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA']).optional(),
  cargaHorariaSemana: z.number().optional(),
  numeroSemanas: z.number().optional(),
  publicoAlvo: z.string().optional(),
  estimativaPessoasBenificiadas: z.number().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
  deletedAt: z.date().nullable().optional(),
  description: z.string().optional(),
});

export type ProjetoInput = z.infer<typeof projetoInputSchema>;
export type ProjetoListItem = z.infer<typeof projetoListItemSchema>;
