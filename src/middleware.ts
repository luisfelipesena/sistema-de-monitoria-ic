import { apiKeyTable, sessionTable, userTable } from '@/server/db/schema'
import { env } from '@/utils/env'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { verify } from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { createHash } from 'crypto'

interface TokenPayload {
  userId: number
  sessionId: string
  role: 'admin' | 'professor' | 'student'
}

const protectedRoutes = {
  admin: ['/dashboard/admin', '/home/admin'],
  professor: ['/dashboard/professor', '/home/professor'],
  student: ['/dashboard/student', '/home/student'],
  authenticated: ['/dashboard', '/home'],
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

async function verifyTokenAndSession(token: string): Promise<TokenPayload | null> {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-dev-only'
    const payload = verify(token, jwtSecret) as TokenPayload

    const database = getDb()
    const session = await database
      .select()
      .from(sessionTable)
      .where(and(eq(sessionTable.id, payload.sessionId), eq(sessionTable.userId, payload.userId)))
      .limit(1)

    if (!session.length) {
      return null
    }

    if (new Date() > session[0].expiresAt) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

async function verifyApiKey(apiKey: string): Promise<TokenPayload | null> {
  try {
    const hashedKey = createHash('sha256').update(apiKey).digest('hex')
    const database = getDb()

    // Primeiro buscar a API key
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

    // Verificar se a chave expirou
    if (record.expiresAt && new Date() > record.expiresAt) {
      return null
    }

    // Buscar o role do usuário
    const user = await database
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, record.userId))
      .limit(1)

    if (!user.length) {
      return null
    }

    // Atualizar último uso da API key
    await database.update(apiKeyTable).set({ lastUsedAt: new Date() }).where(eq(apiKeyTable.keyValue, hashedKey))

    return {
      userId: record.userId,
      sessionId: '', // API keys não têm session
      role: user[0].role as 'admin' | 'professor' | 'student',
    }
  } catch (error) {
    console.error('Erro ao verificar API key:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Para rotas de API, permitir autenticação via API key
  if (isApiRoute(pathname)) {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

    if (apiKey) {
      const payload = await verifyApiKey(apiKey)
      if (payload) {
        console.log(`🔑 Middleware: API key authentication successful for user ${payload.userId} on ${pathname}`)
        return NextResponse.next()
      }
    }

    // Se não conseguiu autenticar via API key, continuar com autenticação normal
  }

  const requiredRole = getRequiredRole(pathname)

  if (!requiredRole) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    console.log(`🔒 Middleware: No token found, redirecting to login for ${pathname}`)
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  const payload = await verifyTokenAndSession(token)

  if (!payload) {
    console.log(`🔒 Middleware: Invalid token, redirecting to login for ${pathname}`)
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/home') {
    console.log(`🔄 Middleware: Redirecting /home to /home/${payload.role}/dashboard for user ${payload.userId}`)
    return NextResponse.redirect(new URL(`/home/${payload.role}/dashboard`, request.url))
  }

  if (requiredRole === 'authenticated') {
    console.log(`✅ Middleware: User ${payload.userId} authenticated for ${pathname}`)
    return NextResponse.next()
  }

  if (payload.role !== requiredRole) {
    console.log(
      `❌ Middleware: User ${payload.userId} with role ${payload.role} denied access to ${pathname} (requires ${requiredRole})`
    )
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log(`✅ Middleware: User ${payload.userId} with role ${payload.role} granted access to ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
}
