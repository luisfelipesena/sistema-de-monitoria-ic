import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { CasCallbackService } from './cas-callback-service'

export const dynamic = 'force-dynamic'

const log = logger.child({
  module: 'cas-callback',
})

const casCallbackService = new CasCallbackService()
export const GET = async (req: NextRequest) => {
  const url = new URL(req.url)
  const { searchParams } = url
  const ticket = searchParams.get('ticket')

  log.info(
    {
      url: req.url,
      hasTicket: !!ticket,
      userAgent: req.headers.get('user-agent'),
      referer: req.headers.get('referer'),
    },
    'CAS callback initiated'
  )

  if (!ticket) {
    log.error('CAS Callback: No ticket provided')
    return NextResponse.json({ error: 'No ticket provided' }, { status: 400, statusText: 'No ticket provided' })
  }

  try {
    const serviceResponse = await casCallbackService.validateTicket(ticket)

    // Se validateTicket retornou um NextResponse (erro), retorna diretamente
    if (serviceResponse instanceof NextResponse) {
      return serviceResponse
    }

    if (serviceResponse?.['cas:authenticationSuccess']) {
      const authSuccess = serviceResponse['cas:authenticationSuccess']
      const username = authSuccess['cas:user']
      const attributes = authSuccess['cas:attributes'] || {}

      log.info(
        {
          username,
          hasAttributes: Object.keys(attributes).length > 0,
        },
        'CAS authentication successful'
      )

      return await casCallbackService.handleAuthSuccess(username, attributes)
    }

    if (serviceResponse?.['cas:authenticationFailure']) {
      const failure = serviceResponse['cas:authenticationFailure']
      log.error('CAS Authentication failed:', failure)
      return NextResponse.json(
        { error: 'Authentication failed', details: failure },
        { status: 401, statusText: 'Authentication failed' }
      )
    }

    log.error('Unexpected CAS response format:', serviceResponse)
    return NextResponse.json(
      { error: 'Unexpected CAS response format', response: serviceResponse },
      { status: 500, statusText: 'Unexpected CAS response format' }
    )
  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)), 'CAS callback processing failed')
    return NextResponse.json(
      { error: 'CAS callback processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500, statusText: 'Internal server error' }
    )
  }
}
