import type { UserRole } from './enums'

export type GenerateAtaDataInput = {
  projetoId: string
  userId: number
  userRole: UserRole
}

export type CreateAtaInput = {
  projetoId: string
  userId: number
  userRole: UserRole
}

export type SignAtaInput = {
  ataId: number
  assinaturaBase64: string
  userId: number
  userRole: UserRole
}

export type PublishResultsInput = {
  projetoId: string
  notifyStudents: boolean
  mensagemPersonalizada?: string
  userId: number
  userRole: UserRole
}

export type SelectMonitorsInput = {
  projetoId: number
  bolsistas: number[]
  voluntarios: number[]
  userId: number
  userRole: UserRole
}
