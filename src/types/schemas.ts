import { z } from 'zod'
import {
  anoSchema,
  generoSchema,
  modalidadeCursoSchema,
  prioridadeProblemaSchema,
  projetoStatusSchema,
  regimeSchema,
  semestreSchema,
  statusCursoSchema,
  statusEnvioSchema,
  statusInscricaoSchema,
  tipoCursoSchema,
  tipoInscricaoSchema,
  tipoProblemaSchema,
  tipoProposicaoSchema,
  tipoRelatorioSchema,
  tipoVagaSchema,
  userRoleSchema,
} from './enums'

// ========================================
// COMMON VALIDATION SCHEMAS
// ========================================

// Date and time schemas
export const dateSchema = z.date()
export const timestampSchema = z.date()

// Basic ID schema
export const idSchema = z.number().int().positive()
export const optionalIdSchema = z.number().int().positive().optional()

// String schemas
export const emailSchema = z.string().email()
export const usernameSchema = z.string().min(3).max(50)
export const nameSchema = z.string().min(1).max(255)
export const optionalNameSchema = z.string().min(1).max(255).optional()
export const descriptionSchema = z.string().min(1)
export const optionalDescriptionSchema = z.string().min(1).optional()

// Academic schemas
export const matriculaSchema = z.string().min(1).max(50)
export const cpfSchema = z.string().min(11).max(14)
export const rgSchema = z.string().max(20).optional()
export const phoneSchema = z.string().max(20).optional()
export const crSchema = z.number().min(0).max(10)

// Bank account schemas
export const bankAccountSchema = z.object({
  banco: z.string().max(100).optional().nullable(),
  agencia: z.string().max(20).optional().nullable(),
  conta: z.string().max(30).optional().nullable(),
  digitoConta: z.string().max(2).optional().nullable(),
})

// File schemas
export const fileIdSchema = z.string().min(1)
export const optionalFileIdSchema = z.string().min(1).optional()

// Signature schemas
export const signatureDataSchema = z.string().min(1) // Base64 data URL
export const optionalSignatureDataSchema = z.string().min(1).optional()

// ========================================
// FILTER SCHEMAS
// ========================================

// Base filter schema for reports and queries
export const baseFilterSchema = z.object({
  ano: anoSchema,
  semestre: semestreSchema,
})

// Filter with optional department
export const filterWithDepartmentSchema = baseFilterSchema.extend({
  departamentoId: optionalIdSchema,
})

// Filter with optional status
export const filterWithStatusSchema = baseFilterSchema.extend({
  status: statusInscricaoSchema.optional(),
})

// Filter with optional project status
export const filterWithProjetoStatusSchema = baseFilterSchema.extend({
  status: projetoStatusSchema.optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})

// Sort schema
export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
})

// ========================================
// USER SCHEMAS
// ========================================

// Base user schema
export const baseUserSchema = z.object({
  id: idSchema,
  username: usernameSchema,
  email: emailSchema,
  role: userRoleSchema,
})

// User creation schema
export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  role: userRoleSchema,
})

// User update schema
export const updateUserSchema = z.object({
  id: idSchema,
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
})

// ========================================
// PROFESSOR SCHEMAS
// ========================================

// Base professor schema
export const baseProfessorSchema = z.object({
  id: idSchema,
  userId: idSchema,
  departamentoId: idSchema,
  nomeCompleto: nameSchema,
  nomeSocial: optionalNameSchema,
  matriculaSiape: z.string().max(20).optional(),
  genero: generoSchema,
  regime: regimeSchema,
  especificacaoGenero: z.string().max(100).optional(),
  cpf: cpfSchema,
  telefone: phoneSchema,
  telefoneInstitucional: phoneSchema,
  emailInstitucional: emailSchema,
  curriculumVitaeFileId: optionalFileIdSchema,
  comprovanteVinculoFileId: optionalFileIdSchema,
  assinaturaDefault: optionalSignatureDataSchema,
  dataAssinaturaDefault: dateSchema.optional(),
})

// Professor creation schema
export const createProfessorSchema = z.object({
  userId: idSchema,
  departamentoId: idSchema,
  nomeCompleto: nameSchema,
  nomeSocial: optionalNameSchema,
  matriculaSiape: z.string().max(20).optional(),
  genero: generoSchema,
  regime: regimeSchema,
  especificacaoGenero: z.string().max(100).optional(),
  cpf: cpfSchema,
  telefone: phoneSchema,
  telefoneInstitucional: phoneSchema,
  emailInstitucional: emailSchema,
  curriculumVitaeFileId: optionalFileIdSchema,
  comprovanteVinculoFileId: optionalFileIdSchema,
})

