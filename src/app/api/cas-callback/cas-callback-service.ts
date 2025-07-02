import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { lucia } from '@/server/lib/lucia'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import axios from 'axios'
import { eq } from 'drizzle-orm'
import { XMLParser } from 'fast-xml-parser'
import { NextResponse } from 'next/server'

const log = logger.child({
  context: 'CASCallback',
})

export class CasCallbackService {
  redirectToError(code: string, detail?: string) {
    const clientUrl = env.CLIENT_URL
    const errorUrl = new URL(`${clientUrl}`)
    errorUrl.searchParams.set('code', code)
    if (detail) {
      errorUrl.searchParams.set('detail', detail)
    }
    return NextResponse.json(null, {
      status: 302,
      headers: {
        Location: errorUrl.toString(),
      },
    })
  }

  async validateTicket(ticket: string) {
    const casServerUrlPrefix = env.CAS_SERVER_URL_PREFIX
    const serverUrl = env.SERVER_URL
    const serviceUrl = `${serverUrl}/cas-callback`
    const validationUrl = `${casServerUrlPrefix}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(serviceUrl)}`

    log.info(`Validating CAS ticket: ${ticket} at ${validationUrl}`)

    try {
      const response = await axios.get(validationUrl)

      if (response.status !== 200) {
        log.error(`CAS validation request failed with status ${response.status}:`, response.data)
        return this.redirectToError('CAS_HTTP_ERROR', `Status ${response.status}`)
      }

      return this.parseValidationResponse(response.data)
    } catch (error) {
      log.error('CAS validation failed:', error)
      return this.redirectToError('CAS_NETWORK_ERROR')
    }
  }

  parseValidationResponse(data: string) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    })
    const result = parser.parse(data)
    return result['cas:serviceResponse']
  }

  async handleAuthSuccess(username: string, attributes: Record<string, string>) {
    const userData = await this.getOrCreateUser(username, attributes)
    log.info(`User ID: ${userData.id}, Role: ${userData.role}`)

    if (!userData.id) {
      return this.redirectToError('USER_ID_MISSING')
    }

    return this.createSession(userData.id, userData.role)
  }

  async getOrCreateUser(username: string, attributes: Record<string, string>) {
    const existingUser = await db.query.userTable.findFirst({
      where: eq(userTable.username, username),
    })

    if (existingUser) {
      log.info(`Found existing user: ${username}, ID: ${existingUser.id}`)

      const ADMIN_EMAILS = ['luis.sena@ufba.br', 'joao.leahy@ufba.br', 'antoniels@ufba.br', 'caioviana@ufba.br', 'felipecg@ufba.br']

      if (ADMIN_EMAILS.includes(existingUser.email)) {
        const [updatedUser] = await db
          .update(userTable)
          .set({
            role: 'admin',
          })
          .where(eq(userTable.id, existingUser.id))
          .returning({ id: userTable.id, role: userTable.role })

        return { id: updatedUser.id, role: updatedUser.role }
      }

      return { id: existingUser.id, role: existingUser.role }
    }

    log.info(`Creating new user: ${username}`)
    const email = attributes['cas:mail'] || `${username}@ufba.br`
    const [newUser] = await db
      .insert(userTable)
      .values({
        username: username,
        email: email,
        role: 'student',
      })
      .returning({ id: userTable.id, role: userTable.role })

    if (!newUser) {
      log.error('Failed to create new user after insert attempt.')
      return { id: null, role: null }
    }

    return { id: newUser.id, role: newUser.role }
  }

  async createSession(userId: number, userRole: string) {
    const clientUrl = env.CLIENT_URL
    log.info(`Creating session for user: ${userId}`)
    const session = await lucia.createSession(userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    log.info(`Session created: ${session.id}`)

    const dashboardUrl = `${clientUrl}/home/${userRole}/dashboard`
    log.info(`Redirecting to dashboard: ${dashboardUrl}`)

    return NextResponse.json(null, {
      status: 302,
      headers: {
        Location: dashboardUrl,
        'Set-Cookie': sessionCookie.serialize(),
      },
    })
  }
}
