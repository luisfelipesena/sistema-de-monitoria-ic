import type { UserRole, Semestre, TipoProposicao, ProjetoStatus } from './enums'

export type CreateProjetoInput = {
  userId: number
  userRole: UserRole
  titulo: string
  descricao: string
  departamentoId: number
  ano: number
  semestre: Semestre
  tipoProposicao: TipoProposicao
  bolsasSolicitadas?: number
  voluntariosSolicitados?: number
  cargaHorariaSemana: number
  numeroSemanas: number
  publicoAlvo: string
  estimativaPessoasBenificiadas?: number
  disciplinaIds?: number[]
  disciplinas?: number[]
  professoresParticipantes?: string
  atividades?: string[]
  professorResponsavelId?: number
  status?: ProjetoStatus
}

export type UpdateProjetoInput = Partial<CreateProjetoInput> & { id: number }
