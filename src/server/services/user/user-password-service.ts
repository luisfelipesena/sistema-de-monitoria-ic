import type { db } from '@/server/db'
import { emailService } from '@/server/lib/email'
import { BusinessError, ForbiddenError, NotFoundError } from '@/server/lib/errors'
import { createAuditService } from '@/server/services/audit/audit-service'
import { createAuthRepository } from '@/server/services/auth/auth-repository'
import { ADMIN, AUDIT_ACTION_UPDATE, AUDIT_ENTITY_USER, type AdminGeneratePasswordResetInput } from '@/types'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { randomBytes } from 'crypto'
import { createUserRepository } from './user-repository'

const log = logger.child({ context: 'UserPasswordService' })

const TOKEN_LENGTH = 48
// Shorter than the 60 min self-service flow: this link travels through a human channel.
const ADMIN_RESET_TOKEN_EXPIRATION_MINUTES = 15

const buildPasswordResetLink = (token: string) => {
  const baseUrl = env.PASSWORD_RESET_URL ?? `${env.CLIENT_URL}/auth/reset`
  const url = new URL(baseUrl)
  url.searchParams.set('token', token)
  return url.toString()
}

export const createUserPasswordService = (database: typeof db) => {
  const userRepository = createUserRepository(database)
  const authRepository = createAuthRepository(database)
  const auditService = createAuditService(database)

  return {
    async generateResetLink(actorId: number, input: AdminGeneratePasswordResetInput) {
      if (input.userId === actorId) {
        throw new BusinessError('Use o fluxo normal de redefinição para a sua própria senha.', 'SELF_RESET')
      }

      const target = await userRepository.findById(input.userId)

      if (!target) {
        throw new NotFoundError('User', input.userId)
      }

      if (target.role === ADMIN) {
        throw new ForbiddenError('Não é possível redefinir a senha de outro administrador.')
      }

      const token = randomBytes(TOKEN_LENGTH).toString('hex')
      const expiresAt = new Date(Date.now() + ADMIN_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000)

      await authRepository.updatePasswordResetToken(target.id, token, expiresAt)

      const resetLink = buildPasswordResetLink(token)

      let emailSent = true
      try {
        await emailService.sendPasswordResetEmail({ to: target.email, resetLink })
      } catch (error) {
        emailSent = false
        log.error(error, 'Admin-generated password reset email failed to send')
      }

      // Token and link stay out of the payload: audit details are rendered as plaintext to admins.
      await auditService.logAction(actorId, AUDIT_ACTION_UPDATE, AUDIT_ENTITY_USER, target.id, {
        operation: 'ADMIN_PASSWORD_RESET_LINK',
        targetEmail: target.email,
        targetRole: target.role,
        motivo: input.motivo,
        expiresAt: expiresAt.toISOString(),
        emailSent,
      })

      return { resetLink, expiresAt, emailSent }
    },
  }
}
