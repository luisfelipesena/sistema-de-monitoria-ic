import { db } from '@/server/database/index';
import { userTable } from '@/server/database/schema';
import { lucia } from '@/server/lib/auth';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';
import { eq } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';

const log = logger.child({ context: 'AuthService' })

// Lista de emails admin
const ADMIN_EMAILS = ['luis.sena@ufba.br'];

export class AuthService {
  getClientLoginRedirectUrl() {
    const serviceUrl = `${env.CLIENT_URL}/auth/login`
    const redirectUrl = `${env.CAS_SERVER_URL_PREFIX}/login?service=${encodeURIComponent(serviceUrl)}`
    return redirectUrl
  }

  async handleLoginCallback(responseData: string) {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })
    const result = parser.parse(responseData)
    const serviceResponse = result['cas:serviceResponse']

    if (serviceResponse && serviceResponse['cas:authenticationFailure']) {
      const failure = serviceResponse['cas:authenticationFailure']
      log.error('CAS Authentication failed:', failure)
      throw new Error('CAS Authentication failed')
    }

    if (serviceResponse && serviceResponse['cas:authenticationSuccess']) {
      const authSuccess = serviceResponse['cas:authenticationSuccess']
      const username = authSuccess['cas:user']
      const attributes = authSuccess['cas:attributes'] || {}
      let user = await db.query.userTable.findFirst({ where: eq(userTable.username, username) })
      if (!user) {
        const email = attributes['cas:mail'] || `${username}@ufba.br`
        // Determinar o papel do usuário baseado no email
        const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'student'

        const [newUser] = await db.insert(userTable).values({ username, email, role }).returning()
        user = newUser
      }
      if (!user) {
        log.error('User ID not determined after lookup/creation.')
        throw new Error('User ID not determined after lookup/creation.')
      }
      const session = await lucia.createSession(user.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)

      log.info(`Session created for user ${user.username}, sessionId: ${session.id}`)
      return { success: true, sessionCookie }
    }

    log.error('Unexpected CAS response format:', serviceResponse)
    throw new Error('Unexpected CAS response format')
  }
}
