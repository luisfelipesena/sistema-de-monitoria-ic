import type { StatusInscricao, TipoInscricao } from './enums'

export interface MonitorCandidate {
  id: number
  status: StatusInscricao
  tipoVagaPretendida: TipoInscricao | null
  notaDisciplina: string | null
  notaSelecao: string | null
  notaFinal: string | null
  aluno: {
    id: number
    nomeCompleto: string
    matricula: string | null
    cr: number | null
    user: {
      email: string
    }
  }
}

export interface MonitorProject {
  id: number
  titulo: string
  bolsasDisponibilizadas: number | null
  voluntariosSolicitados: number | null
  inscricoes: MonitorCandidate[]
}

export interface SelectionState {
  bolsistas: number[]
  voluntarios: number[]
}
