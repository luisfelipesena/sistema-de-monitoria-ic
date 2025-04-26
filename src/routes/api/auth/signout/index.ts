import { lucia } from '@/server/lib/auth';
import { logger } from '@/utils/logger';
import { getSessionId } from '@/utils/lucia';
import { createAPIFileRoute } from '@tanstack/react-start/api';

const log = logger.child({
  context: 'signout',
});

export const APIRoute = createAPIFileRoute('/api/auth/signout')({
  GET: async (params) => {
    const { request: { headers } } = params;
    const sessionId = getSessionId(headers);
    if (!sessionId) {
      return new Response(JSON.stringify({ message: 'No session cookie' }));
    }

    const result = await lucia.validateSession(sessionId);
    if (!result.session) {
      return new Response(JSON.stringify({ message: 'No session cookie' }));
    }

    await lucia.invalidateSession(sessionId);

    return new Response(JSON.stringify({ message: 'Signed out successfully' }));
  },
});