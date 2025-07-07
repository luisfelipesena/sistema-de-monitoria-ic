import { alunoTable, inscricaoTable, userTable } from '@/server/db/schema'
import { z } from 'zod'
import {
  Genero,
  ImportStatus,
  ModalidadeCurso,
  PrioridadeProblema,
  ProfessorInvitationStatus,
  ProjetoStatus,
  Regime,
  Semestre,
  StatusCurso,
  StatusEnvio,
  StatusInscricao,
  TipoAssinatura,
  TipoCurso,
  TipoInscricao,
  TipoProblema,
  TipoProposicao,
  TipoRelatorio,
  TipoVaga,
  UserRole,
} from './enums'
import { dashboardMetricsSchema } from './schemas'

// Base user type from database schema
export type User = typeof userTable.$inferSelect
export type SelecaoCandidato = typeof inscricaoTable.$inferSelect & {
  aluno: typeof alunoTable.$inferSelect & {
    user: typeof userTable.$inferSelect
  }
}

// ========================================
// USER INTERFACES
// ========================================

export interface CreateUserInput {
  username: string
  email: string
  role: UserRole
}

export interface UpdateUserInput {
  id: number
  username?: string
  email?: string
  role?: UserRole
}

// ========================================
// PROFESSOR INTERFACES
// ========================================

export interface Professor {
  id: number
  userId: number
  departamentoId: number
  nomeCompleto: string
  nomeSocial?: string
  matriculaSiape?: string
  genero: Genero
  regime: Regime
  especificacaoGenero?: string
  cpf: string
  telefone?: string
  telefoneInstitucional?: string
  emailInstitucional: string
  curriculumVitaeFileId?: string
  comprovanteVinculoFileId?: string
  assinaturaDefault?: string
  dataAssinaturaDefault?: Date
  createdAt: Date
  updatedAt?: Date
}

export interface CreateProfessorInput {
  userId: number
  departamentoId: number
  nomeCompleto: string
  nomeSocial?: string
  matriculaSiape?: string
  genero: Genero
  regime: Regime
  especificacaoGenero?: string
  cpf: string
  telefone?: string
  telefoneInstitucional?: string
  emailInstitucional: string
  curriculumVitaeFileId?: string
  comprovanteVinculoFileId?: string
}

export interface ProfessorInvitation {
  id: number
  email: string
  token: string
  status: ProfessorInvitationStatus
  expiresAt: Date
  invitedByUserId: number
  acceptedByUserId?: number
  createdAt: Date
  updatedAt?: Date
}

// ========================================
// STUDENT INTERFACES
// ========================================

export interface Student {
  id: number
  userId: number
  nomeCompleto: string
  nomeSocial?: string
  genero: Genero
  especificacaoGenero?: string
  emailInstitucional: string
  matricula: string
  rg?: string
  cpf: string
  cr: number
  telefone?: string
  banco?: string
  agencia?: string
  conta?: string
  digitoConta?: string
  enderecoId?: number
  cursoId: number
  historicoEscolarFileId?: string
  comprovanteMatriculaFileId?: string
  createdAt: Date
  updatedAt?: Date
}

export interface CreateStudentInput {
  userId: number
  nomeCompleto: string
  nomeSocial?: string
  genero: Genero
  especificacaoGenero?: string
  emailInstitucional: string
  matricula: string
  rg?: string
  cpf: string
  cr: number
  telefone?: string
  banco?: string
  agencia?: string
  conta?: string
  digitoConta?: string
  enderecoId?: number
  cursoId: number
}

// ========================================
// PROJECT INTERFACES
// ========================================

