import {
  generoEnum,
  modalidadeCursoEnum,
  professorInvitationStatusEnum,
  projetoStatusEnum,
  regimeEnum,
  semestreEnum,
  statusCursoEnum,
  statusEnvioEnum,
  statusInscricaoEnum,
  tipoAssinaturaEnum,
  tipoCursoEnum,
  tipoDocumentoProjetoEnum,
  tipoEditalEnum,
  tipoInscricaoEnum,
  tipoProposicaoEnum,
  tipoVagaEnum,
  userRoleEnum,
} from '@/server/db/schema'
import { z } from 'zod'

// ========================================
// TYPE EXTRACTION FROM DATABASE ENUMS
// ========================================

/**
 * Utility type to extract enum values from Drizzle pgEnum
 * This creates a union type from the enum values array
 */
type ExtractEnumValues<T> = T extends { enumValues: readonly (infer V)[] } ? V : never

/**
 * Helper function to get enum values at runtime
 * Useful for iteration in components (maps, selects, etc.)
 */
function getEnumValues<T extends { enumValues: readonly string[] }>(pgEnum: T): ExtractEnumValues<T>[] {
  return pgEnum.enumValues as ExtractEnumValues<T>[]
}

// ========================================
// CORE TYPE DEFINITIONS (from database)
// ========================================

// Academic periods
export type Semestre = ExtractEnumValues<typeof semestreEnum>
export type Ano = number

// User roles (extracted from database userRoleEnum)
export type UserRole = ExtractEnumValues<typeof userRoleEnum>

// Gender types
export type Genero = ExtractEnumValues<typeof generoEnum>

// Professor regime types
export type Regime = ExtractEnumValues<typeof regimeEnum>

// Project types
export type TipoProposicao = ExtractEnumValues<typeof tipoProposicaoEnum>

// Project status
export type ProjetoStatus = ExtractEnumValues<typeof projetoStatusEnum>

// Monitor/Vaga types
export type TipoVaga = ExtractEnumValues<typeof tipoVagaEnum>

// Edital types
export type TipoEdital = ExtractEnumValues<typeof tipoEditalEnum>

// Inscription types
export type TipoInscricao = ExtractEnumValues<typeof tipoInscricaoEnum>

// Inscription status
export type StatusInscricao = ExtractEnumValues<typeof statusInscricaoEnum>

// Course types
export type TipoCurso = ExtractEnumValues<typeof tipoCursoEnum>

// Course modality
export type ModalidadeCurso = ExtractEnumValues<typeof modalidadeCursoEnum>

// Course status
export type StatusCurso = ExtractEnumValues<typeof statusCursoEnum>

// Document types for projects
export type TipoDocumentoProjeto = ExtractEnumValues<typeof tipoDocumentoProjetoEnum>

// Signature types
export type TipoAssinatura = ExtractEnumValues<typeof tipoAssinaturaEnum>

// Professor invitation status
export type ProfessorInvitationStatus = ExtractEnumValues<typeof professorInvitationStatusEnum>

// Notification sending status
export type StatusEnvio = ExtractEnumValues<typeof statusEnvioEnum>

// Import status (not from pgEnum, defined locally)
export const IMPORT_STATUS_ENUM = ['PROCESSANDO', 'CONCLUIDO', 'ERRO', 'CONCLUIDO_COM_ERROS'] as const
export const importStatusSchema = z.enum(IMPORT_STATUS_ENUM)
export type ImportStatus = z.infer<typeof importStatusSchema>

// Report types (not from pgEnum, defined locally)
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

// Validation problem priorities (not from pgEnum, defined locally)
export const PRIORIDADE_PROBLEMA_ENUM = ['alta', 'media', 'baixa'] as const
export const prioridadeProblemaSchema = z.enum(PRIORIDADE_PROBLEMA_ENUM)
export type PrioridadeProblema = z.infer<typeof prioridadeProblemaSchema>

// Validation problem types (not from pgEnum, defined locally)
export const TIPO_PROBLEMA_ENUM = ['bolsista', 'voluntario'] as const
export const tipoProblemaSchema = z.enum(TIPO_PROBLEMA_ENUM)
export type TipoProblema = z.infer<typeof tipoProblemaSchema>

// Monitor/Vaga status (not from pgEnum, computed status)
export const STATUS_MONITOR_ENUM = ['ATIVO', 'CONCLUÍDO', 'CANCELADO'] as const
export const statusMonitorSchema = z.enum(STATUS_MONITOR_ENUM)
export type StatusMonitor = z.infer<typeof statusMonitorSchema>

