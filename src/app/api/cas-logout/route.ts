import { db } from '@/server/db'
import { lucia } from '@/server/lib/lucia'
import { env } from '@/utils/env'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const handler = async () => {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(lucia.sessionCookieName)
  const sessionId = sessionCookie?.value ?? null

  if (!sessionId) {
    return NextResponse.redirect('/auth/login', 303)
  }

  const { session } = await lucia.validateSession(sessionId)

  if (!session) {
    return NextResponse.redirect('/auth/login', 303)
  }

  const user = await db.query.userTable.findFirst({ where: (fields, { eq }) => eq(fields.id, session.userId) })

  await lucia.invalidateSession(session.id)
  const blank = lucia.createBlankSessionCookie()
  const serializedBlankCookie =
    typeof (blank as { serialize?: () => string }).serialize === 'function'
      ? blank.serialize()
      : `${blank.name}=${blank.value}; Path=${blank.attributes.path ?? '/'}; Max-Age=0; HttpOnly; SameSite=${blank.attributes.sameSite ?? 'Lax'}${
          blank.attributes.secure ? '; Secure' : ''
        }`

  const redirectUrl = !user?.passwordHash
    ? `${env.CAS_SERVER_URL_PREFIX}/logout?url=${encodeURIComponent(env.CLIENT_URL ?? 'http://localhost:3000/')}`
    : '/auth/login'

  const response = NextResponse.redirect(redirectUrl, 303)
  response.headers.set('Set-Cookie', serializedBlankCookie)
  return response
}

export const GET = handler
export const POST = handler
