import { db } from '@/server/db'
import { sessionTable, userTable } from '@/server/db/schema'
import { UserRole } from '@/types/enums'
import { env } from '@/utils/env'
import { TRPCError, initTRPC } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'
import superjson from 'superjson'
import { type OpenApiMeta } from 'trpc-to-openapi'
import { ZodError } from 'zod'

interface User {
  id: number
  role: UserRole
}

interface AuthContext {
  user: User | null
  db: typeof db
}

export const createInnerTRPCContext = (opts: { user: User | null, database: typeof db }): AuthContext => {
  return {
    user: opts.user,
    db: opts.database,
  }
}

export const createTRPCContext = async (): Promise<AuthContext> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return createInnerTRPCContext({ user: null, database: db })
  }

  try {
    const payload = verify(token, env.JWT_SECRET) as {
      userId: number
      sessionId: string
      role: UserRole
    }

    const session = await db.query.sessionTable.findFirst({
      where: and(eq(sessionTable.id, payload.sessionId), eq(sessionTable.userId, payload.userId)),
    })

    if (!session || new Date() > session.expiresAt) {
      return createInnerTRPCContext({ user: null, database: db })
    }

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.id, payload.userId),
    })

    if (!user) {
      return createInnerTRPCContext({ user: null, database: db })
    }

    return createInnerTRPCContext({ user: { id: user.id, role: payload.role }, database: db })
  } catch (_error) {
    return createInnerTRPCContext({ user: null, database: db })
  }
}

export const t = initTRPC.context<typeof createTRPCContext>().meta<OpenApiMeta>().create({
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

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  if (ctx.user.role !== UserRole.ADMIN) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You must be an admin to perform this action.' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

export const adminProcedure = t.procedure.use(enforceUserIsAdmin)
