import { z } from 'zod'

// ========================================
// CORE ENUMS - Centralized enum definitions
// ========================================

// Academic periods
export const SEMESTRE_ENUM = ['SEMESTRE_1', 'SEMESTRE_2'] as const
export const semestreSchema = z.enum(SEMESTRE_ENUM)
export type Semestre = z.infer<typeof semestreSchema>

// Academic year
export const anoSchema = z.number().int().min(2000).max(2100)
export type Ano = z.infer<typeof anoSchema>

// User roles
export const USER_ROLE_ENUM = ['admin', 'professor', 'student'] as const
export const userRoleSchema = z.enum(USER_ROLE_ENUM)
export type UserRole = z.infer<typeof userRoleSchema>

// Gender types
export const GENERO_ENUM = ['MASCULINO', 'FEMININO', 'OUTRO'] as const
export const generoSchema = z.enum(GENERO_ENUM)
export type Genero = z.infer<typeof generoSchema>

// Professor regime types
export const REGIME_ENUM = ['20H', '40H', 'DE'] as const
export const regimeSchema = z.enum(REGIME_ENUM)
export type Regime = z.infer<typeof regimeSchema>

// Project types
export const TIPO_PROPOSICAO_ENUM = ['INDIVIDUAL', 'COLETIVA'] as const
export const tipoProposicaoSchema = z.enum(TIPO_PROPOSICAO_ENUM)
export type TipoProposicao = z.infer<typeof tipoProposicaoSchema>

// Project status
export const PROJETO_STATUS_ENUM = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PENDING_ADMIN_SIGNATURE',
  'PENDING_PROFESSOR_SIGNATURE',
] as const
export const projetoStatusSchema = z.enum(PROJETO_STATUS_ENUM)
export type ProjetoStatus = z.infer<typeof projetoStatusSchema>

// Monitor/Vaga types
export const TIPO_VAGA_ENUM = ['BOLSISTA', 'VOLUNTARIO'] as const
export const tipoVagaSchema = z.enum(TIPO_VAGA_ENUM)
export type TipoVaga = z.infer<typeof tipoVagaSchema>

// Inscription types (includes ANY for filters)
export const TIPO_INSCRICAO_ENUM = ['BOLSISTA', 'VOLUNTARIO', 'ANY'] as const
export const tipoInscricaoSchema = z.enum(TIPO_INSCRICAO_ENUM)
export type TipoInscricao = z.infer<typeof tipoInscricaoSchema>

// Inscription status
export const STATUS_INSCRICAO_ENUM = [
  'SUBMITTED',
  'SELECTED_BOLSISTA',
  'SELECTED_VOLUNTARIO',
  'ACCEPTED_BOLSISTA',
  'ACCEPTED_VOLUNTARIO',
  'REJECTED_BY_PROFESSOR',
  'REJECTED_BY_STUDENT',
  'WAITING_LIST',
] as const
export const statusInscricaoSchema = z.enum(STATUS_INSCRICAO_ENUM)
export type StatusInscricao = z.infer<typeof statusInscricaoSchema>

// Course types
export const TIPO_CURSO_ENUM = ['BACHARELADO', 'LICENCIATURA', 'TECNICO', 'POS_GRADUACAO'] as const
export const tipoCursoSchema = z.enum(TIPO_CURSO_ENUM)
export type TipoCurso = z.infer<typeof tipoCursoSchema>

// Course modality
export const MODALIDADE_CURSO_ENUM = ['PRESENCIAL', 'EAD', 'HIBRIDO'] as const
export const modalidadeCursoSchema = z.enum(MODALIDADE_CURSO_ENUM)
export type ModalidadeCurso = z.infer<typeof modalidadeCursoSchema>

// Course status
export const STATUS_CURSO_ENUM = ['ATIVO', 'INATIVO', 'EM_REFORMULACAO'] as const
export const statusCursoSchema = z.enum(STATUS_CURSO_ENUM)
export type StatusCurso = z.infer<typeof statusCursoSchema>

// Document types for projects
export const TIPO_DOCUMENTO_PROJETO_ENUM = [
  'PROPOSTA_ORIGINAL',
  'PROPOSTA_ASSINADA_PROFESSOR',
  'PROPOSTA_ASSINADA_ADMIN',
  'ATA_SELECAO',
] as const
export const tipoDocumentoProjetoSchema = z.enum(TIPO_DOCUMENTO_PROJETO_ENUM)
export type TipoDocumentoProjeto = z.infer<typeof tipoDocumentoProjetoSchema>

// Signature types
export const TIPO_ASSINATURA_ENUM = [
  'PROJETO_PROFESSOR_RESPONSAVEL',
  'TERMO_COMPROMISSO_ALUNO',
  'EDITAL_ADMIN',
  'ATA_SELECAO_PROFESSOR',
  'PROJETO_COORDENADOR_DEPARTAMENTO',
] as const
export const tipoAssinaturaSchema = z.enum(TIPO_ASSINATURA_ENUM)
export type TipoAssinatura = z.infer<typeof tipoAssinaturaSchema>

// Professor invitation status
export const PROFESSOR_INVITATION_STATUS_ENUM = ['PENDING', 'ACCEPTED', 'EXPIRED'] as const
export const professorInvitationStatusSchema = z.enum(PROFESSOR_INVITATION_STATUS_ENUM)
export type ProfessorInvitationStatus = z.infer<typeof professorInvitationStatusSchema>

