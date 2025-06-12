import { apiKeyTable, sessionTable, userTable } from '@/server/db/schema'
import { env } from '@/utils/env'
import { LUCIA_SESSION_COOKIE_NAME } from '@/utils/utils'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { createHash } from 'crypto'

interface SessionPayload {
  userId: number
  role: 'admin' | 'professor' | 'student'
}

const protectedRoutes = {
  admin: ['/home/admin'],
  professor: ['/home/professor'],
  student: ['/home/student'],
  authenticated: ['/home'],
}

const publicRoutes = ['/', '/auth', '/editais', '/onboarding', '/profile']
const apiRoutes = ['/api/openapi', '/api/trpc']

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route))
}

function isApiRoute(pathname: string): boolean {
  return apiRoutes.some((route) => pathname.startsWith(route))
}

function getRequiredRole(pathname: string): 'admin' | 'professor' | 'student' | 'authenticated' | null {
  if (protectedRoutes.admin.some((route) => pathname.startsWith(route))) {
    return 'admin'
  }
  if (protectedRoutes.professor.some((route) => pathname.startsWith(route))) {
    return 'professor'
  }
  if (protectedRoutes.student.some((route) => pathname.startsWith(route))) {
    return 'student'
  }
  if (protectedRoutes.authenticated.some((route) => pathname.startsWith(route))) {
    return 'authenticated'
  }
  return null
}

let db: ReturnType<typeof drizzle> | null = null

function getDb() {
  if (!db) {
    const client = postgres(env.DATABASE_URL)
    db = drizzle(client)
  }
  return db
}

async function verifySession(sessionId: string): Promise<SessionPayload | null> {
  try {
    const database = getDb()

    const sessionResult = await database
      .select({
        userId: sessionTable.userId,
        expiresAt: sessionTable.expiresAt,
        role: userTable.role,
      })
      .from(sessionTable)
      .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
      .where(eq(sessionTable.id, sessionId))
      .limit(1)

    if (!sessionResult.length) {
      return null
    }

    const session = sessionResult[0]

    if (new Date() > session.expiresAt) {
      await database.delete(sessionTable).where(eq(sessionTable.id, sessionId))
      return null
    }

    return {
      userId: session.userId,
      role: session.role as 'admin' | 'professor' | 'student',
    }
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return null
  }
}

async function verifyApiKey(apiKey: string): Promise<SessionPayload | null> {
  try {
    const hashedKey = createHash('sha256').update(apiKey).digest('hex')
    const database = getDb()

    const apiKeyRecord = await database
      .select({
        userId: apiKeyTable.userId,
        isActive: apiKeyTable.isActive,
        expiresAt: apiKeyTable.expiresAt,
      })
      .from(apiKeyTable)
      .where(and(eq(apiKeyTable.keyValue, hashedKey), eq(apiKeyTable.isActive, true)))
      .limit(1)

    if (!apiKeyRecord.length) {
      return null
    }

    const record = apiKeyRecord[0]

    if (record.expiresAt && new Date() > record.expiresAt) {
      return null
    }

    const user = await database
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, record.userId))
      .limit(1)

    if (!user.length) {
      return null
    }

    await database.update(apiKeyTable).set({ lastUsedAt: new Date() }).where(eq(apiKeyTable.keyValue, hashedKey))

    return {
      userId: record.userId,
      role: user[0].role as 'admin' | 'professor' | 'student',
    }
  } catch (error) {
    console.error('Erro ao verificar API key:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`🔍 Middleware: Processing ${pathname}`)

  if (isPublicRoute(pathname)) {
    console.log(`🌐 Middleware: Public route ${pathname}, allowing access`)
    return NextResponse.next()
  }

  if (isApiRoute(pathname)) {
    console.log(`🔌 Middleware: API route ${pathname}`)
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

    if (apiKey) {
      const payload = await verifyApiKey(apiKey)
      if (payload) {
        console.log(`🔑 Middleware: API key authentication successful for user ${payload.userId} on ${pathname}`)
        return NextResponse.next()
      }
    }
  }

  const requiredRole = getRequiredRole(pathname)
  console.log(`🔐 Middleware: Required role for ${pathname}: ${requiredRole}`)

  if (!requiredRole) {
    console.log(`📂 Middleware: No role required for ${pathname}, allowing access`)
    return NextResponse.next()
  }

  const sessionId = request.cookies.get(LUCIA_SESSION_COOKIE_NAME)?.value
  console.log(`🍪 Middleware: Session cookie ${LUCIA_SESSION_COOKIE_NAME}: ${sessionId ? 'present' : 'missing'}`)

  if (!sessionId) {
    console.log(`🔒 Middleware: No session found, redirecting to login for ${pathname}`)
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  const payload = await verifySession(sessionId)
  console.log(
    `👤 Middleware: Session verification result: ${payload ? `User ${payload.userId} with role ${payload.role}` : 'invalid'}`
  )

  if (!payload) {
    console.log(`🔒 Middleware: Invalid session, redirecting to login for ${pathname}`)
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  if (pathname === '/home') {
    const dashboardPath = `/home/${payload.role}/dashboard`
    console.log(`🔄 Middleware: Redirecting /home to ${dashboardPath} for user ${payload.userId}`)
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  if (requiredRole === 'authenticated') {
    console.log(`✅ Middleware: User ${payload.userId} authenticated for ${pathname}`)
    return NextResponse.next()
  }

  if (payload.role !== requiredRole) {
    console.log(
      `❌ Middleware: User ${payload.userId} with role ${payload.role} denied access to ${pathname} (requires ${requiredRole})`
    )
    const dashboardPath = `/home/${payload.role}/dashboard`
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  console.log(`✅ Middleware: User ${payload.userId} with role ${payload.role} granted access to ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|static|.*\\..*).*)'],
}