// ========================================
// STUDENT SCHEMAS
// ========================================

// Base student schema
export const baseStudentSchema = z
  .object({
    id: idSchema,
    userId: idSchema,
    nomeCompleto: nameSchema,
    nomeSocial: optionalNameSchema,
    genero: generoSchema,
    especificacaoGenero: z.string().max(100).optional(),
    emailInstitucional: emailSchema,
    matricula: matriculaSchema,
    rg: rgSchema,
    cpf: cpfSchema,
    cr: crSchema,
    telefone: phoneSchema,
    cursoId: idSchema,
    enderecoId: optionalIdSchema,
    historicoEscolarFileId: optionalFileIdSchema,
    comprovanteMatriculaFileId: optionalFileIdSchema,
  })
  .merge(bankAccountSchema)

// Student creation schema
export const createStudentSchema = z
  .object({
    userId: idSchema,
    nomeCompleto: nameSchema,
    nomeSocial: optionalNameSchema,
    genero: generoSchema,
    especificacaoGenero: z.string().max(100).optional(),
    emailInstitucional: emailSchema,
    matricula: matriculaSchema,
    rg: rgSchema,
    cpf: cpfSchema,
    cr: crSchema,
    telefone: phoneSchema,
    cursoId: idSchema,
    enderecoId: optionalIdSchema,
  })
  .merge(bankAccountSchema)

// ========================================
// PROJECT SCHEMAS
// ========================================

// Base project schema
export const baseProjectSchema = z.object({
  id: idSchema,
  departamentoId: idSchema,
  ano: anoSchema,
  semestre: semestreSchema,
  tipoProposicao: tipoProposicaoSchema,
  bolsasSolicitadas: z.number().int().min(0),
  voluntariosSolicitados: z.number().int().min(0),
  bolsasDisponibilizadas: z.number().int().min(0).optional(),
  cargaHorariaSemana: z.number().int().positive(),
  numeroSemanas: z.number().int().positive(),
  publicoAlvo: descriptionSchema,
  estimativaPessoasBenificiadas: z.number().int().min(0).optional(),
  professorResponsavelId: idSchema,
  titulo: nameSchema,
  descricao: descriptionSchema,
  status: projetoStatusSchema,
  assinaturaProfessor: optionalSignatureDataSchema,
  assinaturaAdmin: optionalSignatureDataSchema,
  feedbackAdmin: optionalDescriptionSchema,
})

// Project creation schema
export const createProjectSchema = z.object({
  departamentoId: idSchema,
  ano: anoSchema,
  semestre: semestreSchema,
  tipoProposicao: tipoProposicaoSchema,
  bolsasSolicitadas: z.number().int().min(0).default(0),
  voluntariosSolicitados: z.number().int().min(0).default(0),
  bolsasDisponibilizadas: z.number().int().min(0).optional(),
  cargaHorariaSemana: z.number().int().positive(),
  numeroSemanas: z.number().int().positive(),
  publicoAlvo: descriptionSchema,
  estimativaPessoasBenificiadas: z.number().int().min(0).optional(),
  professorResponsavelId: idSchema,
  titulo: nameSchema,
  descricao: descriptionSchema,
  status: projetoStatusSchema.default('DRAFT'),
  assinaturaProfessor: optionalSignatureDataSchema,
  feedbackAdmin: optionalDescriptionSchema,
})

// Project update schema
export const updateProjectSchema = z.object({
  id: idSchema,
  departamentoId: optionalIdSchema,
  ano: anoSchema.optional(),
  semestre: semestreSchema.optional(),
  tipoProposicao: tipoProposicaoSchema.optional(),
  bolsasSolicitadas: z.number().int().min(0).optional(),
  voluntariosSolicitados: z.number().int().min(0).optional(),
  bolsasDisponibilizadas: z.number().int().min(0).optional(),
  cargaHorariaSemana: z.number().int().positive().optional(),
  numeroSemanas: z.number().int().positive().optional(),
  publicoAlvo: descriptionSchema.optional(),
  estimativaPessoasBenificiadas: z.number().int().min(0).optional(),
  professorResponsavelId: optionalIdSchema,
  titulo: nameSchema.optional(),
  descricao: descriptionSchema.optional(),
  status: projetoStatusSchema.optional(),
  assinaturaProfessor: optionalSignatureDataSchema,
  feedbackAdmin: optionalDescriptionSchema,
})

// ========================================
// INSCRIPTION SCHEMAS
// ========================================

