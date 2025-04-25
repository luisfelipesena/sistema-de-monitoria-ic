import { lucia } from '@/server/lib/auth';
import type { Session, User } from 'lucia';
import { eventHandler, getCookie, H3Error } from 'vinxi/http';

// This function would ideally be a reusable middleware
async function validateSession(
  event: any,
): Promise<{ user: User; session: Session } | { user: null; session: null }> {
  const sessionId = getCookie(event, lucia.sessionCookieName);
  if (!sessionId) {
    return { user: null, session: null };
  }

  const result = await lucia.validateSession(sessionId);
  // Refresh session cookie if needed
  if (result.session && result.session.fresh) {
    const sessionCookie = lucia.createSessionCookie(result.session.id);
    event.node.res.appendHeader('Set-Cookie', sessionCookie.serialize());
  }
  // Invalidate client-side cookie if session is invalid
  if (!result.session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    event.node.res.appendHeader('Set-Cookie', sessionCookie.serialize());
  }
  return result;
}

export default eventHandler(async (event) => {
  const { user } = await validateSession(event);

  if (!user) {
    const error = new H3Error('Unauthorized');
    error.statusCode = 401;
    throw error; // Throw error to be handled by Vinxi/Nitro error handling
    // Or return a specific response: return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  // Return only the necessary user attributes defined in lucia config
  return { authenticated: true, user };
});