// Department status (not from pgEnum)
export const DEPARTMENT_STATUS_ATIVO = 'ATIVO' as const
export const DEPARTMENT_STATUS_INATIVO = 'INATIVO' as const
export const DEPARTMENT_STATUS_ENUM = [DEPARTMENT_STATUS_ATIVO, DEPARTMENT_STATUS_INATIVO] as const
export const departmentStatusSchema = z.enum(DEPARTMENT_STATUS_ENUM)
export type DepartmentStatus = z.infer<typeof departmentStatusSchema>

// Voluntario/Monitor Status (not from pgEnum, defined locally)
export const VOLUNTARIO_STATUS_ATIVO = 'ATIVO' as const
export const VOLUNTARIO_STATUS_INATIVO = 'INATIVO' as const
export const VOLUNTARIO_STATUS_PENDENTE = 'PENDENTE' as const
export const VOLUNTARIO_STATUS_ENUM = [
  VOLUNTARIO_STATUS_ATIVO,
  VOLUNTARIO_STATUS_INATIVO,
  VOLUNTARIO_STATUS_PENDENTE,
] as const
export const voluntarioStatusSchema = z.enum(VOLUNTARIO_STATUS_ENUM)
export type VoluntarioStatus = z.infer<typeof voluntarioStatusSchema>

// Relatorio Validation Type (not from pgEnum, defined locally)
export const RELATORIO_VALIDATION_BOLSISTAS = 'bolsistas' as const
export const RELATORIO_VALIDATION_VOLUNTARIOS = 'voluntarios' as const
export const RELATORIO_VALIDATION_AMBOS = 'ambos' as const
export const RELATORIO_VALIDATION_TYPE_ENUM = [
  RELATORIO_VALIDATION_BOLSISTAS,
  RELATORIO_VALIDATION_VOLUNTARIOS,
  RELATORIO_VALIDATION_AMBOS,
] as const
export const relatorioValidationTypeSchema = z.enum(RELATORIO_VALIDATION_TYPE_ENUM)
export type RelatorioValidationType = z.infer<typeof relatorioValidationTypeSchema>

// Candidate Result Status (not from pgEnum, defined locally)
export const CANDIDATE_RESULT_APROVADO = 'APROVADO' as const
export const CANDIDATE_RESULT_REPROVADO = 'REPROVADO' as const
export const CANDIDATE_RESULT_EM_ANALISE = 'EM_ANALISE' as const
export const CANDIDATE_RESULT_LISTA_ESPERA = 'LISTA_ESPERA' as const
export const CANDIDATE_RESULT_STATUS_ENUM = [
  CANDIDATE_RESULT_APROVADO,
  CANDIDATE_RESULT_REPROVADO,
  CANDIDATE_RESULT_EM_ANALISE,
  CANDIDATE_RESULT_LISTA_ESPERA,
] as const
export const candidateResultStatusSchema = z.enum(CANDIDATE_RESULT_STATUS_ENUM)
export type CandidateResultStatus = z.infer<typeof candidateResultStatusSchema>

// Professor Status (not from pgEnum, defined locally)
export const PROFESSOR_STATUS_ATIVO = 'ATIVO' as const
export const PROFESSOR_STATUS_INATIVO = 'INATIVO' as const
export const PROFESSOR_STATUS_ENUM = [PROFESSOR_STATUS_ATIVO, PROFESSOR_STATUS_INATIVO] as const
export const professorStatusSchema = z.enum(PROFESSOR_STATUS_ENUM)
export type ProfessorStatus = z.infer<typeof professorStatusSchema>

// Student Status (not from pgEnum, defined locally)
export const STUDENT_STATUS_ATIVO = 'ATIVO' as const
export const STUDENT_STATUS_INATIVO = 'INATIVO' as const
export const STUDENT_STATUS_GRADUADO = 'GRADUADO' as const
export const STUDENT_STATUS_TRANSFERIDO = 'TRANSFERIDO' as const
export const STUDENT_STATUS_ENUM = [
  STUDENT_STATUS_ATIVO,
  STUDENT_STATUS_INATIVO,
  STUDENT_STATUS_GRADUADO,
  STUDENT_STATUS_TRANSFERIDO,
] as const
export const studentStatusSchema = z.enum(STUDENT_STATUS_ENUM)
export type StudentStatus = z.infer<typeof studentStatusSchema>

