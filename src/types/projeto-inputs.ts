import type { ProjetoStatus, Semestre, TipoProposicao, UserRole } from './enums'

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
  pontosProva?: string
  bibliografia?: string
}

export type UpdateProjetoInput = Partial<CreateProjetoInput> & { id: number }
