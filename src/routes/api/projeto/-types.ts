import {
  atividadeProjetoTable,
  departamentoTable,
  disciplinaTable,
  insertProjetoTableSchema,
  professorTable,
  projetoDisciplinaTable,
  projetoProfessorParticipanteTable,
  projetoStatusEnum,
  selectAlunoTableSchema,
  selectAtividadeProjetoTableSchema,
  selectDepartamentoTableSchema,
  selectDisciplinaTableSchema,
  selectProfessorTableSchema,
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

export const projetoInputSchema = z.object({
  titulo: z.string().min(5),
  descricao: z.string().min(5),
  departamentoId: z.number(),
  disciplinaIds: z.array(z.number()).min(1),
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA']),
  bolsasSolicitadas: z.number().optional(),
  voluntariosSolicitados: z.number().optional(),
  cargaHorariaSemana: z.number(),
  numeroSemanas: z.number(),
  publicoAlvo: z.string(),
  estimativaPessoasBenificiadas: z.number().optional(),
  atividades: z.array(z.string()).optional(),
  professoresParticipantes: z.array(z.number()).optional(),
  professorResponsavelId: z.number().optional(), // Obrigatório para admin
});

export const projetoListItemSchema = selectProjetoTableSchema.extend({
  departamentoNome: z.string(),
  professorResponsavelNome: z.string(),
  disciplinas: z.array(
    z.object({
      id: z.number(),
      nome: z.string(),
      codigo: z.string(),
    }),
  ),
  totalInscritos: z.number(),
  inscritosBolsista: z.number(),
  inscritosVoluntario: z.number(),
});

export const projetoDetalhesSchema = selectProjetoTableSchema.extend({
  departamento: selectDepartamentoTableSchema,
  professorResponsavel: selectProfessorTableSchema.extend({
    user: z.object({ id: z.number() }),
  }),
  disciplinas: z.array(
    z.object({
      disciplina: selectDisciplinaTableSchema,
    }),
  ),
  professoresParticipantes: z.array(
    z.object({
      professor: selectProfessorTableSchema,
    }),
  ),
  atividades: z.array(selectAtividadeProjetoTableSchema),
});

export type ProjetoInput = z.infer<typeof projetoInputSchema>;
export type ProjetoListItem = z.infer<typeof projetoListItemSchema>;
export type ProjetoDetalhes = z.infer<typeof projetoDetalhesSchema>;

// Novo schema para atualização de alocações pelo Admin
export const projetoAllocationsInputSchema = z.object({
  bolsasDisponibilizadas: z.number().min(0).optional(),
  voluntariosSolicitados: z.number().min(0).optional(), // Permitir admin ajustar se necessário
  feedbackAdmin: z.string().optional(),
});
export type ProjetoAllocationsInput = z.infer<typeof projetoAllocationsInputSchema>;
