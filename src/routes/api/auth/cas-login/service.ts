import { env } from '@/utils/env';
import { logger } from '@/utils/logger';

const log = logger.child({
  context: 'CASLogin',
});

export class CasLoginService {
  getRedirectUrl() {
    const casServerUrlPrefix = env.CAS_SERVER_URL_PREFIX
    const serverUrl = env.SERVER_URL
    const serviceUrl = `${serverUrl}/auth/cas-callback`
    const redirectUrl = `${casServerUrlPrefix}/login?service=${encodeURIComponent(serviceUrl)}`

    return redirectUrl
  }
}
