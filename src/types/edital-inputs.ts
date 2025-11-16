import type { TipoEdital, Semestre } from './enums'

export type CreateEditalInput = {
  tipo: TipoEdital
  numeroEdital: string
  titulo: string
  descricaoHtml?: string
  valorBolsa?: string
  ano: number
  semestre: Semestre
  dataInicio: Date
  dataFim: Date
  fileIdProgradOriginal?: string
  datasProvasDisponiveis?: string[]
  dataDivulgacaoResultado?: Date
  criadoPorUserId: number
}

export type UpdateEditalInput = {
  id: number
  numeroEdital?: string
  titulo?: string
  descricaoHtml?: string
  ano?: number
  semestre?: Semestre
  dataInicio?: Date
  dataFim?: Date
  datasProvasDisponiveis?: string[]
  dataDivulgacaoResultado?: Date
}
