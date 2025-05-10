import { db } from '@/server/database/index';
import { userTable } from '@/server/database/schema';
import { lucia } from '@/server/lib/auth';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';
import { eq } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';

const log = logger.child({ context: 'AuthService' })

export class AuthService {
  getLoginRedirectUrl() {
    const casServerUrlPrefix = env.CAS_SERVER_URL_PREFIX
    const clientUrl = env.CLIENT_URL
    const serviceUrl = `${clientUrl}/auth/cas-callback`
    const redirectUrl = `${casServerUrlPrefix}/login?service=${encodeURIComponent(serviceUrl)}`
    return redirectUrl
  }

  async handleCasCallback(ticket: string, serviceUrl: string, cookies: any) {
    const casServerUrlPrefix = env.CAS_SERVER_URL_PREFIX
    const validationUrl = `${casServerUrlPrefix}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(serviceUrl)}`
    const response = await fetch(validationUrl)
    const data = await response.text()
    if (response.status !== 200) {
      log.error(`CAS validation request failed with status ${response.status}:`, data)
      return { success: false, error: 'CAS_HTTP_ERROR' }
    }
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })
    const result = parser.parse(data)
    const serviceResponse = result['cas:serviceResponse']
    if (serviceResponse && serviceResponse['cas:authenticationSuccess']) {
      const authSuccess = serviceResponse['cas:authenticationSuccess']
      const username = authSuccess['cas:user']
      const attributes = authSuccess['cas:attributes'] || {}
      let user = await db.query.userTable.findFirst({ where: eq(userTable.username, username) })
      if (!user) {
        const email = attributes['cas:mail'] || `${username}@ufba.br`
        const [newUser] = await db.insert(userTable).values({ username, email, role: 'student' }).returning()
        user = newUser
      }
      if (!user) {
        log.error('User ID not determined after lookup/creation.')
        return { success: false, error: 'USER_ID_MISSING' }
      }
      const session = await lucia.createSession(user.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)
      cookies.setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      return { success: true }
    }
    if (serviceResponse && serviceResponse['cas:authenticationFailure']) {
      const failure = serviceResponse['cas:authenticationFailure']
      log.error('CAS Authentication failed:', failure)
      return { success: false, error: 'CAS_AUTHENTICATION_FAILURE' }
    }
    log.error('Unexpected CAS response format:', serviceResponse)
    return { success: false, error: 'UNEXPECTED_CAS_RESPONSE_FORMAT' }
  }
}
