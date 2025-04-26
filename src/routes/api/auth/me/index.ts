import { lucia } from '@/server/lib/auth';
import { logger } from '@/utils/logger';
import { getSessionId } from '@/utils/lucia';
import { createAPIFileRoute } from '@tanstack/react-start/api';

const log = logger.child({
  context: 'Me',
});

export const APIRoute = createAPIFileRoute('/api/auth/me')({
  GET: async (params) => {
    const { request: { headers } } = params;
    const sessionId = getSessionId(headers);
    if (!sessionId) {
      return new Response(JSON.stringify({ authenticated: false, user: null }));
    }

    const result = await lucia.validateSession(sessionId);
    if (!result.session) {
      return new Response(JSON.stringify({ authenticated: false, user: null }));
    }

    const user = result.user

    return new Response(JSON.stringify({ authenticated: true, user }));
  },
});