// Notification sending status
export const STATUS_ENVIO_ENUM = ['ENVIADO', 'FALHOU'] as const
export const statusEnvioSchema = z.enum(STATUS_ENVIO_ENUM)
export type StatusEnvio = z.infer<typeof statusEnvioSchema>

// Import status
export const IMPORT_STATUS_ENUM = ['PROCESSANDO', 'CONCLUIDO', 'ERRO'] as const
export const importStatusSchema = z.enum(IMPORT_STATUS_ENUM)
export type ImportStatus = z.infer<typeof importStatusSchema>

// Report types
export const TIPO_RELATORIO_ENUM = [
  'geral',
  'departamentos',
  'professores',
  'alunos',
  'disciplinas',
  'editais',
] as const
export const tipoRelatorioSchema = z.enum(TIPO_RELATORIO_ENUM)
export type TipoRelatorio = z.infer<typeof tipoRelatorioSchema>

// Validation problem priorities
export const PRIORIDADE_PROBLEMA_ENUM = ['alta', 'media', 'baixa'] as const
export const prioridadeProblemaSchema = z.enum(PRIORIDADE_PROBLEMA_ENUM)
export type PrioridadeProblema = z.infer<typeof prioridadeProblemaSchema>

// Validation problem types
export const TIPO_PROBLEMA_ENUM = ['bolsista', 'voluntario'] as const
export const tipoProblemaSchema = z.enum(TIPO_PROBLEMA_ENUM)
export type TipoProblema = z.infer<typeof tipoProblemaSchema>

// Monitor/Vaga status (computed from dates and other factors)
export const STATUS_MONITOR_ENUM = ['ATIVO', 'CONCLUÍDO', 'CANCELADO'] as const
export const statusMonitorSchema = z.enum(STATUS_MONITOR_ENUM)
export type StatusMonitor = z.infer<typeof statusMonitorSchema>

// Individual status constants for easier access
export const SUBMITTED = 'SUBMITTED' as const
export const SELECTED_BOLSISTA = 'SELECTED_BOLSISTA' as const
export const SELECTED_VOLUNTARIO = 'SELECTED_VOLUNTARIO' as const
export const ACCEPTED_BOLSISTA = 'ACCEPTED_BOLSISTA' as const
export const ACCEPTED_VOLUNTARIO = 'ACCEPTED_VOLUNTARIO' as const
export const REJECTED_BY_PROFESSOR = 'REJECTED_BY_PROFESSOR' as const
export const REJECTED_BY_STUDENT = 'REJECTED_BY_STUDENT' as const
export const WAITING_LIST = 'WAITING_LIST' as const

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Get display labels for enums
export const SEMESTRE_LABELS = {
  SEMESTRE_1: '1º Semestre',
  SEMESTRE_2: '2º Semestre',
} as const

export const USER_ROLE_LABELS = {
  admin: 'Administrador',
  professor: 'Professor',
  student: 'Estudante',
} as const

export const GENERO_LABELS = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  OUTRO: 'Outro',
} as const

export const REGIME_LABELS = {
  '20H': '20 horas',
  '40H': '40 horas',
  DE: 'Dedicação Exclusiva',
} as const

export const TIPO_VAGA_LABELS = {
  BOLSISTA: 'Bolsista',
  VOLUNTARIO: 'Voluntário',
} as const

export const PROJETO_STATUS_LABELS = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Submetido',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PENDING_ADMIN_SIGNATURE: 'Pendente Assinatura Admin',
  PENDING_PROFESSOR_SIGNATURE: 'Pendente Assinatura Professor',
} as const

export const STATUS_INSCRICAO_LABELS = {
  SUBMITTED: 'Submetida',
  SELECTED_BOLSISTA: 'Selecionado (Bolsista)',
  SELECTED_VOLUNTARIO: 'Selecionado (Voluntário)',
  ACCEPTED_BOLSISTA: 'Aceito (Bolsista)',
  ACCEPTED_VOLUNTARIO: 'Aceito (Voluntário)',
  REJECTED_BY_PROFESSOR: 'Rejeitado pelo Professor',
  REJECTED_BY_STUDENT: 'Rejeitado pelo Estudante',
  WAITING_LIST: 'Lista de Espera',
} as const

export const STATUS_MONITOR_LABELS = {
  ATIVO: 'Ativo',
  CONCLUÍDO: 'Concluído',
  CANCELADO: 'Cancelado',
} as const

// Helper functions
export const getSemestreLabel = (semestre: Semestre): string => {
  return SEMESTRE_LABELS[semestre]
}

export const getUserRoleLabel = (role: UserRole): string => {
  return USER_ROLE_LABELS[role]
}

export const getGeneroLabel = (genero: Genero): string => {
  return GENERO_LABELS[genero]
}

export const getRegimeLabel = (regime: Regime): string => {
  return REGIME_LABELS[regime]
}

export const getTipoVagaLabel = (tipo: TipoVaga): string => {
  return TIPO_VAGA_LABELS[tipo]
}

export const getProjetoStatusLabel = (status: ProjetoStatus): string => {
  return PROJETO_STATUS_LABELS[status]
}

export const getStatusInscricaoLabel = (status: StatusInscricao): string => {
  return STATUS_INSCRICAO_LABELS[status]
}

export const getStatusMonitorLabel = (status: StatusMonitor): string => {
  return STATUS_MONITOR_LABELS[status]
}