// Base inscription schema
export const baseInscriptionSchema = z.object({
  id: idSchema,
  periodoInscricaoId: idSchema,
  projetoId: idSchema,
  alunoId: idSchema,
  tipoVagaPretendida: tipoInscricaoSchema.optional(),
  status: statusInscricaoSchema,
  notaDisciplina: z.number().min(0).max(10).optional(),
  notaSelecao: z.number().min(0).max(10).optional(),
  coeficienteRendimento: z.number().min(0).max(10).optional(),
  notaFinal: z.number().min(0).max(10).optional(),
  feedbackProfessor: optionalDescriptionSchema,
})

// Inscription creation schema
export const createInscriptionSchema = z.object({
  periodoInscricaoId: idSchema,
  projetoId: idSchema,
  alunoId: idSchema,
  tipoVagaPretendida: tipoInscricaoSchema.optional(),
  status: statusInscricaoSchema.default('SUBMITTED'),
  notaDisciplina: z.number().min(0).max(10).optional(),
  notaSelecao: z.number().min(0).max(10).optional(),
  coeficienteRendimento: z.number().min(0).max(10).optional(),
  notaFinal: z.number().min(0).max(10).optional(),
  feedbackProfessor: optionalDescriptionSchema,
})

// ========================================
// DEPARTMENT SCHEMAS
// ========================================

// Base department schema
export const baseDepartmentSchema = z.object({
  id: idSchema,
  unidadeUniversitaria: nameSchema,
  nome: nameSchema,
  sigla: z.string().max(20).optional().nullable(),
  coordenador: nameSchema.optional().nullable(),
  email: emailSchema.optional().nullable(),
  telefone: phoneSchema.nullable(),
  descricao: optionalDescriptionSchema.nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema.nullable(),
})

// Department creation schema
export const createDepartmentSchema = z.object({
  unidadeUniversitaria: nameSchema,
  nome: nameSchema,
  sigla: z.string().max(20).optional(),
  coordenador: nameSchema.optional(),
  email: emailSchema.optional().or(z.literal('')).nullable(),
  telefone: phoneSchema,
  descricao: optionalDescriptionSchema,
})

// Department update schema
export const updateDepartmentSchema = z.object({
  id: idSchema,
  unidadeUniversitaria: nameSchema.optional(),
  nome: nameSchema.optional(),
  sigla: z.string().max(20).optional(),
  coordenador: nameSchema.optional(),
  email: emailSchema.optional().or(z.literal('')).nullable(),
  telefone: phoneSchema.optional(),
  descricao: optionalDescriptionSchema.optional(),
})

// Department schema with optional stats
export const departamentoSchema = baseDepartmentSchema.extend({
  professores: z.number().optional(),
  cursos: z.number().optional(),
  disciplinas: z.number().optional(),
  projetos: z.number().optional(),
})

// ========================================
// DISCIPLINE SCHEMAS
// ========================================

// Base discipline schema
export const baseDisciplineSchema = z.object({
  id: idSchema,
  nome: nameSchema,
  codigo: z.string().min(1).max(50),
  departamentoId: idSchema,
})

// Discipline creation schema
export const createDisciplineSchema = z.object({
  nome: nameSchema,
  codigo: z.string().min(1).max(50),
  departamentoId: idSchema,
})

// ========================================
// COURSE SCHEMAS
// ========================================

// Base course schema, including optional stats
export const courseSchema = z.object({
  id: idSchema,
  nome: nameSchema,
  codigo: z.number().int().positive(),
  tipo: tipoCursoSchema,
  modalidade: modalidadeCursoSchema,
  duracao: z.number().int().positive(),
  departamentoId: idSchema,
  cargaHoraria: z.number().int().positive(),
  descricao: optionalDescriptionSchema.nullable(),
  coordenador: nameSchema.optional().nullable(),
  emailCoordenacao: emailSchema.optional().nullable(),
  status: statusCursoSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema.nullable(),
  // Optional counters
  alunos: z.number().optional(),
  disciplinas: z.number().optional(),
})

// Course creation schema
export const createCourseSchema = z.object({
  nome: nameSchema,
  codigo: z.number().int().positive(),
  tipo: tipoCursoSchema,
  modalidade: modalidadeCursoSchema,
  duracao: z.number().int().positive(),
  departamentoId: idSchema,
  cargaHoraria: z.number().int().positive(),
  descricao: optionalDescriptionSchema,
  coordenador: nameSchema.optional(),
  emailCoordenacao: emailSchema.optional(),
  status: statusCursoSchema.default('ATIVO'),
})