// Inscription Decision (not from pgEnum, defined locally for quick evaluation)
export const DECISION_SELECT_SCHOLARSHIP = 'SELECT_SCHOLARSHIP' as const
export const DECISION_SELECT_VOLUNTEER = 'SELECT_VOLUNTEER' as const
export const DECISION_REJECT = 'REJECT' as const
export const DECISION_PENDING = 'PENDING' as const
export const DECISION_ENUM = [
  DECISION_SELECT_SCHOLARSHIP,
  DECISION_SELECT_VOLUNTEER,
  DECISION_REJECT,
  DECISION_PENDING,
] as const
export const decisionSchema = z.enum(DECISION_ENUM)
export type Decision = z.infer<typeof decisionSchema>

// Alert Type (not from pgEnum, defined locally)
export const ALERT_TYPE_WARNING = 'warning' as const
export const ALERT_TYPE_ERROR = 'error' as const
export const ALERT_TYPE_INFO = 'info' as const
export const ALERT_TYPE_ENUM = [ALERT_TYPE_WARNING, ALERT_TYPE_ERROR, ALERT_TYPE_INFO] as const
export const alertTypeSchema = z.enum(ALERT_TYPE_ENUM)
export type AlertType = z.infer<typeof alertTypeSchema>

// Vaga Status (computed status, not from pgEnum)
export const VAGA_STATUS_ATIVA = 'ATIVA' as const
export const VAGA_STATUS_ATIVO = 'ATIVO' as const
export const VAGA_STATUS_PENDENTE_ASSINATURA = 'PENDENTE_ASSINATURA' as const
export const VAGA_STATUS_INCOMPLETO = 'INCOMPLETO' as const
export const VAGA_STATUS_ENUM = [
  VAGA_STATUS_ATIVA,
  VAGA_STATUS_ATIVO,
  VAGA_STATUS_PENDENTE_ASSINATURA,
  VAGA_STATUS_INCOMPLETO,
] as const
export const vagaStatusSchema = z.enum(VAGA_STATUS_ENUM)
export type VagaStatus = z.infer<typeof vagaStatusSchema>

// Termo Status (computed status, not from pgEnum)
export const TERMO_STATUS_COMPLETO = 'COMPLETO' as const
export const TERMO_STATUS_PENDENTE = 'PENDENTE' as const
export const TERMO_STATUS_ENUM = [TERMO_STATUS_COMPLETO, TERMO_STATUS_PENDENTE] as const
export const termoStatusSchema = z.enum(TERMO_STATUS_ENUM)
export type TermoStatus = z.infer<typeof termoStatusSchema>

export const TERMO_WORKFLOW_STATUS_PENDENTE_ASSINATURA = 'pendente_assinatura' as const
export const TERMO_WORKFLOW_STATUS_PARCIALMENTE_ASSINADO = 'parcialmente_assinado' as const
export const TERMO_WORKFLOW_STATUS_ASSINADO_COMPLETO = 'assinado_completo' as const
export const TERMO_WORKFLOW_STATUS_ENUM = [
  TERMO_WORKFLOW_STATUS_PENDENTE_ASSINATURA,
  TERMO_WORKFLOW_STATUS_PARCIALMENTE_ASSINADO,
  TERMO_WORKFLOW_STATUS_ASSINADO_COMPLETO,
] as const
export type TermoWorkflowStatus = (typeof TERMO_WORKFLOW_STATUS_ENUM)[number]

// Import Status constants (already defined, adding explicit constants)
export const IMPORT_STATUS_PROCESSANDO = 'PROCESSANDO' as const
export const IMPORT_STATUS_CONCLUIDO = 'CONCLUIDO' as const
export const IMPORT_STATUS_ERRO = 'ERRO' as const
export const IMPORT_STATUS_CONCLUIDO_COM_ERROS = 'CONCLUIDO_COM_ERROS' as const

// Candidate Result Status constants (already defined, adding explicit constants for convenience)
export const CANDIDATE_RESULT_APROVADO_CONST = CANDIDATE_RESULT_APROVADO
export const CANDIDATE_RESULT_REPROVADO_CONST = CANDIDATE_RESULT_REPROVADO
export const CANDIDATE_RESULT_EM_ANALISE_CONST = CANDIDATE_RESULT_EM_ANALISE
export const CANDIDATE_RESULT_LISTA_ESPERA_CONST = CANDIDATE_RESULT_LISTA_ESPERA

