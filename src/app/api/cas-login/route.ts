import { logger } from '@/utils/logger'
import { NextResponse } from 'next/server'
import { CasLoginService } from './cas-login-service'

export const dynamic = 'force-dynamic'

const log = logger.child({
  module: 'cas-login',
})

const casLoginService = new CasLoginService()

export const GET = async () => {
  const redirectUrl = casLoginService.getRedirectUrl()

  log.info(`Redirecting to CAS: ${redirectUrl}`)
  return NextResponse.json(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
    },
  })
}
