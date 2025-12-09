import { db } from '@/server/db'
import { createPublicPdfService } from '@/server/services/public-pdf/public-pdf-service'
import { logger } from '@/utils/logger'
import { NextResponse } from 'next/server'

const log = logger.child({ context: 'PublicPdfAPI' })

/**
 * Public endpoint to access project PDFs via token.
 * This endpoint is unauthenticated and validates access via the token itself.
 *
 * Usage: GET /api/public/projeto-pdf/{token}
 *
 * Query params:
 *   - download=true: Force download instead of inline viewing
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { searchParams } = new URL(request.url)
    const forceDownload = searchParams.get('download') === 'true'

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    const service = createPublicPdfService(db)

    try {
      const result = await service.getPresignedUrlByToken(token)

      log.info({ token: `${token.substring(0, 8)}...`, projeto: result.projeto.titulo }, 'Public PDF access successful')

      // Redirect to presigned URL
      const redirectUrl = forceDownload ? `${result.url}&response-content-disposition=attachment` : result.url

      return NextResponse.redirect(redirectUrl, { status: 302 })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Token expirado')) {
          return NextResponse.json(
            {
              error: 'Token expirado',
              message: 'Este link de acesso expirou. Solicite um novo link ao administrador.',
            },
            { status: 410 } // Gone
          )
        }
        if (error.message.includes('não encontrado') || error.message.includes('Token')) {
          return NextResponse.json(
            {
              error: 'Token inválido',
              message: 'Este link de acesso não é válido ou foi revogado.',
            },
            { status: 404 }
          )
        }
      }
      throw error
    }
  } catch (error) {
    log.error(error, 'Error in public PDF access')
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * HEAD request to check if token is valid without downloading.
 */
export async function HEAD(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params

    if (!token) {
      return new NextResponse(null, { status: 400 })
    }

    const service = createPublicPdfService(db)

    try {
      await service.getPresignedUrlByToken(token)
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
        },
      })
    } catch {
      return new NextResponse(null, { status: 404 })
    }
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
