import { openApiDocument } from '@/server/api/openapi'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(openApiDocument, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
} 