import { env } from '@/config/env';
import { userTable } from '@/database/schema';
import { lucia } from '@/lib/auth';
import logger from '@/lib/logger';
import axios from 'axios';
import { eq } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';
import { Hono } from 'hono';
import type { AppVariables } from '../../types';

export const authRoutes = new Hono<{ Variables: AppVariables }>()
  .get('/cas-login', async (c) => {
    const redirectUrl = `${env.CAS_SERVER_URL_PREFIX}/login?service=${encodeURIComponent(
      `${env.SERVER_NAME}/auth/cas-callback`,
    )}`;

    return c.redirect(redirectUrl);
  })
  .get('/cas-callback', async (c) => {
    const ticket = c.req.query('ticket');
    if (!ticket) {
      return c.json({ error: 'No CAS ticket provided' }, 400);
    }

    try {
      const validationUrl = `${env.CAS_SERVER_URL_PREFIX}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(
        `${env.SERVER_NAME}/auth/cas-callback`,
      )}`;

      const response = await axios.get(validationUrl);

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      });

      const result = parser.parse(response.data);

      const serviceResponse = result['cas:serviceResponse'];
      if (serviceResponse['cas:authenticationSuccess']) {
        const authSuccess = serviceResponse['cas:authenticationSuccess'];
        const username = authSuccess['cas:user'];
        const attributes = authSuccess['cas:attributes'] || {};

        const existingUser = await c.get('db').query.userTable.findFirst({
          where: eq(userTable.username, username),
        });

        let userId;

        if (!existingUser) {
          const email = attributes['cas:mail'] || `${username}@ufba.br`;

          const [newUser] = await c
            .get('db')
            .insert(userTable)
            .values({
              username: username,
              email: email,
              role: 'student',
            })
            .returning({ id: userTable.id });
          userId = newUser.id;
        } else {
          userId = existingUser.id;
        }

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        c.header('Set-Cookie', sessionCookie.serialize(), { append: true });

        return c.redirect(`${env.CLIENT_URL}/auth/cas-callback`);
      } else if (serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        logger.error('CAS Authentication failed:', failure);
        return c.json(
          { error: 'Authentication failed', details: failure },
          401,
        );
      } else {
        logger.error('Unexpected CAS response format');
        return c.json({ error: 'Invalid CAS server response' }, 500);
      }
    } catch (error) {
      logger.error('CAS validation error:', error);
      return c.json(
        { message: 'CAS validation error', error: String(error) },
        500,
      );
    }
  })
  .get('/signout', async (c) => {
    const sessionId = lucia.readSessionCookie(c.req.header('Cookie') ?? '');
    if (!sessionId) {
      return c.json({ message: 'No session found' }, 401);
    }
    await lucia.invalidateSession(sessionId);
    const sessionCookie = lucia.createBlankSessionCookie();
    c.header('Set-Cookie', sessionCookie.serialize(), { append: true });

    return c.json({ message: 'Signed out successfully' });
  })
  .get('/me', async (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ authenticated: false }, 401);
    }
    return c.json(user);
  });
