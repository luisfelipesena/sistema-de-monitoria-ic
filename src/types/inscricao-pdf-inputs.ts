import type { Genero, Semestre, TipoVaga } from './enums'

// ========================================
// PDF TEMPLATE DTOs
// Pure data shapes consumed by React-PDF templates.
// Decouples templates from Drizzle row shapes.
// ========================================

export interface MonitorFullData {
  nomeCompleto: string
  nomeSocial?: string | null
  cpf: string
  rg: string
  matricula: string
  dataNascimento?: Date | null
  genero?: Genero | null
  endereco: {
    rua: string
    numero?: number | null
    bairro: string
    cidade: string
    estado: string
    cep: string
    complemento?: string | null
  }
  telefone?: string | null
  telefoneFixo?: string | null
  email: string
  cursoNome?: string | null
  cr?: number | null
  // Banking info (only used on Anexo I when Bolsista)
  banco?: string | null
  agencia?: string | null
  conta?: string | null
  digitoConta?: string | null
}

export interface ProjetoHeaderData {
  unidadeUniversitaria: string // "Instituto de Computação"
  departamentoNome: string
  disciplina: {
    codigo: string
    nome: string
  }
  professorResponsavelNome: string
  professorOrientadorNome: string
  ano: number
  semestre: Semestre
  periodoInicio?: Date | null
  periodoFim?: Date | null
}

export interface DisciplinaEquivalenteData {
  codigo: string
  nome: string
}

export interface SignaturePayload {
  dataUrl: string // data:image/png;base64,...
  local: string
  data: Date
}

// ========================================
// ANEXO IV - INSCRIÇÃO VOLUNTÁRIO
// ========================================
export interface AnexoIVInputs {
  monitor: MonitorFullData
  projeto: ProjetoHeaderData
  declaracao: {
    cursouComponente: boolean
    disciplinaEquivalente?: DisciplinaEquivalenteData | null
  }
  signature?: SignaturePayload | null
}

// ========================================
// ANEXO III - INSCRIÇÃO BOLSISTA
// ========================================
export interface AnexoIIIInputs {
  monitor: MonitorFullData
  projeto: ProjetoHeaderData
  declaracao: {
    cursouComponente: boolean
    disciplinaEquivalente?: DisciplinaEquivalenteData | null
  }
  signature?: SignaturePayload | null
}

// ========================================
// ANEXO I - TERMO DE COMPROMISSO DO MONITOR
// ========================================
export interface AnexoITermoInputs {
  monitor: MonitorFullData
  projeto: ProjetoHeaderData
  tipoVaga: TipoVaga
  signature?: SignaturePayload | null
}
