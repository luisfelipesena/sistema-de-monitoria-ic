import * as z from 'zod';

export const projetoFormSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  departamentoId: z.number().min(1, 'Departamento é obrigatório'),
  professorResponsavelId: z
    .number({
      invalid_type_error: 'Professor responsável deve ser um ID numérico.',
    })
    .optional(),
  coordenadorResponsavel: z.string().optional(),
  ano: z.number().min(2024, 'Ano deve ser válido'),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2'], {
    required_error: 'Semestre é obrigatório',
  }),
  tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA'], {
    required_error: 'Tipo de proposição é obrigatório',
  }),
  bolsasSolicitadas: z.number().min(0, 'Número de bolsas deve ser positivo'),
  voluntariosSolicitados: z
    .number()
    .min(0, 'Número de voluntários deve ser positivo'),
  cargaHorariaSemana: z.number().min(1, 'Carga horária semanal é obrigatória'),
  numeroSemanas: z.number().min(1, 'Número de semanas é obrigatório'),
  publicoAlvo: z.string().min(1, 'Público alvo é obrigatório'),
  estimativaPessoasBenificiadas: z.number().optional(),
  disciplinaIds: z
    .array(z.number())
    .min(1, 'Pelo menos uma disciplina deve ser selecionada'),
  professoresParticipantesIds: z.array(z.number()).optional(),
});

export type ProjetoFormData = z.infer<typeof projetoFormSchema>;

export const defaultFormValues: ProjetoFormData = {
  ano: new Date().getFullYear(),
  semestre: 'SEMESTRE_1',
  tipoProposicao: 'INDIVIDUAL',
  bolsasSolicitadas: 0,
  voluntariosSolicitados: 0,
  cargaHorariaSemana: 4,
  numeroSemanas: 16,
  disciplinaIds: [],
  professoresParticipantesIds: [],
  titulo: '',
  descricao: '',
  departamentoId: 0,
  professorResponsavelId: 0,
  coordenadorResponsavel: '',
  publicoAlvo: '',
  estimativaPessoasBenificiadas: undefined,
};

export interface PDFPreviewState {
  isVisible: boolean;
  shouldRender: boolean;
  isUserTyping: boolean;
  isRendering: boolean;
}

export interface PDFPreviewStatus {
  icon: any;
  title: string;
  message: string;
  color: string;
  spinning?: boolean;
}
