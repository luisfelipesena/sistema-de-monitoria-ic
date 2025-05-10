import { lucia } from '@/server/lib/auth';
import cookie from 'cookie';

export const getSessionId = (headers: Headers) => {
  const cookies = cookie.parse(headers.get('Cookie') || '');
  const sessionId = cookies[lucia.sessionCookieName];
  return sessionId;
};