// Course update schema
export const updateCourseSchema = z.object({
  id: idSchema,
  nome: nameSchema.optional(),
  codigo: z.number().optional(),
  tipo: tipoCursoSchema.optional(),
  modalidade: modalidadeCursoSchema.optional(),
  duracao: z.number().optional(),
  departamentoId: idSchema.optional(),
  cargaHoraria: z.number().optional(),
  descricao: z.string().optional().nullable(),
  coordenador: z.string().optional().nullable(),
  emailCoordenacao: z.string().optional().nullable(),
  status: statusCursoSchema.optional(),
})

// ========================================
// NOTIFICATION SCHEMAS
// ========================================

// Base notification schema
export const baseNotificationSchema = z.object({
  id: idSchema,
  destinatarioEmail: emailSchema,
  assunto: z.string().max(255),
  tipoNotificacao: z.string().max(100),
  statusEnvio: statusEnvioSchema,
  dataEnvio: dateSchema,
  mensagemErro: z.string().optional(),
  projetoId: optionalIdSchema,
  alunoId: optionalIdSchema,
  remetenteUserId: optionalIdSchema,
})

// Notification creation schema
export const createNotificationSchema = z.object({
  destinatarioEmail: emailSchema,
  assunto: z.string().max(255),
  tipoNotificacao: z.string().max(100),
  statusEnvio: statusEnvioSchema,
  mensagemErro: z.string().optional(),
  projetoId: optionalIdSchema,
  alunoId: optionalIdSchema,
  remetenteUserId: optionalIdSchema,
})

// ========================================
// ONBOARDING SCHEMAS
// ========================================

// Onboarding status schema
export const onboardingStatusSchema = z.object({
  pending: z.boolean(),
  profile: z.object({
    exists: z.boolean(),
    type: z.enum(['student', 'professor', 'admin']),
  }),
  documents: z.object({
    required: z.array(z.string()),
    uploaded: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  disciplinas: z
    .object({
      configured: z.boolean(),
    })
    .optional(),
})


// ========================================
// REPORT SCHEMAS
// ========================================


// Base schemas for report filters
export const relatorioFiltersSchema = z.object({
  ano: anoSchema,
  semestre: semestreSchema,
})

export const relatorioFiltersWithDeptSchema = relatorioFiltersSchema.extend({
  departamentoId: z.number().optional(),
})

export const relatorioFiltersWithStatusSchema = relatorioFiltersSchema.extend({
  status: statusInscricaoSchema.optional(),
})

// Department report schema
export const departamentoRelatorioSchema = z.object({
  departamento: z.object({
    id: z.number(),
    nome: z.string(),
    sigla: z.string().nullable(),
  }),
  projetos: z.number(),
  projetosAprovados: z.number(),
  bolsasSolicitadas: z.number(),
  bolsasDisponibilizadas: z.number(),
})

// Professor report schema
export const professorRelatorioSchema = z.object({
  professor: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    emailInstitucional: z.string(),
  }),
  departamento: z.object({
    nome: z.string(),
    sigla: z.string().nullable(),
  }),
  projetos: z.number(),
  projetosAprovados: z.number(),
  bolsasSolicitadas: z.number(),
  bolsasDisponibilizadas: z.number(),
})

// Student report schema
export const alunoRelatorioSchema = z.object({
  aluno: z.object({
    id: z.number(),
    nomeCompleto: z.string(),
    emailInstitucional: z.string(),
    matricula: z.string(),
    cr: z.number(),
  }),
  inscricoes: z.number(),
  statusInscricao: statusInscricaoSchema,
  tipoVagaPretendida: tipoInscricaoSchema.nullable(),
  projeto: z.object({
    titulo: z.string(),
    professorResponsavel: z.string(),
  }),
})

// Discipline report schema
export const disciplinaRelatorioSchema = z.object({
  disciplina: z.object({
    id: z.number(),
    nome: z.string(),
    codigo: z.string(),
  }),
  departamento: z.object({
    nome: z.string(),
    sigla: z.string().nullable(),
  }),
  projetos: z.number(),
  projetosAprovados: z.number(),
})

// Notice report schema
export const editalRelatorioSchema = z.object({
  edital: z.object({
    id: z.number(),
    numeroEdital: z.string(),
    titulo: z.string(),
    publicado: z.boolean(),
    dataPublicacao: z.date().nullable(),
  }),
  periodo: z.object({
    ano: z.number(),
    semestre: semestreSchema,
    dataInicio: z.date(),
    dataFim: z.date(),
  }),
  criadoPor: z.object({
    username: z.string(),
  }),
})

