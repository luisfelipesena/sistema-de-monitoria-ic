import { lucia } from '@/server/lib/lucia'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const handler = async () => {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(lucia.sessionCookieName)
  const sessionId = sessionCookie?.value ?? null

  if (sessionId) {
    const { session } = await lucia.validateSession(sessionId)

    if (session) {
      await lucia.invalidateSession(session.id)
    }
  }

  const blank = lucia.createBlankSessionCookie()

  const returnTo = process.env.CLIENT_URL ?? 'http://localhost:3000/'
  const casLogout = `${process.env.CAS_SERVER_URL_PREFIX}/logout?url=${encodeURIComponent(returnTo)}`

  const res = NextResponse.redirect(casLogout, 303)
  res.headers.set(
    'Set-Cookie',
    // biome-ignore lint/suspicious/noExplicitAny: No explicit any
    typeof (blank as any).serialize === 'function'
      // biome-ignore lint/suspicious/noExplicitAny: No explicit any
      ? (blank as any).serialize()
      : `${blank.name}=${blank.value}; Path=${blank.attributes.path ?? '/'}; Max-Age=0; HttpOnly; SameSite=${blank.attributes.sameSite ?? 'Lax'}${blank.attributes.secure ? '; Secure' : ''
      }`
  )
  return res
}

export const GET = handler
export const POST = handler
