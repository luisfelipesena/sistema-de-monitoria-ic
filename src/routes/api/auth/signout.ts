import { lucia } from '@/server/lib/auth';
import { eventHandler, getCookie, setCookie } from 'vinxi/http';

export default eventHandler(async (event) => {
  const sessionId = getCookie(event, lucia.sessionCookieName);

  if (!sessionId) {
    // No session to invalidate, but proceed to clear cookie client-side anyway
    console.log('Signout attempt with no session cookie.');
  } else {
    try {
      await lucia.invalidateSession(sessionId);
      console.log(`Session invalidated: ${sessionId}`);
    } catch (error) {
      // Log error but still proceed to clear cookie
      console.error(`Error invalidating session ${sessionId}:`, error);
    }
  }

  // Always create and set a blank session cookie to remove it from the browser
  const sessionCookie = lucia.createBlankSessionCookie();
  setCookie(
    event,
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  console.log('Blank session cookie set.');
  return { message: 'Signed out successfully' };
  // Optionally, send a redirect: return sendRedirect(event, '/', 302);
});
