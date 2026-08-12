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
  // Datas de INSCRIÇÃO (obrigatórias)
  dataInicioInscricao: Date
  dataFimInscricao: Date
  // Datas de SELEÇÃO (obrigatórias)
  dataInicioSelecao: Date
  dataFimSelecao: Date
  // Range de horários para seleção (obrigatórios)
  horarioInicioSelecao: string
  horarioFimSelecao: string
  // Divulgação (obrigatória)
  dataDivulgacaoResultado: Date
  // Janela de abertura e fechamento do edital (obrigatório)
  dataInicioAlteracao: Date
  dataFimAlteracao: Date
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
  // Janela de alteração
  dataInicioAlteracao?: Date | null
  dataFimAlteracao?: Date | null
  // Slots de data/horário para provas (legacy)
  datasProvasDisponiveis?: SlotDataHorario[]
  numeroEditalPrograd?: string
}