// General report schema
export const relatorioGeralSchema = z.object({
  projetos: z.object({
    total: z.number(),
    aprovados: z.number(),
    submetidos: z.number(),
    rascunhos: z.number(),
    totalBolsasSolicitadas: z.number(),
    totalBolsasDisponibilizadas: z.number(),
  }),
  inscricoes: z.object({
    total: z.number(),
    submetidas: z.number(),
    selecionadas: z.number(),
    aceitas: z.number(),
  }),
  vagas: z.object({
    total: z.number(),
    bolsistas: z.number(),
    voluntarios: z.number(),
  }),
})

// Validation schemas for PROGRAD consolidation
export const validationProblemSchema = z.object({
  tipo: tipoProblemaSchema,
  vagaId: z.number(),
  nomeAluno: z.string(),
  problemas: z.array(z.string()),
  prioridade: prioridadeProblemaSchema,
})

export const validationResultSchema = z.object({
  valido: z.boolean(),
  totalProblemas: z.number(),
  problemas: z.array(validationProblemSchema),
})

// Monitor consolidation schema for PROGRAD
export const monitorConsolidadoSchema = z.object({
  id: z.number(),
  monitor: z.object({
    nome: z.string(),
    matricula: z.string(),
    email: z.string(),
    cr: z.number(),
    banco: z.string().nullable().optional(),
    agencia: z.string().nullable().optional(),
    conta: z.string().nullable().optional(),
    digitoConta: z.string().nullable().optional(),
  }),
  professor: z.object({
    nome: z.string(),
    matriculaSiape: z.string().nullable().optional(),
    email: z.string(),
    departamento: z.string(),
  }),
  projeto: z.object({
    titulo: z.string(),
    disciplinas: z.string(),
    ano: z.number(),
    semestre: semestreSchema,
    cargaHorariaSemana: z.number(),
    numeroSemanas: z.number(),
  }),
  monitoria: z.object({
    tipo: tipoVagaSchema,
    dataInicio: z.string(),
    dataFim: z.string(),
    valorBolsa: z.number().nullable().optional(),
    status: z.string(),
  }),
})

// Final monitor schema for PROGRAD export
export const monitorFinalSchema = z.object({
  id: z.number(),
  nomeCompleto: z.string(),
  matricula: z.string(),
  emailInstitucional: z.string(),
  cr: z.number(),
  rg: z.string().nullable(),
  cpf: z.string(),
  banco: z.string().nullable(),
  agencia: z.string().nullable(),
  conta: z.string().nullable(),
  digitoConta: z.string().nullable(),
  projeto: z.object({
    titulo: z.string(),
    departamento: z.string(),
    professorResponsavel: z.string(),
    matriculaSiape: z.string().nullable(),
    disciplinas: z.array(z.string()),
    cargaHorariaSemana: z.number(),
    numeroSemanas: z.number(),
  }),
  tipo: tipoVagaSchema,
  valorBolsa: z.number().nullable(),
})

// CSV export schemas
export const csvExportInputSchema = z.object({
  tipo: tipoRelatorioSchema,
  ano: anoSchema,
  semestre: semestreSchema,
  filters: z.record(z.any()).optional(),
})

export const csvExportOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  csvData: z.string(),
  fileName: z.string(),
})

// Export consolidated schemas
export const exportConsolidatedInputSchema = z.object({
  ano: anoSchema,
  semestre: semestreSchema,
  incluirBolsistas: z.boolean(),
  incluirVoluntarios: z.boolean(),
})

export const exportConsolidatedOutputSchema = z.object({
  message: z.string(),
  fileName: z.string(),
})

// ========================================
// PROJECT SCHEMAS
// ========================================

// Project form schema (complete with frontend requirements)
export const projectFormSchema = z.object({
  titulo: nameSchema.min(5, 'Título deve ter pelo menos 5 caracteres'),
  descricao: descriptionSchema.min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  departamentoId: idSchema,
  disciplinaId: idSchema,
  disciplinaIds: z.array(idSchema).min(1, 'Deve selecionar pelo menos uma disciplina').optional(),
  ano: anoSchema,
  semestre: semestreSchema,
  tipoProposicao: tipoProposicaoSchema,
  bolsasSolicitadas: z.number().min(0).optional(),
  voluntariosSolicitados: z.number().min(0).optional(),
  cargaHorariaSemana: z.number().min(1),
  numeroSemanas: z.number().min(1),
  publicoAlvo: z.string().min(1),
  estimativaPessoasBenificiadas: z.number().min(0).optional(),
  atividades: z.array(z.string()).optional(),
  professoresParticipantes: z.array(idSchema).optional(),
  professorResponsavelId: idSchema.optional(),
})

// ========================================
// INSCRIPTION SCHEMAS
// ========================================