// ========================================
// RUNTIME TYPED CONSTANTS
// ========================================

// User Role constants (as const for literal type inference)
export const ADMIN = 'admin' as const
export const PROFESSOR = 'professor' as const
export const STUDENT = 'student' as const

// Semestre constants (as const for literal type inference)
export const SEMESTRE_1 = 'SEMESTRE_1' as const
export const SEMESTRE_2 = 'SEMESTRE_2' as const

// Tipo Edital constants (as const for literal type inference)
export const TIPO_EDITAL_DCC = 'DCC' as const
export const TIPO_EDITAL_PROGRAD = 'PROGRAD' as const

// Projeto Status constants (as const for literal type inference)
export const PROJETO_STATUS_DRAFT = 'DRAFT' as const
export const PROJETO_STATUS_SUBMITTED = 'SUBMITTED' as const
export const PROJETO_STATUS_APPROVED = 'APPROVED' as const
export const PROJETO_STATUS_REJECTED = 'REJECTED' as const
export const PROJETO_STATUS_PENDING_SIGNATURE = 'PENDING_PROFESSOR_SIGNATURE' as const

// Tipo Proposição constants (as const for literal type inference)
export const TIPO_PROPOSICAO_INDIVIDUAL = 'INDIVIDUAL' as const
export const TIPO_PROPOSICAO_COLETIVA = 'COLETIVA' as const

// Tipo Monitoria (alias for TipoProposicao, used in PDF templates)
export const TIPO_MONITORIA_INDIVIDUAL = TIPO_PROPOSICAO_INDIVIDUAL
export const TIPO_MONITORIA_COLETIVO = TIPO_PROPOSICAO_COLETIVA
export type TipoMonitoria = TipoProposicao

// Tipo Vaga constants (as const for literal type inference)
export const TIPO_VAGA_BOLSISTA = 'BOLSISTA' as const
export const TIPO_VAGA_VOLUNTARIO = 'VOLUNTARIO' as const

// Tipo Inscrição constants (as const for literal type inference)
export const TIPO_INSCRICAO_BOLSISTA = 'BOLSISTA' as const
export const TIPO_INSCRICAO_VOLUNTARIO = 'VOLUNTARIO' as const
export const TIPO_INSCRICAO_ANY = 'ANY' as const

// Status Inscrição constants
export const STATUS_INSCRICAO_SUBMITTED = 'SUBMITTED' as const
export const STATUS_INSCRICAO_SELECTED_BOLSISTA = 'SELECTED_BOLSISTA' as const
export const STATUS_INSCRICAO_SELECTED_VOLUNTARIO = 'SELECTED_VOLUNTARIO' as const
export const STATUS_INSCRICAO_ACCEPTED_BOLSISTA = 'ACCEPTED_BOLSISTA' as const
export const STATUS_INSCRICAO_ACCEPTED_VOLUNTARIO = 'ACCEPTED_VOLUNTARIO' as const
export const STATUS_INSCRICAO_REJECTED_BY_PROFESSOR = 'REJECTED_BY_PROFESSOR' as const
export const STATUS_INSCRICAO_REJECTED_BY_STUDENT = 'REJECTED_BY_STUDENT' as const
export const STATUS_INSCRICAO_WAITING_LIST = 'WAITING_LIST' as const

// Genero constants (as const for literal type inference)
export const GENERO_MASCULINO = 'MASCULINO' as const
export const GENERO_FEMININO = 'FEMININO' as const
export const GENERO_OUTRO = 'OUTRO' as const

// Regime constants (as const for literal type inference)
export const REGIME_20H = '20H' as const
export const REGIME_40H = '40H' as const
export const REGIME_DE = 'DE' as const

// Tipo Curso constants (as const for literal type inference)
export const TIPO_CURSO_BACHARELADO = 'BACHARELADO' as const
export const TIPO_CURSO_LICENCIATURA = 'LICENCIATURA' as const
export const TIPO_CURSO_TECNICO = 'TECNICO' as const
export const TIPO_CURSO_POS_GRADUACAO = 'POS_GRADUACAO' as const

// Modalidade Curso constants (as const for literal type inference)
export const MODALIDADE_CURSO_PRESENCIAL = 'PRESENCIAL' as const
export const MODALIDADE_CURSO_EAD = 'EAD' as const
export const MODALIDADE_CURSO_HIBRIDO = 'HIBRIDO' as const

