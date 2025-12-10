import { z } from 'zod'
import { anoSchema, semestreSchema, Semestre, TipoVaga, tipoVagaSchema } from './enums'

// ========================================
// ATA MONITORIA TYPES (Bolsa/Voluntária)
// ========================================

export interface AtaMonitoriaData {
  tipo: TipoVaga // BOLSISTA or VOLUNTARIO
  ano: number
  semestre: Semestre
  departamento: {
    nome: string
    sigla: string | null
  }
  disciplina: {
    codigo: string
    nome: string
  }
  editalNumero: string // e.g., "01/2025"
  dataSelecao: string // e.g., "XX de XXX de 2025"
  horaSelecao: string // e.g., "XX:XX"
  professorNome: string
  totalInscritos: number
  totalCompareceram: number
  classificados: Array<{
    nome: string
    media: number
  }>
  dataDocumento: string // e.g., "XX de XXX de 2025"
}

export const ataMonitoriaDataSchema = z.object({
  tipo: tipoVagaSchema,
  ano: anoSchema,
  semestre: semestreSchema,
  departamento: z.object({
    nome: z.string(),
    sigla: z.string().nullable(),
  }),
  disciplina: z.object({
    codigo: z.string(),
    nome: z.string(),
  }),
  editalNumero: z.string(),
  dataSelecao: z.string(),
  horaSelecao: z.string(),
  professorNome: z.string(),
  totalInscritos: z.number().int().min(0),
  totalCompareceram: z.number().int().min(0),
  classificados: z.array(
    z.object({
      nome: z.string(),
      media: z.number().min(0).max(10),
    })
  ),
  dataDocumento: z.string(),
})

// ========================================
// RESULTADO MONITORIA TYPES (Bolsa/Voluntária)
// ========================================

export interface ResultadoMonitoriaData {
  tipo: TipoVaga // BOLSISTA or VOLUNTARIO
  ano: number
  semestre: Semestre
  departamento: {
    nome: string
    sigla: string | null
  }
  disciplina: {
    codigo: string
    nome: string
  }
  editalNumero: string // e.g., "01/2025"
  professorNome: string
  candidatos: Array<{
    nome: string
    nota: number
    classificacao: number
  }>
  dataDocumento: string // e.g., "XX de XXX de 2025"
}

export const resultadoMonitoriaDataSchema = z.object({
  tipo: tipoVagaSchema,
  ano: anoSchema,
  semestre: semestreSchema,
  departamento: z.object({
    nome: z.string(),
    sigla: z.string().nullable(),
  }),
  disciplina: z.object({
    codigo: z.string(),
    nome: z.string(),
  }),
  editalNumero: z.string(),
  professorNome: z.string(),
  candidatos: z.array(
    z.object({
      nome: z.string(),
      nota: z.number().min(0).max(10),
      classificacao: z.number().int().positive(),
    })
  ),
  dataDocumento: z.string(),
})

// ========================================
// RELATÓRIO ATIVIDADES MONITOR TYPES (PROGRAD format)
// ========================================

export interface RelatorioAtividadesMonitorData {
  // 1. INFORMAÇÕES DO PROJETO
  projeto: {
    unidadeUniversitaria: string // e.g., "Instituto de Computação"
    orgaoResponsavel: string // e.g., "Dpto. Ciência da Computação"
    componenteCurricular: string // e.g., "MATXXX - Nome da Disciplina"
    professorOrientador: string
    semestreLetivo: string // e.g., "2025.1"
  }
  // 2. INFORMAÇÕES DO MONITOR
  monitor: {
    nomeCompleto: string
    modalidade: TipoVaga // BOLSISTA or VOLUNTARIO
    periodoAtuacao: string // e.g., "24/03/25 a 26/07/25"
  }
  // 3. RELATÓRIO DE ATIVIDADES
  relatorioAtividades: string // Text filled by monitor
  assinaturaMonitor?: string | null
  dataAssinaturaMonitor?: string | null
  // 4. PARECER AVALIATIVO
  parecer: {
    cumpriuCargaHoraria: boolean
    nota: number // 0 to 10
    frequencia: number // 0 to 100
    textoAvaliacao?: string | null
  }
  assinaturaProfessor?: string | null
  dataAssinaturaProfessor?: string | null
  // 5. APROVAÇÃO DO ÓRGÃO RESPONSÁVEL
  aprovacaoOrgao?: {
    dataAprovacao?: string | null
    assinaturaChefe?: string | null
  } | null
}

export const relatorioAtividadesMonitorDataSchema = z.object({
  projeto: z.object({
    unidadeUniversitaria: z.string(),
    orgaoResponsavel: z.string(),
    componenteCurricular: z.string(),
    professorOrientador: z.string(),
    semestreLetivo: z.string(),
  }),
  monitor: z.object({
    nomeCompleto: z.string(),
    modalidade: tipoVagaSchema,
    periodoAtuacao: z.string(),
  }),
  relatorioAtividades: z.string(),
  assinaturaMonitor: z.string().nullable().optional(),
  dataAssinaturaMonitor: z.string().nullable().optional(),
  parecer: z.object({
    cumpriuCargaHoraria: z.boolean(),
    nota: z.number().min(0).max(10),
    frequencia: z.number().min(0).max(100),
    textoAvaliacao: z.string().nullable().optional(),
  }),
  assinaturaProfessor: z.string().nullable().optional(),
  dataAssinaturaProfessor: z.string().nullable().optional(),
  aprovacaoOrgao: z
    .object({
      dataAprovacao: z.string().nullable().optional(),
      assinaturaChefe: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
})