// Inscription form schema
export const inscriptionFormSchema = z.object({
  projetoId: idSchema,
  tipoVagaPretendida: tipoInscricaoSchema,
  documentos: z
    .array(
      z.object({
        fileId: z.string(),
        tipoDocumento: z.string(),
      })
    )
    .optional(),
})

// Inscription with details schema
export const inscriptionDetailSchema = z.object({
  id: idSchema,
  projetoId: idSchema,
  alunoId: idSchema,
  tipoVagaPretendida: tipoInscricaoSchema.nullable(),
  status: statusInscricaoSchema,
  notaDisciplina: z.number().nullable(),
  notaSelecao: z.number().nullable(),
  coeficienteRendimento: z.number().nullable(),
  notaFinal: z.number().nullable(),
  feedbackProfessor: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema.nullable(),
  projeto: z.object({
    id: idSchema,
    titulo: z.string(),
    descricao: z.string(),
    ano: z.number(),
    semestre: semestreSchema,
    status: projetoStatusSchema,
    bolsasDisponibilizadas: z.number().nullable(),
    voluntariosSolicitados: z.number().nullable(),
    professorResponsavel: z.object({
      id: idSchema,
      nomeCompleto: z.string(),
      emailInstitucional: z.string(),
    }),
    departamento: z.object({
      id: idSchema,
      nome: z.string(),
    }),
    disciplinas: z.array(
      z.object({
        id: idSchema,
        nome: z.string(),
        codigo: z.string(),
      })
    ),
  }),
  aluno: z.object({
    id: idSchema,
    nomeCompleto: z.string(),
    matricula: z.string(),
    cr: z.number(),
    user: z.object({
      id: idSchema,
      email: z.string(),
    }),
  }),
})

// Schema for candidate evaluation by a professor
export const candidateEvaluationSchema = z.object({
  inscricaoId: idSchema,
  notaDisciplina: z.number().min(0).max(10),
  notaSelecao: z.number().min(0).max(10),
  observacoes: z.string().optional(),
})

// Schema for accepting an inscription
export const acceptInscriptionSchema = z.object({
  inscricaoId: idSchema,
})

// Schema for rejecting an inscription
export const rejectInscriptionSchema = z.object({
  inscricaoId: idSchema,
  feedbackProfessor: z.string().min(5, 'Motivo da rejeição é obrigatório'),
})

// Schema for project list items
export const projectListItemSchema = z.object({
  id: idSchema,
  titulo: nameSchema,
  departamentoId: idSchema,
  departamentoNome: nameSchema,
  professorResponsavelId: idSchema,
  professorResponsavelNome: nameSchema,
  status: projetoStatusSchema,
  ano: anoSchema,
  semestre: semestreSchema,
  tipoProposicao: tipoProposicaoSchema,
  bolsasSolicitadas: z.number().nullable(),
  voluntariosSolicitados: z.number().nullable(),
  bolsasDisponibilizadas: z.number().nullable(),
  cargaHorariaSemana: z.number(),
  numeroSemanas: z.number(),
  publicoAlvo: z.string(),
  estimativaPessoasBenificiadas: z.number().nullable(),
  descricao: descriptionSchema,
  assinaturaProfessor: z.string().nullable(),
  feedbackAdmin: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  disciplinas: z.array(
    z.object({
      id: idSchema,
      nome: nameSchema,
      codigo: z.string(),
    })
  ),
  totalInscritos: z.number(),
  inscritosBolsista: z.number(),
  inscritosVoluntario: z.number(),
})

// Schema for detailed project view
export const projectDetailSchema = z.object({
  id: idSchema,
  titulo: nameSchema,
  descricao: descriptionSchema,
  departamento: z.object({
    id: idSchema,
    nome: nameSchema,
    sigla: z.string().nullable(),
    unidadeUniversitaria: nameSchema,
  }),
  professorResponsavel: z.object({
    id: idSchema,
    nomeCompleto: nameSchema,
    nomeSocial: z.string().nullable(),
    genero: generoSchema,
    cpf: z.string(),
    matriculaSiape: z.string().nullable(),
    regime: regimeSchema,
    telefone: z.string().nullable(),
    telefoneInstitucional: z.string().nullable(),
    emailInstitucional: z.string(),
  }),
  disciplinas: z.array(
    z.object({
      id: idSchema,
      nome: nameSchema,
      codigo: z.string(),
    })
  ),
  professoresParticipantes: z
    .array(
      z.object({
        id: idSchema,
        nomeCompleto: nameSchema,
      })
    )
    .optional(),
  atividades: z
    .array(
      z.object({
        id: idSchema,
        descricao: descriptionSchema,
      })
    )
    .optional(),
  status: projetoStatusSchema,
  ano: anoSchema,
  semestre: semestreSchema,
  tipoProposicao: tipoProposicaoSchema,
  bolsasSolicitadas: z.number().nullable(),
  voluntariosSolicitados: z.number().nullable(),
  bolsasDisponibilizadas: z.number().nullable(),
  cargaHorariaSemana: z.number(),
  numeroSemanas: z.number(),
  publicoAlvo: z.string(),
  estimativaPessoasBenificiadas: z.number().nullable(),
  assinaturaProfessor: z.string().nullable(),
  assinaturaAdmin: z.string().nullable(),
  feedbackAdmin: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
})