// Status Curso constants (as const for literal type inference)
export const STATUS_CURSO_ATIVO = 'ATIVO' as const
export const STATUS_CURSO_INATIVO = 'INATIVO' as const
export const STATUS_CURSO_EM_REFORMULACAO = 'EM_REFORMULACAO' as const

// Tipo Documento Projeto constants (as const for literal type inference)
export const TIPO_DOCUMENTO_PROPOSTA_ORIGINAL = 'PROPOSTA_ORIGINAL' as const
export const TIPO_DOCUMENTO_PROPOSTA_ASSINADA_PROFESSOR = 'PROPOSTA_ASSINADA_PROFESSOR' as const
export const TIPO_DOCUMENTO_PROPOSTA_ASSINADA_ADMIN = 'PROPOSTA_ASSINADA_ADMIN' as const
export const TIPO_DOCUMENTO_ATA_SELECAO = 'ATA_SELECAO' as const

// Projeto Tipo constants (as const for literal type inference)
export const PROJETO_TIPO_NOVO = 'NOVO' as const
export const PROJETO_TIPO_CONTINUACAO = 'CONTINUACAO' as const
export const PROJETO_TIPO_ENUM = [PROJETO_TIPO_NOVO, PROJETO_TIPO_CONTINUACAO] as const
export const projetoTipoSchema = z.enum(PROJETO_TIPO_ENUM)
export type ProjetoTipo = z.infer<typeof projetoTipoSchema>

// Tipo Assinatura constants (as const for literal type inference)
export const TIPO_ASSINATURA_PROJETO_PROFESSOR = 'PROJETO_PROFESSOR_RESPONSAVEL' as const
export const TIPO_ASSINATURA_TERMO_COMPROMISSO = 'TERMO_COMPROMISSO_ALUNO' as const
export const TIPO_ASSINATURA_EDITAL_ADMIN = 'EDITAL_ADMIN' as const
export const TIPO_ASSINATURA_ATA_SELECAO = 'ATA_SELECAO_PROFESSOR' as const
export const TIPO_ASSINATURA_COORDENADOR = 'PROJETO_COORDENADOR_DEPARTAMENTO' as const

// Professor Invitation Status constants (as const for literal type inference)
export const INVITATION_STATUS_PENDING = 'PENDING' as const
export const INVITATION_STATUS_ACCEPTED = 'ACCEPTED' as const
export const INVITATION_STATUS_EXPIRED = 'EXPIRED' as const

// Status Envio constants (as const for literal type inference)
export const STATUS_ENVIO_ENVIADO = 'ENVIADO' as const
export const STATUS_ENVIO_FALHOU = 'FALHOU' as const

// Signing Mode constants (as const for literal type inference)
export const SIGNING_MODE_PROFESSOR = 'professor' as const
export const SIGNING_MODE_ADMIN = 'admin' as const
export const SIGNING_MODE_VIEW = 'view' as const

// Registration Role constants (subset of UserRole for registration)
export const REGISTRATION_ROLE_PROFESSOR = PROFESSOR
export const REGISTRATION_ROLE_STUDENT = STUDENT

// Local signing mode enum (not from pgEnum, defined locally)
export const SIGNING_MODE_ENUM = [SIGNING_MODE_PROFESSOR, SIGNING_MODE_ADMIN, SIGNING_MODE_VIEW] as const
export const signingModeSchema = z.enum(SIGNING_MODE_ENUM)
export type SigningMode = z.infer<typeof signingModeSchema>

// Registration role enum (subset of UserRole)
export const REGISTRATION_ROLE_ENUM = [PROFESSOR, STUDENT] as const
export const registrationRoleSchema = z.enum(REGISTRATION_ROLE_ENUM)
export type RegistrationRole = z.infer<typeof registrationRoleSchema>

// Legacy constants for backwards compatibility
export const SUBMITTED = STATUS_INSCRICAO_SUBMITTED
export const SELECTED_BOLSISTA = STATUS_INSCRICAO_SELECTED_BOLSISTA
export const SELECTED_VOLUNTARIO = STATUS_INSCRICAO_SELECTED_VOLUNTARIO
export const ACCEPTED_BOLSISTA = STATUS_INSCRICAO_ACCEPTED_BOLSISTA
export const ACCEPTED_VOLUNTARIO = STATUS_INSCRICAO_ACCEPTED_VOLUNTARIO
export const REJECTED_BY_PROFESSOR = STATUS_INSCRICAO_REJECTED_BY_PROFESSOR
export const REJECTED_BY_STUDENT = STATUS_INSCRICAO_REJECTED_BY_STUDENT
export const WAITING_LIST = STATUS_INSCRICAO_WAITING_LIST