export interface Project {
  id: number
  departamentoId: number
  ano: number
  semestre: Semestre
  tipoProposicao: TipoProposicao
  bolsasSolicitadas: number
  voluntariosSolicitados: number
  bolsasDisponibilizadas?: number
  cargaHorariaSemana: number
  numeroSemanas: number
  publicoAlvo: string
  estimativaPessoasBenificiadas?: number
  professorResponsavelId: number
  titulo: string
  descricao: string
  status: ProjetoStatus
  assinaturaProfessor?: string
  assinaturaAdmin?: string
  feedbackAdmin?: string
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface CreateProjectInput {
  departamentoId: number
  ano: number
  semestre: Semestre
  tipoProposicao: TipoProposicao
  bolsasSolicitadas: number
  voluntariosSolicitados: number
  bolsasDisponibilizadas?: number
  cargaHorariaSemana: number
  numeroSemanas: number
  publicoAlvo: string
  estimativaPessoasBenificiadas?: number
  professorResponsavelId: number
  titulo: string
  descricao: string
  status?: ProjetoStatus
  assinaturaProfessor?: string
  feedbackAdmin?: string
}

export interface UpdateProjectInput {
  id: number
  departamentoId?: number
  ano?: number
  semestre?: Semestre
  tipoProposicao?: TipoProposicao
  bolsasSolicitadas?: number
  voluntariosSolicitados?: number
  bolsasDisponibilizadas?: number
  cargaHorariaSemana?: number
  numeroSemanas?: number
  publicoAlvo?: string
  estimativaPessoasBenificiadas?: number
  professorResponsavelId?: number
  titulo?: string
  descricao?: string
  status?: ProjetoStatus
  assinaturaProfessor?: string
  feedbackAdmin?: string
}

// ========================================
// INSCRIPTION INTERFACES
// ========================================

export interface Inscription {
  id: number
  periodoInscricaoId: number
  projetoId: number
  alunoId: number
  tipoVagaPretendida?: TipoInscricao
  status: StatusInscricao
  notaDisciplina?: number
  notaSelecao?: number
  coeficienteRendimento?: number
  notaFinal?: number
  feedbackProfessor?: string
  createdAt: Date
  updatedAt?: Date
}

export interface CreateInscriptionInput {
  periodoInscricaoId: number
  projetoId: number
  alunoId: number
  tipoVagaPretendida?: TipoInscricao
  status?: StatusInscricao
  notaDisciplina?: number
  notaSelecao?: number
  coeficienteRendimento?: number
  notaFinal?: number
  feedbackProfessor?: string
}

// ========================================
// DEPARTMENT INTERFACES
// ========================================

export interface Department {
  id: number
  unidadeUniversitaria: string
  nome: string
  sigla?: string
  coordenador?: string
  email?: string
  telefone?: string
  descricao?: string
  createdAt: Date
  updatedAt?: Date
}

export interface CreateDepartmentInput {
  unidadeUniversitaria: string
  nome: string
  sigla?: string
  coordenador?: string
  email?: string
  telefone?: string
  descricao?: string
}

// ========================================
// DISCIPLINE INTERFACES
// ========================================

export interface Discipline {
  id: number
  nome: string
  codigo: string
  departamentoId: number
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface CreateDisciplineInput {
  nome: string
  codigo: string
  departamentoId: number
}

// ========================================
// COURSE INTERFACES
// ========================================

export interface Course {
  id: number
  nome: string
  codigo: number
  tipo: TipoCurso
  modalidade: ModalidadeCurso
  duracao: number
  departamentoId: number
  cargaHoraria: number
  descricao?: string
  coordenador?: string
  emailCoordenacao?: string
  status: StatusCurso
  createdAt: Date
  updatedAt?: Date
}

export interface CreateCourseInput {
  nome: string
  codigo: number
  tipo: TipoCurso
  modalidade: ModalidadeCurso
  duracao: number
  departamentoId: number
  cargaHoraria: number
  descricao?: string
  coordenador?: string
  emailCoordenacao?: string
  status?: StatusCurso
}

// ========================================
// VAGA INTERFACES
// ========================================

export interface Vaga {
  id: number
  alunoId: number
  projetoId: number
  inscricaoId: number
  tipo: TipoVaga
  dataInicio?: Date
  dataFim?: Date
  createdAt: Date
  updatedAt?: Date
}

export interface CreateVagaInput {
  alunoId: number
  projetoId: number
  inscricaoId: number
  tipo: TipoVaga
  dataInicio?: Date
  dataFim?: Date
}

// ========================================
// PERIODO INSCRICAO INTERFACES
// ========================================

export interface PeriodoInscricao {
  id: number
  semestre: Semestre
  ano: number
  dataInicio: Date
  dataFim: Date
  createdAt: Date
  updatedAt?: Date
}

export interface CreatePeriodoInscricaoInput {
  semestre: Semestre
  ano: number
  dataInicio: Date
  dataFim: Date
}

// ========================================
// EDITAL INTERFACES
// ========================================

export interface Edital {
  id: number
  periodoInscricaoId: number
  numeroEdital: string
  titulo: string
  descricaoHtml?: string
  fileIdAssinado?: string
  dataPublicacao?: Date
  publicado: boolean
  criadoPorUserId: number
  createdAt: Date
  updatedAt?: Date
}

export interface CreateEditalInput {
  periodoInscricaoId: number
  numeroEdital: string
  titulo: string
  descricaoHtml?: string
  fileIdAssinado?: string
  dataPublicacao?: Date
  publicado?: boolean
  criadoPorUserId: number
}

// ========================================
// NOTIFICATION INTERFACES
// ========================================

export interface NotificationHistory {
  id: number
  destinatarioEmail: string
  assunto: string
  tipoNotificacao: string
  statusEnvio: StatusEnvio
  dataEnvio: Date
  mensagemErro?: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export interface CreateNotificationInput {
  destinatarioEmail: string
  assunto: string
  tipoNotificacao: string
  statusEnvio: StatusEnvio
  mensagemErro?: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

// ========================================
// SIGNATURE INTERFACES
// ========================================

export interface AssinaturaDocumento {
  id: number
  assinaturaData: string
  tipoAssinatura: TipoAssinatura
  userId: number
  projetoId?: number
  vagaId?: number
  editalId?: number
  createdAt: Date
}

export interface CreateAssinaturaInput {
  assinaturaData: string
  tipoAssinatura: TipoAssinatura
  userId: number
  projetoId?: number
  vagaId?: number
  editalId?: number
}

// ========================================
// IMPORT INTERFACES
// ========================================

export interface ImportacaoPlanejamento {
  id: number
  fileId: string
  nomeArquivo: string
  ano: number
  semestre: Semestre
  totalProjetos: number
  projetosCriados: number
  projetosComErro: number
  status: ImportStatus
  erros?: string
  importadoPorUserId: number
  createdAt: Date
  updatedAt?: Date
}

export interface CreateImportInput {
  fileId: string
  nomeArquivo: string
  ano: number
  semestre: Semestre
  importadoPorUserId: number
}

// ========================================
// FILTER INTERFACES
// ========================================

export interface BaseFilters {
  ano: number
  semestre: Semestre
}

export interface FiltersWithDepartment extends BaseFilters {
  departamentoId?: number
}

export interface FiltersWithStatus extends BaseFilters {
  status?: StatusInscricao
}

export interface FiltersWithProjetoStatus extends BaseFilters {
  status?: ProjetoStatus
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface SortParams {
  field: string
  direction: 'asc' | 'desc'
}

// ========================================
// RESPONSE INTERFACES
// ========================================

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface ListResponse<T = any> {
  success: boolean
  data: T[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ErrorResponse {
  success: false
  message: string
  error?: string
}

// ========================================
// ONBOARDING INTERFACES
// ========================================

export interface OnboardingStatus {
  pending: boolean
  profile: {
    exists: boolean
    type: 'student' | 'professor' | 'admin'
  }
  documents: {
    required: string[]
    uploaded: string[]
    missing: string[]
  }
  disciplinas?: {
    configured: boolean
  }
}

// ========================================
// EXPORT INTERFACES
// ========================================

export interface CsvExportInput {
  tipo: TipoRelatorio
  ano: number
  semestre: Semestre
  filters?: Record<string, any>
}

export interface ExportOutput {
  success: boolean
  message: string
  fileName: string
  data?: string
}

// ========================================
// VALIDATION INTERFACES
// ========================================

export interface ValidationProblem {
  tipo: TipoProblema
  vagaId: number
  nomeAluno: string
  problemas: string[]
  prioridade: PrioridadeProblema
}

export interface ValidationResult {
  valido: boolean
  totalProblemas: number
  problemas: ValidationProblem[]
}

// ========================================
// CONSOLIDATED REPORT INTERFACES
// ========================================

export interface MonitorConsolidado {
  id: number
  monitor: {
    nome: string
    matricula: string
    email: string
    cr: number
    banco?: string | null
    agencia?: string | null
    conta?: string | null
    digitoConta?: string | null
  }
  professor: {
    nome: string
    matriculaSiape?: string | null
    email: string
    departamento: string
  }
  projeto: {
    titulo: string
    disciplinas: string
    ano: number
    semestre: Semestre
    cargaHorariaSemana: number
    numeroSemanas: number
  }
  monitoria: {
    tipo: TipoVaga
    dataInicio: string
    dataFim: string
    valorBolsa?: number | null
    status: string
  }
}

export interface MonitorFinal {
  id: number
  nomeCompleto: string
  matricula: string
  emailInstitucional: string
  cr: number
  rg?: string
  cpf: string
  banco?: string
  agencia?: string
  conta?: string
  digitoConta?: string
  projeto: {
    titulo: string
    departamento: string
    professorResponsavel: string
    matriculaSiape?: string
    disciplinas: string[]
    cargaHorariaSemana: number
    numeroSemanas: number
  }
  tipo: TipoVaga
  valorBolsa?: number
}

// ========================================
// FRONTEND LIST TYPES
// ========================================

export interface UserListItem {
  id: number
  username: string
  email: string
  role: UserRole
  assinaturaDefault?: string | null
  dataAssinaturaDefault?: Date | null
  professorProfile?: {
    id: number
    nomeCompleto: string
    cpf: string
    telefone?: string | null
    telefoneInstitucional?: string | null
    emailInstitucional: string
    matriculaSiape?: string | null
    regime: Regime
    departamentoId: number
    curriculumVitaeFileId?: string | null
    comprovanteVinculoFileId?: string | null
    assinaturaDefault?: string | null
    dataAssinaturaDefault?: Date | null
    projetos?: number
    projetosAtivos?: number
  } | null
  studentProfile?: {
    id: number
    nomeCompleto: string
    matricula: string
    cpf: string
    cr: number
    cursoId: number
    telefone?: string | null
    emailInstitucional: string
    historicoEscolarFileId?: string | null
    comprovanteMatriculaFileId?: string | null
    banco?: string | null
    agencia?: string | null
    conta?: string | null
    digitoConta?: string | null
    inscricoes?: number
    bolsasAtivas?: number
    voluntariadosAtivos?: number
    documentosValidados?: number
    totalDocumentos?: number
  } | null
  createdAt?: Date
  updatedAt?: Date
}

export interface AlunoListItem {
  id: number
  nomeCompleto: string
  matricula: string
  emailInstitucional: string
  cpf?: string
  telefone?: string
  cr: number
  curso: {
    id: number
    nome: string
    departamento: string
  }
  status: 'ATIVO' | 'INATIVO' | 'GRADUADO' | 'TRANSFERIDO'
  inscricoes: number
  bolsasAtivas: number
  voluntariadosAtivos: number
  documentosValidados: number
  totalDocumentos: number
  criadoEm: string
}

export interface DepartamentoListItem {
  id: number
  nome: string
  sigla: string
  descricao?: string
  instituto?: string
  coordenador?: string
  email?: string
  telefone?: string
  professores: number
  cursos: number
  disciplinas: number
  projetos: number
  status: 'ATIVO' | 'INATIVO'
  criadoEm: string
  atualizadoEm: string
}

export interface CursoListItem {
  id: number
  nome: string
  codigo: string
  tipo: 'BACHARELADO' | 'LICENCIATURA' | 'TECNICO' | 'POS_GRADUACAO'
  modalidade: 'PRESENCIAL' | 'EAD' | 'HIBRIDO'
  duracao: number // em semestres
  cargaHoraria: number
  descricao?: string
  departamento: {
    id: number
    nome: string
    sigla: string
  }
  coordenador?: string
  emailCoordenacao?: string
  alunos: number
  disciplinas: number
  projetos: number
  status: 'ATIVO' | 'INATIVO' | 'EM_REFORMULACAO'
  criadoEm: string
  atualizadoEm: string
}

export interface DashboardProjectItem {
  id: number
  titulo: string
  status: string
  departamentoId: number
  departamentoNome: string
  semestre: string
  ano: number
  bolsasDisponibilizadas: number | null
  voluntariosSolicitados: number | null
  totalInscritos: number
  disciplinas: Array<{ codigo: string; nome: string }>
}

export interface DisciplinaListItem {
  id: number
  codigo: string
  nome: string
  departamentoId: number
}

export interface SigningProjectItem {
  id: number
  titulo: string
  status: string
  departamentoNome: string
  semestre: string
  ano: number
  professorResponsavelNome: string
}

export interface EditalListItem {
  id: number
  numeroEdital: string
  titulo: string
  descricaoHtml: string | null
  fileIdAssinado: string | null
  dataPublicacao: Date | null
  publicado: boolean
  createdAt: Date
  periodoInscricao: {
    id: number
    semestre: Semestre
    ano: number
    dataInicio: Date
    dataFim: Date
    status: 'ATIVO' | 'FUTURO' | 'FINALIZADO'
    totalProjetos: number
    totalInscricoes: number
  } | null
  criadoPor: {
    id: number
    username: string
    email: string
  } | null
}

export interface ImportHistoryItem {
  id: number
  nomeArquivo: string
  ano: number
  semestre: string
  totalProjetos: number
  projetosCriados: number
  projetosComErro: number
  status: string
  importadoPor: {
    username: string
    email: string
  }
  createdAt: Date
}

export interface InvitationItem {
  id: number
  email: string
  token: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
  expiresAt: Date
  createdAt: Date
  invitedByUser: {
    username: string
    email: string
  }
  acceptedByUser?: {
    username: string
    email: string
  } | null
}

export interface ManageProjectItem {
  id: number
  titulo: string
  status: string
  departamentoId: number
  departamentoNome: string
  semestre: string
  ano: number
  bolsasDisponibilizadas: number | null
  voluntariosSolicitados: number | null
  totalInscritos: number
  disciplinas: Array<{ codigo: string; nome: string }>
  professorResponsavelNome: string
}

export interface AtaSelecaoData {
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: string
    departamento: { nome: string; sigla: string | null }
    professorResponsavel: { nomeCompleto: string; matriculaSiape: string | null }
    disciplinas: Array<{ codigo: string; nome: string }>
  }
  totalInscritos: number
  totalCompareceram: number
  inscricoesBolsista: SelecaoCandidato[]
  inscricoesVoluntario: SelecaoCandidato[]
  dataGeracao: Date
  candidatos: Array<{
    id: number
    aluno: {
      nomeCompleto: string
      matricula: string
      cr: number | null
    }
    tipoVagaPretendida: string | null
    notaDisciplina: number | null
    notaSelecao: number | null
    coeficienteRendimento: number | null
    notaFinal: number | null
    status: string
    observacoes?: string | null
  }>
  ataInfo: {
    dataSelecao: string
    localSelecao?: string | null
    observacoes?: string | null
  }
}

export interface QuickEvaluation {
  inscricaoId: number
  rating: 1 | 2 | 3 | 4 | 5
  notes: string
  decision: 'SELECT_SCHOLARSHIP' | 'SELECT_VOLUNTEER' | 'REJECT' | 'PENDING'
}

export interface ProfessorDisciplinaListItem {
  id: number
  codigo: string
  nome: string
  cargaHoraria: number
  projetosAtivos: number
  monitoresAtivos: number
  voluntariosAtivos: number
}

export interface ProfessorSigningProjectItem {
  id: number
  titulo: string
  status: string
  departamentoNome: string
  semestre: string
  ano: number
  disciplinas: Array<{ codigo: string; nome: string }>
}

export interface DisciplineAssociation {
  id: number
  codigo: string
  nome: string
  departamentoId: number
  isAssociated: boolean
  ano?: number
  semestre?: Semestre
}

export interface ProfessorProjetoListItem {
  id: number
  titulo: string
  descricao: string
  departamento: {
    id: number
    nome: string
  }
  ano: number
  semestre: Semestre
  tipoProposicao: 'NOVO' | 'CONTINUACAO'
  status: ProjetoStatus
  bolsasSolicitadas: number
  voluntariosSolicitados: number
  inscricoes: number
  bolsasAlocadas: number
  voluntariosAlocados: number
  cargaHorariaSemana: number
  numeroSemanas: number
  publicoAlvo: string
  estimativaPessoasBenificiadas: number
  disciplinas: Array<{ id: number; nome: string }>
  assinaturaProfessor?: string
  assinaturaAdmin?: string
  criadoEm: string
  atualizadoEm: string
}

export interface VoluntarioListItem {
  id: number
  nomeCompleto: string
  email: string
  telefone?: string
  disciplina: {
    codigo: string
    nome: string
  }
  projeto: {
    id: number
    titulo: string
  }
  status: 'ATIVO' | 'INATIVO' | 'PENDENTE'
  dataInicio?: Date
}

export interface ProjetoDisponivelListItem {
  id: number
  titulo: string
  departamentoNome: string
  professorResponsavelNome: string
  disciplinas: Array<{ codigo: string; nome: string }>
  bolsasDisponibilizadas: number
  voluntariosSolicitados: number
  totalInscritos: number
  inscricaoAberta: boolean
  jaInscrito: boolean
}

export interface MonitoriaFormData {
  titulo: string
  descricao: string
  departamento?: {
    id: number
    nome: string
  }
  coordenadorResponsavel?: string
  professorResponsavel?: {
    id: number
    nomeCompleto: string
    nomeSocial?: string
    genero: 'MASCULINO' | 'FEMININO' | 'OUTRO'
    cpf: string
    matriculaSiape?: string
    regime: '20H' | '40H' | 'DE'
    telefone?: string
    telefoneInstitucional?: string
    emailInstitucional: string
  }
  ano: number
  semestre: 'SEMESTRE_1' | 'SEMESTRE_2'
  tipoProposicao: 'INDIVIDUAL' | 'COLETIVA'
  bolsasSolicitadas: number
  voluntariosSolicitados: number
  cargaHorariaSemana: number
  numeroSemanas: number
  publicoAlvo: string
  estimativaPessoasBenificiadas?: number
  disciplinas: Array<{
    id: number
    codigo: string
    nome: string
  }>
  user?: {
    username?: string
    email?: string
    nomeCompleto?: string
    role?: string
  }
  assinaturaProfessor?: string
  assinaturaAdmin?: string
  dataAprovacao?: string
  dataAssinaturaProfessor?: string
  dataAssinaturaAdmin?: string
  allowSigning?: boolean
  signingMode?: 'professor' | 'admin' | 'view'
  projetoId?: number
}

export interface TermoCompromissoData {
  monitor: {
    nome: string
    matricula: string
    email: string
    telefone?: string
    cr: number
  }
  professor: {
    nome: string
    matriculaSiape?: string
    email: string
    departamento: string
  }
  projeto: {
    titulo: string
    disciplinas: Array<{
      codigo: string
      nome: string
    }>
    ano: number
    semestre: string
    cargaHorariaSemana: number
    numeroSemanas: number
  }
  monitoria: {
    tipo: 'BOLSISTA' | 'VOLUNTARIO'
    dataInicio: string
    dataFim: string
    valorBolsa?: number
  }
  termo: {
    numero: string
    dataGeracao: string
  }
}

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>

export type AppUser = User & {
  professor?: {
    id: number
    departamentoId: number
  } | null
  aluno?: {
    id: number
    cursoId: number
  } | null
}

// Project template item interface
export interface ProjectTemplateItem {
  id: number
  disciplinaId: number
  tituloDefault?: string | null
  descricaoDefault?: string | null
  cargaHorariaSemanaDefault?: number | null
  numeroSemanasDefault?: number | null
  publicoAlvoDefault?: string | null
  atividadesDefault: string[]
  createdAt: Date
  updatedAt?: Date | null
  disciplina: {
    nome: string
    codigo: string
    departamento: {
      nome: string
      sigla?: string | null
    }
  }
  criadoPor?: {
    username: string
  } | null
  ultimaAtualizacaoPor?: {
    username: string
  } | null
}

// ========================================
// REPORT INTERFACES
// ========================================

export interface DepartamentoRelatorio {
  departamento: {
    id: number
    nome: string
    sigla?: string | null
  }
  projetos: number
  projetosAprovados: number
  bolsasSolicitadas: number
  bolsasDisponibilizadas: number
}

export interface ProfessorRelatorio {
  professor: {
    id: number
    nomeCompleto: string
    emailInstitucional: string
  }
  departamento: {
    nome: string
    sigla?: string | null
  }
  projetos: number
  projetosAprovados: number
  bolsasSolicitadas: number
  bolsasDisponibilizadas: number
}

export interface AlunoRelatorio {
  aluno: {
    id: number
    nomeCompleto: string
    emailInstitucional: string
    matricula: string
    cr: number
  }
  inscricoes: number
  statusInscricao: StatusInscricao
  tipoVagaPretendida?: TipoInscricao | null
  projeto: {
    titulo: string
    professorResponsavel: string
  }
}

export interface DisciplinaRelatorio {
  disciplina: {
    id: number
    nome: string
    codigo: string
  }
  departamento: {
    nome: string
    sigla?: string | null
  }
  projetos: number
  projetosAprovados: number
}

export interface EditalRelatorio {
  edital: {
    id: number
    numeroEdital: string
    titulo: string
    publicado: boolean
    dataPublicacao?: Date | null
  }
  periodo: {
    ano: number
    semestre: Semestre
    dataInicio: Date
    dataFim: Date
  }
  criadoPor: {
    username: string
  }
}

export interface RelatorioGeral {
  projetos: {
    total: number
    aprovados: number
    submetidos: number
    rascunhos: number
    totalBolsasSolicitadas: number
    totalBolsasDisponibilizadas: number
  }
  inscricoes: {
    total: number
    submetidas: number
    selecionadas: number
    aceitas: number
  }
  vagas: {
    total: number
    bolsistas: number
    voluntarios: number
  }
}
