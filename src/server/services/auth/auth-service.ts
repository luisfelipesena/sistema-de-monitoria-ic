import { db } from '@/server/db'
import { createAuthRepository } from './auth-repository'
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '@/server/lib/errors'
import { emailService } from '@/server/lib/email'
import { lucia } from '@/server/lib/lucia'
import { env } from '@/utils/env'
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

const SALT_ROUNDS = 12
const TOKEN_LENGTH = 48
const TOKEN_EXPIRATION_HOURS = 24
const PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES = 60

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

      await emailService.sendEmailVerification({
        to: newUser.email,
        verificationLink: buildVerificationLink(verificationToken),
      })

      return { success: true, message: 'Cadastro realizado. Verifique seu e-mail para ativar a conta.' }
    },

    async resendVerification(data: ResendVerificationInput) {
      const email = normalizeEmail(data.email)
      const user = await authRepository.findByEmail(email)

      if (!user) {
        throw new NotFoundError('User', email)
      }

      if (user.emailVerifiedAt) {
        return { success: true, message: 'Conta já verificada. Pode fazer login.' }
      }

      const verificationToken = randomBytes(TOKEN_LENGTH).toString('hex')
      const expires = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000)

      await authRepository.updateVerificationToken(user.id, verificationToken, expires)

      await emailService.sendEmailVerification({
        to: email,
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

      try {
        const user = await authRepository.findByEmail(email)

        if (!user) {
          return {
            success: true,
            message: 'Se o e-mail existir, enviaremos instruções para redefinir a senha.',
          }
        }

        const token = randomBytes(TOKEN_LENGTH).toString('hex')
        const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000)

        await authRepository.updatePasswordResetToken(user.id, token, expires)

        await emailService.sendPasswordResetEmail({
          to: email,
          resetLink: buildPasswordResetLink(token),
        })

        return {
          success: true,
          message: 'Se o e-mail existir, enviaremos instruções para redefinir a senha.',
        }
      } catch (error) {
        console.error('[requestPasswordReset] Erro ao processar reset de senha:', error)
        return {
          success: true,
          message: 'Se o e-mail existir, enviaremos instruções para redefinir a senha.',
        }
      }
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
