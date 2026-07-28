import { db } from '@/server/db'
import { createAuthRepository } from './auth-repository'
import { BusinessError, ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '@/server/lib/errors'
import { emailService } from '@/server/lib/email'
import { checkEmailTransport } from '@/server/lib/email/email-transport'
import { lucia } from '@/server/lib/lucia'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { emailToUsername } from '@/utils/username-formatter'
import { ensureAdminRole } from '@/utils/admins'
import { compare, hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import type {
  RegisterUserInput,
  ResendVerificationInput,
  VerifyEmailInput,
  LoginUserInput,
  RequestPasswordResetInput,
  ResetPasswordWithTokenInput,
  SetPasswordInput,
} from '@/types'
import { STUDENT, PROFESSOR } from '@/types'

const log = logger.child({ context: 'AuthService' })

const SALT_ROUNDS = 12
const TOKEN_LENGTH = 48
const TOKEN_EXPIRATION_HOURS = 24
const PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES = 60

const GENERIC_PASSWORD_RESET_MESSAGE = 'Se o e-mail existir, enviaremos instruções para redefinir a senha.'
const EMAIL_DELIVERY_FAILURE_MESSAGE =
  'Não foi possível enviar o e-mail de redefinição no momento. Procure um administrador do sistema.'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const buildVerificationLink = (token: string) => {
  const base = env.EMAIL_VERIFICATION_URL ?? `${env.CLIENT_URL}/auth/verify`
  const url = new URL(base)
  url.searchParams.set('token', token)
  return url.toString()
}

const buildPasswordResetLink = (token: string) => {
  const baseUrl = env.PASSWORD_RESET_URL ?? `${env.CLIENT_URL}/auth/reset`
  const url = new URL(baseUrl)
  url.searchParams.set('token', token)
  return url.toString()
}

export const createAuthService = (database: typeof db) => {
  const authRepository = createAuthRepository(database)

  return {
    async register(data: RegisterUserInput) {
      const email = normalizeEmail(data.email)
      const existingUser = await authRepository.findByEmail(email)

      if (existingUser) {
        throw new ConflictError('Email já cadastrado. Faça login ou utilize recuperação.')
      }

      const passwordHash = await hash(data.password, SALT_ROUNDS)
      const verificationToken = randomBytes(TOKEN_LENGTH).toString('hex')
      const expires = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000)

      const newUser = await authRepository.createUser({
        username: emailToUsername(email),
        email,
        role: data.role,
        passwordHash,
        verificationToken,
        verificationTokenExpiresAt: expires,
      })

      if (data.role === STUDENT) {
        await authRepository.createStudentProfile({
          userId: newUser.id,
          nomeCompleto: data.name,
        })
      } else if (data.role === PROFESSOR) {
        await authRepository.createProfessorProfile({
          userId: newUser.id,
          nomeCompleto: data.name,
        })
      }

      // The account is already persisted, so a send failure must not surface as an error:
      // it would leave an orphan account the user cannot re-register.
      let emailSent = true
      try {
        await emailService.sendEmailVerification({
          to: newUser.email,
          verificationLink: buildVerificationLink(verificationToken),
        })
      } catch (error) {
        emailSent = false
        log.error({ error, userId: newUser.id }, 'Verification email send failed after user creation')
      }

      return {
        success: true,
        emailSent,
        message: emailSent
          ? 'Cadastro realizado. Verifique seu e-mail para ativar a conta.'
          : 'Conta criada, mas não conseguimos enviar o e-mail de verificação. Use "Reenviar verificação" ou procure um administrador.',
      }
    },

    async resendVerification(data: ResendVerificationInput) {
      const email = normalizeEmail(data.email)
      const user = await authRepository.findByEmail(email)

      // Generic answer so the endpoint cannot be used to enumerate accounts.
      if (!user) {
        return { success: true, message: 'Se o e-mail existir, reenviaremos a confirmação.' }
      }

      if (user.emailVerifiedAt) {
        return { success: true, message: 'Conta já verificada. Pode fazer login.' }
      }

      const verificationToken = randomBytes(TOKEN_LENGTH).toString('hex')
      const expires = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000)

      await authRepository.updateVerificationToken(user.id, verificationToken, expires)

      await emailService.sendEmailVerification({
        to: user.email,
        verificationLink: buildVerificationLink(verificationToken),
      })

      return { success: true, message: 'Novo e-mail de verificação enviado.' }
    },

    async verifyEmail(data: VerifyEmailInput) {
      const user = await authRepository.findByVerificationToken(data.token)

      if (!user || !user.verificationTokenExpiresAt) {
        throw new NotFoundError('Token', 'invalid')
      }

      if (user.emailVerifiedAt) {
        return { success: true, message: 'Conta já verificada.' }
      }

      if (user.verificationTokenExpiresAt < new Date()) {
        throw new ValidationError('Token expirado. Solicite novamente.')
      }

      await authRepository.verifyEmail(user.id)

      return { success: true, message: 'E-mail verificado com sucesso.' }
    },

    async login(data: LoginUserInput) {
      const email = normalizeEmail(data.email)
      const user = await authRepository.findByEmail(email)

      if (!user || !user.passwordHash) {
        throw new UnauthorizedError('Credenciais inválidas')
      }

      const isValidPassword = await compare(data.password, user.passwordHash)
      if (!isValidPassword) {
        throw new UnauthorizedError('Credenciais inválidas')
      }

      if (!user.emailVerifiedAt) {
        throw new ValidationError('Verifique seu e-mail antes de entrar.')
      }

      await ensureAdminRole(user.id, user.email)
      const session = await lucia.createSession(user.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)
      const { cookies: getCookies } = await import('next/headers')
      const cookieStore = await getCookies()
      cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

      return {
        success: true,
        message: 'Login realizado com sucesso',
      }
    },

    async requestPasswordReset(data: RequestPasswordResetInput) {
      const email = normalizeEmail(data.email)

      // Checked before the lookup so an outage fails identically for existing and
      // unknown addresses and cannot be used as an enumeration oracle.
      const health = await checkEmailTransport()
      if (!health.healthy) {
        log.error({ error: health.error }, 'Password reset blocked: SMTP transport unhealthy')
        throw new BusinessError(EMAIL_DELIVERY_FAILURE_MESSAGE, 'INTERNAL_SERVER_ERROR')
      }

      const user = await authRepository.findByEmail(email)

      if (!user) {
        return { success: true, message: GENERIC_PASSWORD_RESET_MESSAGE }
      }

      const token = randomBytes(TOKEN_LENGTH).toString('hex')
      const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000)

      await authRepository.updatePasswordResetToken(user.id, token, expires)

      try {
        await emailService.sendPasswordResetEmail({
          to: user.email,
          resetLink: buildPasswordResetLink(token),
        })
      } catch (error) {
        // The token is deliberately left valid so a retry or an admin can still use it.
        log.error({ error, userId: user.id }, 'Password reset email send failed')
        throw new BusinessError(EMAIL_DELIVERY_FAILURE_MESSAGE, 'INTERNAL_SERVER_ERROR')
      }

      return { success: true, message: GENERIC_PASSWORD_RESET_MESSAGE }
    },

    async resetPassword(data: ResetPasswordWithTokenInput) {
      const user = await authRepository.findByPasswordResetToken(data.token)

      if (!user || !user.passwordResetExpiresAt) {
        throw new NotFoundError('Token', 'invalid')
      }

      if (user.passwordResetExpiresAt < new Date()) {
        throw new ValidationError('Token expirado. Solicite novamente.')
      }

      const passwordHash = await hash(data.password, SALT_ROUNDS)

      await authRepository.updatePassword(user.id, {
        passwordHash,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      })

      // Sessions live 30 days, so a reset triggered by a suspected compromise has to
      // drop whatever is already logged in.
      await lucia.invalidateUserSessions(user.id)

      await ensureAdminRole(user.id, user.email)

      return {
        success: true,
        message: 'Senha redefinida com sucesso. Você já pode fazer login.',
      }
    },

    async setPassword(userId: number, data: SetPasswordInput) {
      const dbUser = await authRepository.findById(userId)

      if (!dbUser) {
        throw new NotFoundError('User', userId)
      }

      if (dbUser.passwordHash) {
        if (!data.currentPassword) {
          throw new ValidationError('Informe a senha atual para alterá-la.')
        }

        const isCurrentValid = await compare(data.currentPassword, dbUser.passwordHash)
        if (!isCurrentValid) {
          throw new UnauthorizedError('Senha atual inválida.')
        }
      }

      const passwordHash = await hash(data.password, SALT_ROUNDS)

      await authRepository.updatePassword(dbUser.id, {
        passwordHash,
        emailVerifiedAt: dbUser.emailVerifiedAt ?? new Date(),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      })

      // Same reasoning as resetPassword, but the caller is authenticated: re-issue the
      // cookie right away so changing the password does not log out the current tab.
      await lucia.invalidateUserSessions(dbUser.id)
      const session = await lucia.createSession(dbUser.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)
      const { cookies: getCookies } = await import('next/headers')
      const cookieStore = await getCookies()
      cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

      await ensureAdminRole(dbUser.id, dbUser.email)

      return {
        success: true,
        message: dbUser.passwordHash ? 'Senha atualizada com sucesso.' : 'Senha criada com sucesso.',
      }
    },

    async logout(sessionId?: string) {
      if (sessionId) {
        await lucia.invalidateSession(sessionId)
      }

      const { cookies: getCookies } = await import('next/headers')
      const cookieStore = await getCookies()
      const blankCookie = lucia.createBlankSessionCookie()
      cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes)

      return { success: true }
    },
  }
}

export const authService = createAuthService(db)
