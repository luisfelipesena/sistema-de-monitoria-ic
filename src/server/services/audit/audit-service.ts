import type { db } from '@/server/db'
import type { AuditAction, AuditEntity, AuditLogInput, AuditLogListInput } from '@/types'
import { logger } from '@/utils/logger'
import { createAuditRepository } from './audit-repository'

type Database = typeof db

const log = logger.child({ context: 'AuditService' })

export function createAuditService(database: Database) {
  const repo = createAuditRepository(database)

  return {
    /**
     * Log an audit event
     * This is designed to be fire-and-forget - errors are logged but not thrown
     */
    async log(input: AuditLogInput): Promise<void> {
      try {
        await repo.insert(input)
        log.debug({ action: input.action, entityType: input.entityType, entityId: input.entityId }, 'Audit log created')
      } catch (error) {
        log.error(error, 'Failed to create audit log')
        // Don't throw - audit logging should not break business logic
      }
    },

    /**
     * Get audit logs for a specific entity
     */
    async getByEntity(entityType: AuditEntity, entityId: number) {
      return repo.findByEntity(entityType, entityId)
    },

    /**
     * Get audit logs for a specific user
     */
    async getByUser(userId: number, limit = 50) {
      return repo.findByUser(userId, limit)
    },

    /**
     * List audit logs with filters and pagination
     */
    async list(input: AuditLogListInput) {
      return repo.list(input)
    },

    /**
     * Count audit events by action type
     */
    async countByAction(action: AuditAction, startDate?: Date, endDate?: Date) {
      return repo.countByAction(action, startDate, endDate)
    },

    /**
     * Helper method to create audit log with common context
     */
    logAction(
      userId: number | undefined,
      action: AuditAction,
      entityType: AuditEntity,
      entityId?: number,
      details?: Record<string, unknown>,
      ipAddress?: string,
      userAgent?: string
    ): Promise<void> {
      return this.log({
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent,
      })
    },
  }
}

export type AuditService = ReturnType<typeof createAuditService>
