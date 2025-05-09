import { lucia } from '@/server/lib/auth';
import { logger } from '@/utils/logger';
import { getSessionId } from '@/utils/lucia';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';

const log = logger.child({
  context: 'Me',
});

export const APIRoute = createAPIFileRoute('/api/auth/me')({
  GET: async (params) => {
    const {
      request: { headers },
    } = params;
    const sessionId = getSessionId(headers);
    if (!sessionId) {
      return json(null, { status: 401 });
    }

    try {
      const result = await lucia.validateSession(sessionId);
      if (!result.session || !result.user) {
        const sessionCookie = lucia.createBlankSessionCookie();
        return json(null, {
          status: 401,
          headers: {
            'Set-Cookie': sessionCookie.serialize(),
          },
        });
      }

      return json(result.user);
    } catch (error) {
      return json(null, { status: 401 });
    }
  },
});
