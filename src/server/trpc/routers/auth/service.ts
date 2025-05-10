import { db } from '@/server/database/index';
import { userTable } from '@/server/database/schema';
import { lucia } from '@/server/lib/auth';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';
import { eq } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';

const log = logger.child({ context: 'AuthService' })

export class AuthService {
  getClientLoginRedirectUrl() {
    const serviceUrl = `${env.CLIENT_URL}/auth/login`
    const redirectUrl = `${env.CAS_SERVER_URL_PREFIX}/login?service=${encodeURIComponent(serviceUrl)}`
    return redirectUrl
  }

  async handleLoginCallback(responseData: string, cookies: any) {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })
    const result = parser.parse(responseData)
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
        throw new Error('User ID not determined after lookup/creation.')
      }
      const session = await lucia.createSession(user.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)
      cookies.setCookie(sessionCookie)

      log.info(`Session created for user ${user.username}, sessionId: ${session.id}`)
      return { success: true, sessionCookie }
    }
    if (serviceResponse && serviceResponse['cas:authenticationFailure']) {
      const failure = serviceResponse['cas:authenticationFailure']
      log.error('CAS Authentication failed:', failure)
      throw new Error('CAS Authentication failed')
    }
    log.error('Unexpected CAS response format:', serviceResponse)
    throw new Error('Unexpected CAS response format')
  }
}
