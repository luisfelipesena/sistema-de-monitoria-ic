import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { alunoTable, professorTable, userTable } from '@/server/db/schema'
import { emailService } from '@/server/lib/email-service'
import { lucia } from '@/server/lib/lucia'
import {
  LoginUserInput,
  RegisterUserInput,
  RequestPasswordResetInput,
  ResendVerificationInput,
  ResetPasswordWithTokenInput,
  SetPasswordInput,
  VerifyEmailInput,
  loginUserSchema,
  registerUserSchema,
  requestPasswordResetSchema,
  resendVerificationSchema,
  resetPasswordWithTokenSchema,
  setPasswordSchema,
  verifyEmailSchema,
} from '@/types'
import { ensureAdminRole } from '@/utils/admins'
import { env } from '@/utils/env'
import { emailToUsername } from '@/utils/username-formatter'
import { TRPCError } from '@trpc/server'
import { compare, hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { eq } from 'drizzle-orm'

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

export const authRouter = createTRPCRouter({
  register: publicProcedure.input(registerUserSchema).mutation(async ({ input }) => {
    const data: RegisterUserInput = input

    const email = normalizeEmail(data.email)
    const existingUser = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    })

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Email já cadastrado. Faça login ou utilize recuperação.',
      })
    }

    const passwordHash = await hash(data.password, SALT_ROUNDS)
    const verificationToken = randomBytes(TOKEN_LENGTH).toString('hex')
    const expires = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000)

    const [newUser] = await db
      .insert(userTable)
      .values({
        username: emailToUsername(email),
        email,
        role: data.role,
        passwordHash,
        verificationToken,
        verificationTokenExpiresAt: expires,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      })
      .returning({ id: userTable.id, email: userTable.email })

    if (data.role === 'student') {
      await db.insert(alunoTable).values({
        userId: newUser.id,
        nomeCompleto: data.name,
      } as typeof alunoTable.$inferInsert)
    } else if (data.role === 'professor') {
      await db.insert(professorTable).values({
        userId: newUser.id,
        nomeCompleto: data.name,
      } as typeof professorTable.$inferInsert)
    }

    await emailService.sendEmailVerification({
      to: newUser.email,
      verificationLink: buildVerificationLink(verificationToken),
    })

    return { success: true, message: 'Cadastro realizado. Verifique seu e-mail para ativar a conta.' }
  }),

  resendVerification: publicProcedure.input(resendVerificationSchema).mutation(async ({ input }) => {
    const data: ResendVerificationInput = input
    const email = normalizeEmail(data.email)

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    })

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' })
    }

    if (user.emailVerifiedAt) {
      return { success: true, message: 'Conta já verificada. Pode fazer login.' }
    }

    const verificationToken = randomBytes(TOKEN_LENGTH).toString('hex')
    const expires = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000)

    await db
      .update(userTable)
      .set({
        verificationToken,
        verificationTokenExpiresAt: expires,
      })
      .where(eq(userTable.id, user.id))

    await emailService.sendEmailVerification({
      to: email,
      verificationLink: buildVerificationLink(verificationToken),
    })

    return { success: true, message: 'Novo e-mail de verificação enviado.' }
  }),

  verifyEmail: publicProcedure.input(verifyEmailSchema).mutation(async ({ input }) => {
    const data: VerifyEmailInput = input

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.verificationToken, data.token),
    })

    if (!user || !user.verificationTokenExpiresAt) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Token inválido' })
    }

    if (user.emailVerifiedAt) {
      return { success: true, message: 'Conta já verificada.' }
    }

    if (user.verificationTokenExpiresAt < new Date()) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token expirado. Solicite novamente.' })
    }

    await db
      .update(userTable)
      .set({
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationTokenExpiresAt: null,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      })
      .where(eq(userTable.id, user.id))

    return { success: true, message: 'E-mail verificado com sucesso.' }
  }),

  login: publicProcedure.input(loginUserSchema).mutation(async ({ input }) => {
    const data: LoginUserInput = input
    const email = normalizeEmail(data.email)

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    })

    if (!user || !user.passwordHash) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas' })
    }

    const isValidPassword = await compare(data.password, user.passwordHash)
    if (!isValidPassword) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas' })
    }

    if (!user.emailVerifiedAt) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Verifique seu e-mail antes de entrar.' })
    }

    if (!user.passwordHash) {
      const passwordHash = await hash(data.password, SALT_ROUNDS)
      const [updatedUser] = await db
        .update(userTable)
        .set({
          passwordHash,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          verificationToken: null,
          verificationTokenExpiresAt: null,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        })
        .where(eq(userTable.id, user.id))
        .returning({ id: userTable.id, email: userTable.email })

      await ensureAdminRole(updatedUser.id, updatedUser.email)
    }

    const session = await lucia.createSession(user.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    const { cookies: getCookies } = await import('next/headers')
    const cookieStore = await getCookies()
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

    return {
      success: true,
      message: 'Login realizado com sucesso',
    }
  }),

  requestPasswordReset: publicProcedure.input(requestPasswordResetSchema).mutation(async ({ input }) => {
    const data: RequestPasswordResetInput = input
    const email = normalizeEmail(data.email)

    try {
      const user = await db.query.userTable.findFirst({
        where: eq(userTable.email, email),
      })

      if (!user) {
        // Retorna sucesso mesmo sem user (padrão de segurança)
        return {
          success: true,
          message: 'Se o e-mail existir, enviaremos instruções para redefinir a senha.',
        }
      }

      const token = randomBytes(TOKEN_LENGTH).toString('hex')
      const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000)

      await db
        .update(userTable)
        .set({
          passwordResetToken: token,
          passwordResetExpiresAt: expires,
        })
        .where(eq(userTable.id, user.id))

      const baseUrl = env.PASSWORD_RESET_URL ?? `${env.CLIENT_URL}/auth/reset`
      const url = new URL(baseUrl)
      url.searchParams.set('token', token)

      await emailService.sendPasswordResetEmail({
        to: email,
        resetLink: url.toString(),
      })

      return {
        success: true,
        message: 'Se o e-mail existir, enviaremos instruções para redefinir a senha.',
      }
    } catch (error) {
      console.error('❌ [requestPasswordReset] Erro ao processar reset de senha:', error)

      // Retorna sucesso genérico para não revelar informações
      // O erro já foi logado com detalhes pelo email-service
      return {
        success: true,
        message: 'Se o e-mail existir, enviaremos instruções para redefinir a senha.',
      }
    }
  }),

  resetPassword: publicProcedure.input(resetPasswordWithTokenSchema).mutation(async ({ input }) => {
    const data: ResetPasswordWithTokenInput = input

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.passwordResetToken, data.token),
    })

    if (!user || !user.passwordResetExpiresAt) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Token inválido' })
    }

    if (user.passwordResetExpiresAt < new Date()) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token expirado. Solicite novamente.' })
    }

    const passwordHash = await hash(data.password, SALT_ROUNDS)

    await db
      .update(userTable)
      .set({
        passwordHash,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      })
      .where(eq(userTable.id, user.id))

    await ensureAdminRole(user.id, user.email)

    return {
      success: true,
      message: 'Senha redefinida com sucesso. Você já pode fazer login.',
    }
  }),

  setPassword: protectedProcedure.input(setPasswordSchema).mutation(async ({ ctx, input }) => {
    const { user } = ctx
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const data: SetPasswordInput = input
    const dbUser = await db.query.userTable.findFirst({
      where: eq(userTable.id, user.id),
    })

    if (!dbUser) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' })
    }

    if (dbUser.passwordHash) {
      if (!data.currentPassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Informe a senha atual para alterá-la.',
        })
      }

      const isCurrentValid = await compare(data.currentPassword, dbUser.passwordHash)
      if (!isCurrentValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha atual inválida.' })
      }
    }

    const passwordHash = await hash(data.password, SALT_ROUNDS)

    await db
      .update(userTable)
      .set({
        passwordHash,
        emailVerifiedAt: dbUser.emailVerifiedAt ?? new Date(),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      })
      .where(eq(userTable.id, dbUser.id))

    await ensureAdminRole(dbUser.id, dbUser.email)

    return {
      success: true,
      message: dbUser.passwordHash ? 'Senha atualizada com sucesso.' : 'Senha criada com sucesso.',
    }
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) return { success: true }

    const { cookies: getCookies } = await import('next/headers')
    const cookieStore = await getCookies()
    const sessionCookieName = lucia.sessionCookieName
    const existingSession = cookieStore.get(sessionCookieName)
    if (existingSession?.value) {
      await lucia.invalidateSession(existingSession.value)
    }

    const blankCookie = lucia.createBlankSessionCookie()
    cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes)

    return { success: true }
  }),
})