export const DRAFT = PROJETO_STATUS_DRAFT
export const APPROVED = PROJETO_STATUS_APPROVED
export const REJECTED = PROJETO_STATUS_REJECTED
export const PENDING_PROFESSOR_SIGNATURE = PROJETO_STATUS_PENDING_SIGNATURE

export const BOLSISTA = TIPO_VAGA_BOLSISTA
export const VOLUNTARIO = TIPO_VAGA_VOLUNTARIO

// ========================================
// ENUM VALUE ARRAYS (for iteration)
// ========================================

export const USER_ROLE_VALUES = getEnumValues(userRoleEnum)
export const SEMESTRE_VALUES = getEnumValues(semestreEnum)
export const TIPO_EDITAL_VALUES = getEnumValues(tipoEditalEnum)
export const PROJETO_STATUS_VALUES = getEnumValues(projetoStatusEnum)
export const TIPO_PROPOSICAO_VALUES = getEnumValues(tipoProposicaoEnum)
export const TIPO_VAGA_VALUES = getEnumValues(tipoVagaEnum)
export const TIPO_INSCRICAO_VALUES = getEnumValues(tipoInscricaoEnum)
export const STATUS_INSCRICAO_VALUES = getEnumValues(statusInscricaoEnum)
export const GENERO_VALUES = getEnumValues(generoEnum)
export const REGIME_VALUES = getEnumValues(regimeEnum)
export const TIPO_CURSO_VALUES = getEnumValues(tipoCursoEnum)
export const MODALIDADE_CURSO_VALUES = getEnumValues(modalidadeCursoEnum)
export const STATUS_CURSO_VALUES = getEnumValues(statusCursoEnum)
export const TIPO_DOCUMENTO_PROJETO_VALUES = getEnumValues(tipoDocumentoProjetoEnum)
export const TIPO_ASSINATURA_VALUES = getEnumValues(tipoAssinaturaEnum)
export const INVITATION_STATUS_VALUES = getEnumValues(professorInvitationStatusEnum)
export const STATUS_ENVIO_VALUES = getEnumValues(statusEnvioEnum)

// Local enum values (not from pgEnum)
export const STATUS_MONITOR_VALUES = STATUS_MONITOR_ENUM

// ========================================
// ZOD VALIDATION SCHEMAS
// ========================================

export const semestreSchema = z.enum(semestreEnum.enumValues)
export const anoSchema = z.number().int().min(2000).max(2100)
export const tipoEditalSchema = z.enum(tipoEditalEnum.enumValues)
export const projetoStatusSchema = z.enum(projetoStatusEnum.enumValues)
export const tipoProposicaoSchema = z.enum(tipoProposicaoEnum.enumValues)
export const tipoVagaSchema = z.enum(tipoVagaEnum.enumValues)
export const tipoInscricaoSchema = z.enum(tipoInscricaoEnum.enumValues)
export const statusInscricaoSchema = z.enum(statusInscricaoEnum.enumValues)
export const generoSchema = z.enum(generoEnum.enumValues)
export const regimeSchema = z.enum(regimeEnum.enumValues)
export const tipoCursoSchema = z.enum(tipoCursoEnum.enumValues)
export const modalidadeCursoSchema = z.enum(modalidadeCursoEnum.enumValues)
export const statusCursoSchema = z.enum(statusCursoEnum.enumValues)
export const tipoDocumentoProjetoSchema = z.enum(tipoDocumentoProjetoEnum.enumValues)
export const tipoAssinaturaSchema = z.enum(tipoAssinaturaEnum.enumValues)
export const professorInvitationStatusSchema = z.enum(professorInvitationStatusEnum.enumValues)
export const statusEnvioSchema = z.enum(statusEnvioEnum.enumValues)
export const userRoleSchema = z.enum(userRoleEnum.enumValues)

// ========================================
// DISPLAY LABEL MAPS
// ========================================

export const SEMESTRE_LABELS: Record<Semestre, string> = {
  SEMESTRE_1: '1º Semestre',
  SEMESTRE_2: '2º Semestre',
}

