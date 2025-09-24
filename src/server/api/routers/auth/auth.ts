import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { emailService } from '@/server/lib/email-service'
import { lucia } from '@/server/lib/lucia'
import {
  LoginUserInput,
  RegisterUserInput,
  ResendVerificationInput,
  VerifyEmailInput,
  loginUserSchema,
  registerUserSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from '@/types'
import { env } from '@/utils/env'
import { TRPCError } from '@trpc/server'
import { compare, hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { eq } from 'drizzle-orm'

const SALT_ROUNDS = 12
const TOKEN_LENGTH = 48
const TOKEN_EXPIRATION_HOURS = 24

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
        username: data.name,
        email,
        role: data.role,
        passwordHash,
        verificationToken,
        verificationTokenExpiresAt: expires,
      })
      .returning({ id: userTable.id, email: userTable.email })

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
