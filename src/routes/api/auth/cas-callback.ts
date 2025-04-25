import { db } from '@/server/database';
import { userTable } from '@/server/database/schema';
import { lucia } from '@/server/lib/auth';
import { env } from '@/utils/env'; // Assuming env config is centralized
import { createAPIFileRoute } from '@tanstack/react-start/api';
import axios from 'axios';
import { eq } from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';

export const APIRoute = createAPIFileRoute('/api/auth/cas-callback')({
  GET: async ({ request }) => {
    const casServerUrlPrefix = env.CAS_SERVER_URL_PREFIX
    // Use CLIENT_URL as the base for the callback
    const clientUrl = env.CLIENT_URL

    const url = new URL(request.url);
    const ticket = url.searchParams.get('ticket');

    const redirectToError = (code: string, detail?: string) => {
      const errorUrl = new URL(`${clientUrl}/auth-error`);
      errorUrl.searchParams.set('code', code);
      if (detail) {
        errorUrl.searchParams.set('detail', detail);
      }
      return new Response(null, {
        status: 302,
        headers: {
          Location: errorUrl.toString(),
        },
      });
    };

    if (!ticket) {
      console.error('CAS Callback: No ticket provided');
      return redirectToError('NO_TICKET');
    }

    try {
      // Construct the service URL *exactly* as it was sent to the /login endpoint.
      // It should be the base callback URL without any query parameters.
      const serviceUrl = `${url.origin}${url.pathname}`;
      const validationUrl = `${casServerUrlPrefix}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(serviceUrl)}`;

      console.log(`Validating CAS ticket: ${ticket} at ${validationUrl}`);
      const response = await axios.get(validationUrl, {
        // Ensure axios doesn't throw on non-2xx responses from CAS
        validateStatus: (status) => status >= 200 && status < 500,
      });

      if (response.status !== 200) {
        console.error(
          `CAS validation request failed with status ${response.status}:`,
          response.data,
        );
        return redirectToError('CAS_HTTP_ERROR', `Status ${response.status}`);
      }

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      });
      const result = parser.parse(response.data);
      const serviceResponse = result['cas:serviceResponse'];

      if (serviceResponse && serviceResponse['cas:authenticationSuccess']) {
        const authSuccess = serviceResponse['cas:authenticationSuccess'];
        const username = authSuccess['cas:user'];
        const attributes = authSuccess['cas:attributes'] || {};

        console.log(`CAS Success for user: ${username}`);

        let userId: number;

        const existingUser = await db.query.userTable.findFirst({
          where: eq(userTable.username, username),
        });

        if (existingUser) {
          console.log(
            `Found existing user: ${username}, ID: ${existingUser.id}`,
          );
          userId = existingUser.id;
        } else {
          console.log(`Creating new user: ${username}`);
          const email = attributes['cas:mail'] || `${username}@ufba.br`; // Default email
          const [newUser] = await db
            .insert(userTable)
            .values({
              username: username,
              email: email,
              role: 'student', // Default role
            })
            .returning({ id: userTable.id });
          if (!newUser) {
            // Handle potential insert failure (though unlikely with returning)
            console.error('Failed to create new user after insert attempt.');
            return redirectToError('USER_CREATION_FAILED');
          }
          userId = newUser.id;
        }

        if (!userId) {
          // This case should theoretically not be reached if logic above is sound
          console.error('User ID not determined after lookup/creation.');
          return redirectToError('USER_ID_MISSING');
        }

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);

        console.log(`Session created: ${session.id}`);

        // Format the cookie string correctly
        const cookieString = `${sessionCookie.name}=${sessionCookie.value}; Path=${sessionCookie.attributes.path}; ${sessionCookie.attributes.httpOnly ? 'HttpOnly;' : ''} ${sessionCookie.attributes.secure ? 'Secure;' : ''} SameSite=${sessionCookie.attributes.sameSite}`; // Add other attributes as needed (Max-Age, etc.)

        // Redirect to the frontend callback page with the session cookie
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${clientUrl}/auth/cas-callback`, // Client-side route
            'Set-Cookie': cookieString,
          },
        });
      } else if (serviceResponse && serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        console.error('CAS Authentication failed:', failure);
        return redirectToError('CAS_FAILURE', failure.code || 'UNKNOWN');
      } else {
        console.error('Unexpected CAS response format:', response.data);
        return redirectToError('INVALID_RESPONSE');
      }
    } catch (error: any) {
      console.error('CAS validation internal error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return redirectToError('INTERNAL_ERROR', errorMessage);
    }
  },
});
