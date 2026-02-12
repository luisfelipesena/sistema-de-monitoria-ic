import type { TipoEdital, Semestre } from './enums'

export type CreateEditalInput = {
  tipo: TipoEdital
  numeroEdital: string
  titulo: string
  descricaoHtml?: string
  valorBolsa?: string
  ano: number
  semestre: Semestre
  // Datas de INSCRIÇÃO
  dataInicioInscricao: Date
  dataFimInscricao: Date
  // Datas de SELEÇÃO (prova) - opcionais
  dataInicioSelecao?: Date
  dataFimSelecao?: Date
  // Divulgação
  dataDivulgacaoResultado?: Date
  // Legacy/external
  fileIdPdfExterno?: string
  datasProvasDisponiveis?: string[]
  criadoPorUserId: number
  numeroEditalPrograd?: string
}

export type UpdateEditalInput = {
  id: number
  numeroEdital?: string
  titulo?: string
  descricaoHtml?: string
  valorBolsa?: string
  ano?: number
  semestre?: Semestre
  // Datas de INSCRIÇÃO
  dataInicioInscricao?: Date
  dataFimInscricao?: Date
  // Datas de SELEÇÃO (prova)
  dataInicioSelecao?: Date | null
  dataFimSelecao?: Date | null
  // Divulgação
  dataDivulgacaoResultado?: Date | null
  // Legacy
  datasProvasDisponiveis?: string[]
  numeroEditalPrograd?: string
}
