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
  // Datas de SELEÇÃO (range)
  dataInicioSelecao?: Date
  dataFimSelecao?: Date
  // Range de horários para seleção
  horarioInicioSelecao?: string
  horarioFimSelecao?: string
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
  // Datas de SELEÇÃO (range)
  dataInicioSelecao?: Date | null
  dataFimSelecao?: Date | null
  // Range de horários para seleção
  horarioInicioSelecao?: string | null
  horarioFimSelecao?: string | null
  // Divulgação
  dataDivulgacaoResultado?: Date | null
  // Slots de data/horário para provas (legacy)
  datasProvasDisponiveis?: SlotDataHorario[]
  numeroEditalPrograd?: string
}
