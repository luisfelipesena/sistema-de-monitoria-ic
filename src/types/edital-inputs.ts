import type { Semestre, TipoEdital } from './enums'
import type { SlotDataHorario } from './selecao-inputs'

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
  datasProvasDisponiveis?: SlotDataHorario[]
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
  // Slots de data/horário para provas (objetos estruturados)
  datasProvasDisponiveis?: SlotDataHorario[]
  numeroEditalPrograd?: string
}
