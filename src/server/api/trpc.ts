import { db } from '@/server/db'
import { apiKeyTable, sessionTable, User, userTable } from '@/server/db/schema'
import { LUCIA_SESSION_COOKIE_NAME } from '@/utils/utils'
import { initTRPC, TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import superjson from 'superjson'
import { type OpenApiMeta } from 'trpc-to-openapi'
import { ZodError } from 'zod'
import { createHash } from 'crypto'

interface TRPCContext {
  user: User | null
  db: typeof db
}

const authenticateWithApiKey = async (apiKey: string): Promise<User | null> => {
  if (!apiKey) return null

  // Hash da API key fornecida para comparar com o banco
  const hashedKey = createHash('sha256').update(apiKey).digest('hex')

  // Buscar a API key no banco
  const apiKeyRecord = await db.query.apiKeyTable.findFirst({
    where: and(eq(apiKeyTable.keyValue, hashedKey), eq(apiKeyTable.isActive, true)),
    with: {
      user: true,
    },
  })

  if (!apiKeyRecord) return null

  // Verificar se a chave expirou
  if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
    return null
  }

  // Atualizar último uso
  await db.update(apiKeyTable).set({ lastUsedAt: new Date() }).where(eq(apiKeyTable.id, apiKeyRecord.id))

  return apiKeyRecord.user
}

export const createTRPCContext = async (): Promise<TRPCContext> => {
  // Primeiro tentar autenticação via API key
  const headersList = await headers()
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '')

  if (apiKey) {
    const user = await authenticateWithApiKey(apiKey)
    if (user) {
      return { user, db }
    }
  }

  // Se não encontrou API key válida, tentar autenticação via cookie/sessão
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(LUCIA_SESSION_COOKIE_NAME)?.value
  if (!sessionId) {
    return {
      user: null,
      db,
    }
  }

  const session = await db.query.sessionTable.findFirst({
    where: and(eq(sessionTable.id, sessionId)),
  })

  if (!session) {
    return {
      user: null,
      db,
    }
  }

  const user = await db.query.userTable.findFirst({
    where: and(eq(userTable.id, session?.userId)),
  })

  if (!user) {
    return {
      user: null,
      db,
    }
  }

  return {
    user,
    db,
  }
}

const t = initTRPC
  .context<TRPCContext>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      }
    },
  })

export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({ ctx: { ...ctx, user: ctx.user } })
})

export const adminProtectedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({ ctx: { ...ctx, user: ctx.user } })
})

export const createTRPCRouter = t.router
