import { lucia } from "@/server/lib/auth";

export const getSessionId = (headers: Headers) => {
  const sessionId = headers.get('Cookie')?.split('; ').find(row => row.startsWith(lucia.sessionCookieName))?.split('=')[1];
  return sessionId;
}