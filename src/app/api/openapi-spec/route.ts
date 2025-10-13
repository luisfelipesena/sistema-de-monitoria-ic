import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Dynamic import to avoid build-time evaluation
  const { openApiDocument } = await import('@/server/api/openapi')

  return NextResponse.json(openApiDocument, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
