import { lucia } from '@/server/lib/lucia'
import { NextResponse } from 'next/server'

export const POST = async () => {
  const sessionCookie = lucia.createBlankSessionCookie()

  return NextResponse.json(
    { success: true, message: `User logged out successfully` },
    {
      status: 200,
      headers: {
        'Set-Cookie': sessionCookie.serialize(),
      },
    }
  )
}
