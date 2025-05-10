import { env } from '@/utils/env';
export class AuthService {
  getLoginRedirectUrl() {
    const casServerUrlPrefix = env.CAS_SERVER_URL_PREFIX
    const serverUrl = env.SERVER_URL
    const serviceUrl = `${serverUrl}/trpc/auth/cas-callback`
    const redirectUrl = `${casServerUrlPrefix}/login?service=${encodeURIComponent(serviceUrl)}`
    return redirectUrl
  }
}
