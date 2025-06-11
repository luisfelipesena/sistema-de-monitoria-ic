import { env } from '@/utils/env'

export class CasLoginService {
  getRedirectUrl() {
    const casServerUrlPrefix = env.CAS_SERVER_URL_PREFIX
    const serverUrl = env.SERVER_URL
    const serviceUrl = `${serverUrl}/cas-callback`
    console.log('serviceUrl', serviceUrl)
    const redirectUrl = `${casServerUrlPrefix}/login?service=${encodeURIComponent(serviceUrl)}`
    console.log('redirectUrl', redirectUrl)
    return redirectUrl
  }
}