export const TIPO_EDITAL_LABELS: Record<TipoEdital, string> = {
  DCC: 'DCC (Interno)',
  PROGRAD: 'PROGRAD',
}

export const PROJETO_STATUS_LABELS: Record<ProjetoStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Submetido',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PENDING_PROFESSOR_SIGNATURE: 'Pendente Assinatura',
}

export const TIPO_PROPOSICAO_LABELS: Record<TipoProposicao, string> = {
  INDIVIDUAL: 'Individual',
  COLETIVA: 'Coletiva',
}

export const TIPO_VAGA_LABELS: Record<TipoVaga, string> = {
  BOLSISTA: 'Bolsista',
  VOLUNTARIO: 'Voluntário',
}

export const STATUS_INSCRICAO_LABELS: Record<StatusInscricao, string> = {
  SUBMITTED: 'Submetida',
  SELECTED_BOLSISTA: 'Selecionado (Bolsista)',
  SELECTED_VOLUNTARIO: 'Selecionado (Voluntário)',
  ACCEPTED_BOLSISTA: 'Aceito (Bolsista)',
  ACCEPTED_VOLUNTARIO: 'Aceito (Voluntário)',
  REJECTED_BY_PROFESSOR: 'Rejeitado pelo Professor',
  REJECTED_BY_STUDENT: 'Rejeitado pelo Estudante',
  WAITING_LIST: 'Lista de Espera',
}

export const GENERO_LABELS: Record<Genero, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  OUTRO: 'Outro',
}

export const REGIME_LABELS: Record<Regime, string> = {
  '20H': '20 horas',
  '40H': '40 horas',
  DE: 'Dedicação Exclusiva',
}

export const TIPO_CURSO_LABELS: Record<TipoCurso, string> = {
  BACHARELADO: 'Bacharelado',
  LICENCIATURA: 'Licenciatura',
  TECNICO: 'Técnico',
  POS_GRADUACAO: 'Pós-Graduação',
}

export const MODALIDADE_CURSO_LABELS: Record<ModalidadeCurso, string> = {
  PRESENCIAL: 'Presencial',
  EAD: 'EAD',
  HIBRIDO: 'Híbrido',
}

export const STATUS_CURSO_LABELS: Record<StatusCurso, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  EM_REFORMULACAO: 'Em Reformulação',
}

export const STATUS_MONITOR_LABELS: Record<StatusMonitor, string> = {
  ATIVO: 'Ativo',
  CONCLUÍDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  student: 'Estudante',
}

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  GRADUADO: 'Graduado',
  TRANSFERIDO: 'Transferido',
}

export const PROJETO_TIPO_LABELS: Record<ProjetoTipo, string> = {
  NOVO: 'Novo Projeto',
  CONTINUACAO: 'Continuação',
}

export const ALLOCATION_STATUS_NAO_ALOCADO = 'NAO_ALOCADO' as const
export const ALLOCATION_STATUS_PARCIALMENTE_ALOCADO = 'PARCIALMENTE_ALOCADO' as const
export const ALLOCATION_STATUS_TOTALMENTE_ALOCADO = 'TOTALMENTE_ALOCADO' as const
export const ALLOCATION_STATUS_SOBRE_ALOCADO = 'SOBRE_ALOCADO' as const
export const ALLOCATION_STATUS_ENUM = [
  ALLOCATION_STATUS_NAO_ALOCADO,
  ALLOCATION_STATUS_PARCIALMENTE_ALOCADO,
  ALLOCATION_STATUS_TOTALMENTE_ALOCADO,
  ALLOCATION_STATUS_SOBRE_ALOCADO,
] as const
export const allocationStatusSchema = z.enum(ALLOCATION_STATUS_ENUM)
export type AllocationStatus = z.infer<typeof allocationStatusSchema>

