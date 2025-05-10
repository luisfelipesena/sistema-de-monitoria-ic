import { db } from '@/server/database';
import { userTable } from '@/server/database/schema';
import { lucia } from '@/server/lib/auth';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';
const log = logger.child({
  context: 'CASCallback',
});

export class CasCallbackService {
  redirectToError(code: string, detail?: string) {
    const clientUrl = env.CLIENT_URL
    const errorUrl = new URL(`${clientUrl}`);
    errorUrl.searchParams.set('code', code);
    if (detail) {
      errorUrl.searchParams.set('detail', detail);
    }
    return json(null, {
      status: 302,
      headers: {
        Location: errorUrl.toString(),
      },
    });
  }

  async validateTicket(ticket: string, serviceUrl: string) {
    const casServerUrlPrefix = env.CAS_SERVER_URL_PREFIX;
    const validationUrl = `${casServerUrlPrefix}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(serviceUrl)}`;

    log.info(`Validating CAS ticket: ${ticket} at ${validationUrl}`);
    const response = await fetch(validationUrl);
    const data = await response.text();

    if (response.status !== 200) {
      log.error(`CAS validation request failed with status ${response.status}:`, data);
      return this.redirectToError('CAS_HTTP_ERROR', `Status ${response.status}`);
    }

    return this.parseValidationResponse(data);
  }

  parseValidationResponse(data: string) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    const result = parser.parse(data);
    return result['cas:serviceResponse'];
  }

  async handleAuthSuccess(username: string, attributes: Record<string, string>) {
    log.info(`CAS Success for user: ${username}`);
    const userId = await this.getOrCreateUser(username, attributes);

    if (!userId) {
      log.error('User ID not determined after lookup/creation.');
      return this.redirectToError('USER_ID_MISSING');
    }

    return this.createSession(userId);
  }

  async getOrCreateUser(username: string, attributes: Record<string, string>) {
    const existingUser = await db.query.userTable.findFirst({
      where: eq(userTable.username, username),
    });

    if (existingUser) {
      log.info(`Found existing user: ${username}, ID: ${existingUser.id}`);
      return existingUser.id;
    }

    log.info(`Creating new user: ${username}`);
    const email = attributes['cas:mail'] || `${username}@ufba.br`;
    const [newUser] = await db
      .insert(userTable)
      .values({
        username: username,
        email: email,
        role: 'student',
      })
      .returning({ id: userTable.id });

    if (!newUser) {
      log.error('Failed to create new user after insert attempt.');
      return null;
    }

    return newUser.id;
  }

  async createSession(userId: number) {
    const clientUrl = env.CLIENT_URL;
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    log.info(`Session created: ${session.id}`);

    return json(null, {
      status: 302,
      headers: {
        Location: `${clientUrl}/auth/cas-callback`,
        'Set-Cookie': sessionCookie.serialize(),
      },
    });
  }
}
