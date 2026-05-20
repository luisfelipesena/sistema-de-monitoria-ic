import { auditActionEnum, auditEntityEnum } from '@/server/db/schema'
import { z } from 'zod'

// ========================================
// AUDIT ACTION TYPES (from database enum)
// ========================================

type ExtractEnumValues<T> = T extends { enumValues: readonly (infer V)[] } ? V : never

export type AuditAction = ExtractEnumValues<typeof auditActionEnum>
export type AuditEntity = ExtractEnumValues<typeof auditEntityEnum>

// Action constants
export const AUDIT_ACTION_CREATE = 'CREATE' as const
export const AUDIT_ACTION_UPDATE = 'UPDATE' as const
export const AUDIT_ACTION_DELETE = 'DELETE' as const
export const AUDIT_ACTION_APPROVE = 'APPROVE' as const
export const AUDIT_ACTION_REJECT = 'REJECT' as const
export const AUDIT_ACTION_SUBMIT = 'SUBMIT' as const
export const AUDIT_ACTION_SIGN = 'SIGN' as const
export const AUDIT_ACTION_LOGIN = 'LOGIN' as const
export const AUDIT_ACTION_LOGOUT = 'LOGOUT' as const
export const AUDIT_ACTION_SEND_NOTIFICATION = 'SEND_NOTIFICATION' as const
export const AUDIT_ACTION_PUBLISH = 'PUBLISH' as const
export const AUDIT_ACTION_SELECT = 'SELECT' as const
export const AUDIT_ACTION_ACCEPT = 'ACCEPT' as const

export const AUDIT_ACTION_ENUM = [
  AUDIT_ACTION_CREATE,
  AUDIT_ACTION_UPDATE,
  AUDIT_ACTION_DELETE,
  AUDIT_ACTION_APPROVE,
  AUDIT_ACTION_REJECT,
  AUDIT_ACTION_SUBMIT,
  AUDIT_ACTION_SIGN,
  AUDIT_ACTION_LOGIN,
  AUDIT_ACTION_LOGOUT,
  AUDIT_ACTION_SEND_NOTIFICATION,
  AUDIT_ACTION_PUBLISH,
  AUDIT_ACTION_SELECT,
  AUDIT_ACTION_ACCEPT,
] as const

// Entity constants
export const AUDIT_ENTITY_PROJETO = 'PROJETO' as const
export const AUDIT_ENTITY_INSCRICAO = 'INSCRICAO' as const
export const AUDIT_ENTITY_EDITAL = 'EDITAL' as const
export const AUDIT_ENTITY_RELATORIO = 'RELATORIO' as const
export const AUDIT_ENTITY_VAGA = 'VAGA' as const
export const AUDIT_ENTITY_USER = 'USER' as const
export const AUDIT_ENTITY_PROFESSOR = 'PROFESSOR' as const
export const AUDIT_ENTITY_ALUNO = 'ALUNO' as const
export const AUDIT_ENTITY_NOTIFICATION = 'NOTIFICATION' as const

export const AUDIT_ENTITY_ENUM = [
  AUDIT_ENTITY_PROJETO,
  AUDIT_ENTITY_INSCRICAO,
  AUDIT_ENTITY_EDITAL,
  AUDIT_ENTITY_RELATORIO,
  AUDIT_ENTITY_VAGA,
  AUDIT_ENTITY_USER,
  AUDIT_ENTITY_PROFESSOR,
  AUDIT_ENTITY_ALUNO,
  AUDIT_ENTITY_NOTIFICATION,
] as const

// ========================================
// ZOD SCHEMAS
// ========================================

export const auditActionSchema = z.enum(AUDIT_ACTION_ENUM)
export const auditEntitySchema = z.enum(AUDIT_ENTITY_ENUM)

// ========================================
// INPUT TYPES
// ========================================

export type AuditLogInput = {
  userId?: number
  action: AuditAction
  entityType: AuditEntity
  entityId?: number
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export type AuditLogListInput = {
  entityType?: AuditEntity
  entityId?: number
  userId?: number
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// ========================================
// OUTPUT TYPES
// ========================================

export type AuditLogEntry = {
  id: number
  userId: number | null
  action: AuditAction
  entityType: AuditEntity
  entityId: number | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  timestamp: Date
  user?: {
    id: number
    username: string
    email: string
  } | null
}

export type AuditLogListOutput = {
  data: AuditLogEntry[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
