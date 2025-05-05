import { lucia } from '@/server/lib/auth';
import { logger } from '@/utils/logger';
import { getSessionId } from '@/utils/lucia';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';

const log = logger.child({
  context: 'signout',
});

export const APIRoute = createAPIFileRoute('/api/auth/signout')({
  GET: async (params) => {
    const { request: { headers } } = params;
    const sessionId = getSessionId(headers);
    if (!sessionId) {
      return json({ message: 'No session cookie' }, { status: 401 });
    }

    const result = await lucia.validateSession(sessionId);
    if (!result.session) {
      return json({ message: 'No session cookie' }, { status: 401 });
    }

    await lucia.invalidateSession(sessionId);

    return json({ message: 'Signed out successfully' }, { status: 200 });
  },
});