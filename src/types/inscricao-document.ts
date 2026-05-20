import { tipoDocumentoInscricaoEnum } from '@/server/db/schema'
import { z } from 'zod'

// ========================================
// TIPO DOCUMENTO INSCRIÇÃO
// ========================================

// Individual uploads by the student (identity/transcript)
export const TIPO_DOCUMENTO_INSCRICAO_RG = 'RG' as const
export const TIPO_DOCUMENTO_INSCRICAO_CPF = 'CPF' as const
export const TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR = 'HISTORICO_ESCOLAR' as const
export const TIPO_DOCUMENTO_INSCRICAO_COMPROVANTE_MATRICULA = 'COMPROVANTE_MATRICULA' as const

// Generated forms (system-rendered pre-filled + signed PDFs)
export const TIPO_DOCUMENTO_INSCRICAO_ANEXO_III_BOLSISTA = 'ANEXO_III_BOLSISTA' as const
export const TIPO_DOCUMENTO_INSCRICAO_ANEXO_IV_VOLUNTARIO = 'ANEXO_IV_VOLUNTARIO' as const
export const TIPO_DOCUMENTO_INSCRICAO_ANEXO_I_TERMO_COMPROMISSO = 'ANEXO_I_TERMO_COMPROMISSO' as const
export const TIPO_DOCUMENTO_INSCRICAO_COMBINADO = 'COMPROVANTE_INSCRICAO_COMBINADO' as const

export const tipoDocumentoInscricaoSchema = z.enum(tipoDocumentoInscricaoEnum.enumValues)
export type TipoDocumentoInscricao = z.infer<typeof tipoDocumentoInscricaoSchema>

// Documents the student uploads during the wizard
export const UPLOAD_DOC_TYPES = [
  TIPO_DOCUMENTO_INSCRICAO_RG,
  TIPO_DOCUMENTO_INSCRICAO_CPF,
  TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR,
  TIPO_DOCUMENTO_INSCRICAO_COMPROVANTE_MATRICULA,
] as const
export type UploadDocType = (typeof UPLOAD_DOC_TYPES)[number]
export const uploadDocTypeSchema = z.enum(UPLOAD_DOC_TYPES)

// Documents the system generates + signs on submission
export const GENERATED_DOC_TYPES = [
  TIPO_DOCUMENTO_INSCRICAO_ANEXO_III_BOLSISTA,
  TIPO_DOCUMENTO_INSCRICAO_ANEXO_IV_VOLUNTARIO,
  TIPO_DOCUMENTO_INSCRICAO_ANEXO_I_TERMO_COMPROMISSO,
  TIPO_DOCUMENTO_INSCRICAO_COMBINADO,
] as const

// Mandatory uploads per application
export const REQUIRED_UPLOAD_DOCS = [
  TIPO_DOCUMENTO_INSCRICAO_RG,
  TIPO_DOCUMENTO_INSCRICAO_CPF,
  TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR,
] as const

export const TIPO_DOCUMENTO_INSCRICAO_LABELS: Record<TipoDocumentoInscricao, string> = {
  RG: 'RG',
  CPF: 'CPF',
  HISTORICO_ESCOLAR: 'Histórico Escolar',
  COMPROVANTE_MATRICULA: 'Comprovante de Matrícula',
  ANEXO_III_BOLSISTA: 'Anexo III - Inscrição Bolsista',
  ANEXO_IV_VOLUNTARIO: 'Anexo IV - Inscrição Voluntário',
  ANEXO_I_TERMO_COMPROMISSO: 'Anexo I - Termo de Compromisso',
  COMPROVANTE_INSCRICAO_COMBINADO: 'Comprovante de Inscrição (Combinado)',
}
