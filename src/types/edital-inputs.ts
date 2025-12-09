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
  // Divulgação e link
  dataDivulgacaoResultado?: Date
  linkFormularioInscricao?: string
  // Legacy/external
  fileIdPdfExterno?: string
  datasProvasDisponiveis?: string[]
  criadoPorUserId: number
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
  // Divulgação e link
  dataDivulgacaoResultado?: Date | null
  linkFormularioInscricao?: string | null
  // Legacy
  datasProvasDisponiveis?: string[]
}
