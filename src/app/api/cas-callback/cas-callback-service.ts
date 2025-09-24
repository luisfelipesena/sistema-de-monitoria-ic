import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { lucia } from '@/server/lib/lucia'
import { ADMIN_EMAILS } from '@/utils/admins'
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

    // Configuração robusta para produção
    const axiosConfig = {
      timeout: 15000, // 15 segundos
      maxRedirects: 3,
      validateStatus: (status: number) => status < 500, // Aceita códigos 2xx, 3xx, 4xx
      headers: {
        'User-Agent': 'Sistema-Monitoria-UFBA/1.0',
        Accept: 'application/xml, text/xml, */*',
        Connection: 'keep-alive',
      },
    }

    // Implementar retry logic para problemas de rede
    const maxRetries = 3
    let lastError: Error | unknown

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log.info(`CAS validation attempt ${attempt}/${maxRetries}`)

        const response = await axios.get(validationUrl, axiosConfig)

        log.info(`CAS validation response: status=${response.status}, length=${response.data?.length || 0}`)

        if (response.status !== 200) {
          log.error(`CAS validation request failed with status ${response.status}:`, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
          })
          return this.redirectToError('CAS_HTTP_ERROR', `Status ${response.status}`)
        }

        return this.parseValidationResponse(response.data)
      } catch (error) {
        lastError = error

        // Log detalhado do erro
        if (error instanceof Error) {
          log.error(
            {
              attempt,
              maxRetries,
              errorName: error.name,
              errorMessage: error.message,
              errorCode: (error as Error & { code?: string })?.code,
              validationUrl,
              timeout: axiosConfig.timeout,
            },
            `CAS validation attempt ${attempt} failed`
          )
        }

        // Se não é a última tentativa, aguarda antes de tentar novamente
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Exponential backoff, max 5s
          log.info(`Retrying CAS validation in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // Se chegou até aqui, todas as tentativas falharam
    log.error(
      lastError instanceof Error ? lastError : new Error(String(lastError)),
      `CAS validation failed after ${maxRetries} attempts`
    )

    return this.redirectToError('CAS_NETWORK_ERROR', `Failed after ${maxRetries} attempts`)
  }

  parseValidationResponse(data: string) {
    try {
      // Log da resposta recebida para debug
      log.info(`Parsing CAS response: ${data.substring(0, 500)}${data.length > 500 ? '...' : ''}`)

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        parseTagValue: true,
        trimValues: true,
      })

      const result = parser.parse(data)
      const serviceResponse = result['cas:serviceResponse']

      if (!serviceResponse) {
        log.error('No cas:serviceResponse found in parsed XML', { result })
        throw new Error('Invalid CAS response format: missing cas:serviceResponse')
      }

      log.info('CAS response parsed successfully:', {
        hasAuthSuccess: !!serviceResponse['cas:authenticationSuccess'],
        hasAuthFailure: !!serviceResponse['cas:authenticationFailure'],
      })

      return serviceResponse
    } catch (error) {
      log.error(error instanceof Error ? error : new Error(String(error)), 'Failed to parse CAS validation response', {
        dataLength: data?.length,
        dataPreview: data?.substring(0, 200),
      })
      throw error
    }
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
