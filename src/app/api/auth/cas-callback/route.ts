import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'
import { env } from '@/utils/env'
import { NextResponse } from 'next/server'

// Handler for both GET and POST methods
async function handler(request: Request) {
  const url = new URL(request.url)
  const ticket = url.searchParams.get('ticket')

  if (!ticket) {
    return NextResponse.redirect(new URL('/auth/login?error=no-ticket', env.SERVER_URL))
  }

  try {
    const ctx = await createTRPCContext()
    const caller = appRouter.createCaller(ctx)
    const result = await caller.auth.casCallback({ ticket })

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${result.error || 'authentication-failed'}`, env.SERVER_URL)
      )
    }

    const redirectUrl = new URL(result.redirectUrl, env.SERVER_URL)
    const response = NextResponse.redirect(redirectUrl)

    if (result.token) {
      response.cookies.set({
        name: 'auth-token',
        value: result.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'lax',
      })
    }

    return response
  } catch (error) {
    console.error('Error processing CAS callback:', error)
    return NextResponse.redirect(new URL('/auth/login?error=server-error', env.SERVER_URL))
  }
}

// Export handlers for both GET and POST methods
export const GET = handler
export const POST = handler 