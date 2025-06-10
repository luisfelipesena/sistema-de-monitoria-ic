import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'
import { env } from '@/utils/env'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const ctx = await createTRPCContext()
    const caller = appRouter.createCaller(ctx)
    const result = await caller.auth.casLogin()
    return NextResponse.redirect(result.redirectUrl)
  } catch (error) {
    console.error('Error initiating CAS login:', error)
    return NextResponse.redirect(new URL('/auth/login?error=cas-login-failed', env.SERVER_URL))
  }
} 