export const ALLOCATION_STATUS_LABELS: Record<AllocationStatus, string> = {
  NAO_ALOCADO: 'Não Alocado',
  PARCIALMENTE_ALOCADO: 'Parcialmente Alocado',
  TOTALMENTE_ALOCADO: 'Totalmente Alocado',
  SOBRE_ALOCADO: 'Sobre-alocado',
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function getSemestreLabel(semestre: Semestre): string {
  return SEMESTRE_LABELS[semestre]
}

export function getTipoEditalLabel(tipo: TipoEdital): string {
  return TIPO_EDITAL_LABELS[tipo]
}

export function getProjetoStatusLabel(status: ProjetoStatus): string {
  return PROJETO_STATUS_LABELS[status]
}

export function getTipoProposicaoLabel(tipo: TipoProposicao): string {
  return TIPO_PROPOSICAO_LABELS[tipo]
}

export function getTipoVagaLabel(tipo: TipoVaga): string {
  return TIPO_VAGA_LABELS[tipo]
}

export function getStatusInscricaoLabel(status: StatusInscricao): string {
  return STATUS_INSCRICAO_LABELS[status]
}

export function getGeneroLabel(genero: Genero): string {
  return GENERO_LABELS[genero]
}

export function getRegimeLabel(regime: Regime): string {
  return REGIME_LABELS[regime]
}

export function getTipoCursoLabel(tipo: TipoCurso): string {
  return TIPO_CURSO_LABELS[tipo]
}

export function getModalidadeCursoLabel(modalidade: ModalidadeCurso): string {
  return MODALIDADE_CURSO_LABELS[modalidade]
}

export function getStatusCursoLabel(status: StatusCurso): string {
  return STATUS_CURSO_LABELS[status]
}

export function getStatusMonitorLabel(status: StatusMonitor): string {
  return STATUS_MONITOR_LABELS[status]
}

export function getUserRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role]
}

export function getProjetoTipoLabel(tipo: ProjetoTipo): string {
  return PROJETO_TIPO_LABELS[tipo]
}

export function getAllocationStatusLabel(status: AllocationStatus): string {
  return ALLOCATION_STATUS_LABELS[status]
}

// Period validation schema
export const periodSchema = z.object({
  ano: anoSchema,
  semestre: semestreSchema,
})

export type Period = z.infer<typeof periodSchema>

// ========================================
// ADDITIONAL ENUMS (non-database)
// ========================================

// File Actions
export const FILE_ACTION = ['view', 'download'] as const
export type FileAction = (typeof FILE_ACTION)[number]
export const fileActionSchema = z.enum(FILE_ACTION)

// Document Types for Onboarding
export const DOCUMENT_TYPE = [
  'comprovante_matricula',
  'historico_escolar',
  'curriculum_vitae',
  'comprovante_vinculo',
] as const
export type DocumentType = (typeof DOCUMENT_TYPE)[number]
export const documentTypeSchema = z.enum(DOCUMENT_TYPE)

// Notification Types
export const NOTIFICATION_TYPE = [
  'assinatura_projeto_pendente',
  'assinatura_termo_pendente',
  'aceite_vaga_pendente',
  'documentos_incompletos',
  'periodo_inscricao_proximo_fim', // 3 days before inscription period ends
  'periodo_inscricao_iniciado', // Inscription period started
  'relatorio_final_pendente', // Final report pending for professor
  'relatorio_monitor_pendente', // Monitor report pending for student
  'certificado_disponivel', // Certificate available for generation
] as const
export type NotificationType = (typeof NOTIFICATION_TYPE)[number]
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPE)

// Notification Priority
export const NOTIFICATION_PRIORITY = ['info', 'aviso', 'urgente', 'lembrete_automatico'] as const
export type NotificationPriority = (typeof NOTIFICATION_PRIORITY)[number]
export const notificationPrioritySchema = z.enum(NOTIFICATION_PRIORITY)

// Stats Period
export const STATS_PERIOD = ['7d', '30d', '90d'] as const
export type StatsPeriod = (typeof STATS_PERIOD)[number]
export const statsPeriodSchema = z.enum(STATS_PERIOD)

// Signature Type for Termos (using existing database enum values)
export const SIGNATURE_TYPE_TERMO = ['TERMO_COMPROMISSO_ALUNO', 'ATA_SELECAO_PROFESSOR'] as const
export type SignatureTypeTermo = (typeof SIGNATURE_TYPE_TERMO)[number]
export const signatureTypeTermoSchema = z.enum(SIGNATURE_TYPE_TERMO)

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Converts Semestre enum to numeric string for display
 * @param semestre - Semestre enum value (SEMESTRE_1 or SEMESTRE_2)
 * @returns '1' for SEMESTRE_1, '2' for SEMESTRE_2
 */
export function getSemestreNumero(semestre: Semestre): '1' | '2' {
  return semestre === SEMESTRE_1 ? '1' : '2'
}
