import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { CasCallbackService } from './cas-callback-service'

const log = logger.child({
  module: 'cas-callback',
})

const casCallbackService = new CasCallbackService()
export const GET = async (req: NextRequest) => {
  const url = new URL(req.url)
  const { searchParams } = url
  const ticket = searchParams.get('ticket')

  if (!ticket) {
    log.error('CAS Callback: No ticket provided')
    return NextResponse.json({ error: 'No ticket provided' }, { status: 500, statusText: 'No ticket provided' })
  }

  const serviceUrl = `${url.origin}${url.pathname}`
  const serviceResponse = await casCallbackService.validateTicket(ticket, serviceUrl)
  if (serviceResponse?.['cas:authenticationSuccess']) {
    const authSuccess = serviceResponse['cas:authenticationSuccess']
    const username = authSuccess['cas:user']
    const attributes = authSuccess['cas:attributes'] || {}
    return await casCallbackService.handleAuthSuccess(username, attributes)
  }

  if (serviceResponse?.['cas:authenticationFailure']) {
    const failure = serviceResponse['cas:authenticationFailure']
    log.error('CAS Authentication failed:', failure)
    return NextResponse.json(failure, { status: 500, statusText: failure })
  }

  log.error('Unexpected CAS response format:', serviceResponse)
  return NextResponse.json(
    { error: 'Unexpected CAS response format' },
    { status: 500, statusText: 'Unexpected CAS response format' }
  )
}