// Schema for user list items (combining user, professor, and student details)
export const userListItemSchema = z.object({
  id: idSchema,
  username: usernameSchema,
  email: emailSchema,
  role: userRoleSchema,
  assinaturaDefault: z.string().nullable().optional(),
  dataAssinaturaDefault: dateSchema.nullable(),
  professorProfile: z
    .object({
      id: idSchema,
      nomeCompleto: nameSchema,
      cpf: cpfSchema,
      telefone: z.string().nullable().optional(),
      telefoneInstitucional: z.string().nullable().optional(),
      emailInstitucional: emailSchema,
      matriculaSiape: z.string().nullable().optional(),
      regime: regimeSchema,
      departamentoId: idSchema,
      curriculumVitaeFileId: z.string().nullable().optional(),
      comprovanteVinculoFileId: z.string().nullable().optional(),
      assinaturaDefault: z.string().nullable().optional(),
      dataAssinaturaDefault: dateSchema.nullable().optional(),
      projetos: z.number().optional(),
      projetosAtivos: z.number().optional(),
    })
    .nullable(),
  studentProfile: z
    .object({
      id: idSchema,
      nomeCompleto: nameSchema,
      matricula: z.string(),
      cpf: cpfSchema,
      cr: crSchema,
      cursoId: idSchema,
      telefone: z.string().nullable().optional(),
      emailInstitucional: emailSchema,
      historicoEscolarFileId: z.string().nullable().optional(),
      comprovanteMatriculaFileId: z.string().nullable().optional(),
      banco: z.string().nullable().optional(),
      agencia: z.string().nullable().optional(),
      conta: z.string().nullable().optional(),
      digitoConta: z.string().nullable().optional(),
      inscricoes: z.number().optional(),
      bolsasAtivas: z.number().optional(),
      voluntariadosAtivos: z.number().optional(),
      documentosValidados: z.number().optional(),
      totalDocumentos: z.number().optional(),
    })
    .nullable(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
})


// ========================================
// DISCIPLINE SCHEMAS  
// ========================================

// Update discipline schema
export const updateDisciplineSchema = z.object({
  id: idSchema,
  nome: nameSchema.optional(),
  codigo: z.string().optional(),
  departamentoId: idSchema.optional(),
})

// ========================================
// TEMPLATE SCHEMAS
// ========================================

// Project template schema
export const projectTemplateSchema = z.object({
  disciplinaId: idSchema.min(1, "Disciplina é obrigatória"),
  tituloDefault: z.string().optional(),
  descricaoDefault: z.string().optional(),
  cargaHorariaSemanaDefault: z.number().int().positive().optional(),
  numeroSemanasDefault: z.number().int().positive().optional(),
  publicoAlvoDefault: z.string().optional(),
  atividadesDefault: z.array(z.string()),
})

// Duplicate template schema
export const duplicateTemplateSchema = z.object({
  sourceId: idSchema,
  targetDisciplinaId: idSchema.min(1, "Disciplina de destino é obrigatória"),
})

// ========================================
// API KEY SCHEMAS
// ========================================

// Create API key schema
export const createApiKeySchema = z.object({
  name: nameSchema,
  description: z.string().optional(),
  expiresAt: dateSchema.optional(),
})

// Update API key schema
export const updateApiKeySchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Delete API key schema
export const deleteApiKeySchema = z.object({
  id: idSchema,
})

// List API keys schema
export const listApiKeysSchema = z.object({
  userId: optionalIdSchema,
})

// ========================================
// INVITATION SCHEMAS
// ========================================

// Send professor invitation schema
export const sendInvitationSchema = z.object({
  email: emailSchema,
  expiresInDays: z.number().int().min(1).max(30).default(7),
})

// Get invitations schema
export const getInvitationsSchema = z
  .object({
    status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']).optional(),
  })
  .optional()

// Resend invitation schema
export const resendInvitationSchema = z.object({
  invitationId: idSchema,
  expiresInDays: z.number().int().min(1).max(30).default(7),
})

// Cancel invitation schema
export const cancelInvitationSchema = z.object({
  invitationId: idSchema,
})

// Delete invitation schema
export const deleteInvitationSchema = z.object({
  invitationId: idSchema,
})

// Validate invitation token schema
export const validateInvitationTokenSchema = z.object({
  token: z.string(),
})

// Schema for edital form
export const editalFormSchema = z
  .object({
    numeroEdital: z.string().min(1, "Número do edital é obrigatório"),
    titulo: z.string().min(1, "Título é obrigatório"),
    descricaoHtml: z.string().optional(),
    ano: z.number().min(2000).max(2050),
    semestre: z.enum(["SEMESTRE_1", "SEMESTRE_2"]),
    dataInicio: z.date(),
    dataFim: z.date(),
  })
  .refine((data) => data.dataFim > data.dataInicio, {
    message: "Data de fim deve ser posterior à data de início",
    path: ["dataFim"],
  })

// Schema for project import form
export const importFormSchema = z.object({
  ano: z.number().int().min(2000).max(2100),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
})

// Schema for professor invitation form
export const inviteFormSchema = z.object({
  email: z.string().email('Email inválido'),
  expiresInDays: z.number().int().min(1).max(30),
})

// Schema for dashboard metrics
export const dashboardMetricsSchema = z.object({
  periodosAtivos: z.number(),
  totalProjetos: z.number(),
  projetosAprovados: z.number(),
  projetosSubmetidos: z.number(),
  projetosRascunho: z.number(),
  totalInscricoes: z.number(),
  totalVagas: z.number(),
  vagasOcupadas: z.number(),
  taxaAprovacao: z.number(),
  totalAlunos: z.number(),
  totalProfessores: z.number(),
  totalDepartamentos: z.number(),
  totalCursos: z.number(),
  totalDisciplinas: z.number(),
  projetosPorDepartamento: z.array(
    z.object({
      departamento: z.string(),
      sigla: z.string(),
      total: z.number(),
      aprovados: z.number(),
      submetidos: z.number(),
    })
  ),
  inscricoesPorPeriodo: z.array(
    z.object({
      periodo: z.string(),
      ano: z.number(),
      semestre: z.string(),
      inscricoes: z.number(),
      projetos: z.number(),
    })
  ),
  estatisticasVagas: z.object({
    bolsistas: z.number(),
    voluntarios: z.number(),
    totalDisponibilizadas: z.number(),
    ocupadas: z.number(),
    taxaOcupacao: z.number(),
  }),
  alunosPorCurso: z.array(
    z.object({
      curso: z.string(),
      alunos: z.number(),
      inscricoes: z.number(),
    })
  ),
  professoresPorDepartamento: z.array(
    z.object({
      departamento: z.string(),
      professores: z.number(),
      projetosAtivos: z.number(),
    })
  ),
})

export const dashboardQuickMetricsSchema = z.object({
  totalProjetos: z.number(),
  projetosAprovados: z.number(),
  projetosPendentes: z.number(),
  totalBolsas: z.number(),
  totalInscricoes: z.number(),
  totalVagas: z.number(),
  taxaAprovacao: z.number(),
})

export const monitoresFinalFiltersSchema = relatorioFiltersSchema.extend({
  departamentoId: z.string().optional(),
})

export const monitorFinalBolsistaSchema = z.object({
  id: idSchema,
  monitor: z.object({
    nome: nameSchema,
    matricula: matriculaSchema,
    email: emailSchema,
    rg: rgSchema.nullable(),
    cpf: cpfSchema,
    cr: crSchema,
    telefone: phoneSchema.nullable(),
    dadosBancarios: bankAccountSchema,
  }),
  professor: z.object({
    nome: nameSchema,
    matriculaSiape: z.string().nullable(),
    email: emailSchema,
  }),
  projeto: z.object({
    titulo: nameSchema,
    disciplinas: z.string(),
    cargaHorariaSemana: z.number(),
    numeroSemanas: z.number(),
  }),
  departamento: z.object({
    nome: nameSchema,
    sigla: z.string().nullable(),
  }),
  periodo: z.object({
    ano: anoSchema,
    semestre: semestreSchema,
    dataInicio: z.string(),
    dataFim: z.string(),
  }),
  termo: z.object({
    status: z.string(),
    dataAssinaturaAluno: dateSchema.optional().nullable(),
    dataAssinaturaProfessor: dateSchema.optional().nullable(),
  }),
  valorBolsa: z.number(),
})
