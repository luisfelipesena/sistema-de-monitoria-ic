import { sessionTable } from '@/server/db/schema'
import { env } from '@/utils/env'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { verify } from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

interface TokenPayload {
  userId: number
  sessionId: string
  role: 'admin' | 'professor' | 'student'
}

const protectedRoutes = {
  admin: ['/dashboard/admin'],
  professor: ['/dashboard/professor'],
  student: ['/dashboard/student'],
  authenticated: ['/dashboard'],
}

const publicRoutes = ['/', '/auth', '/editais', '/onboarding', '/profile']

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route))
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
      .where(
        and(
          eq(sessionTable.id, payload.sessionId),
          eq(sessionTable.userId, payload.userId)
        )
      )
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
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

  if (requiredRole === 'authenticated') {
    console.log(`✅ Middleware: User ${payload.userId} authenticated for ${pathname}`)
    return NextResponse.next()
  }

  if (payload.role !== requiredRole) {
    console.log(`❌ Middleware: User ${payload.userId} with role ${payload.role} denied access to ${pathname} (requires ${requiredRole})`)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log(`✅ Middleware: User ${payload.userId} with role ${payload.role} granted access to ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}
