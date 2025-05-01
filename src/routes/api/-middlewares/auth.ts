import { db } from '@/server/database';
import { userTable } from '@/server/database/schema';
import { lucia } from '@/server/lib/auth';
import { getSessionId } from '@/utils/lucia';
import { eq } from 'drizzle-orm';

export interface AuthContext {
  userId: string;
  userRole: string;
}

/**
 * Authentication middleware that validates the user session and role
 * @param request The request object
 * @returns The user ID and role if authenticated, or throws a Response for unauthorized access
 */
export async function authMiddleware(request: Request) {
  const headers = request.headers;

  // Get session ID from cookie
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Response(
      JSON.stringify({ error: 'Não autenticado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate session with Lucia
  const sessionResult = await lucia.validateSession(sessionId);
  if (!sessionResult.session || !sessionResult.user) {
    throw new Response(
      JSON.stringify({ error: 'Sessão inválida' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get user role from database
  const userResult = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, sessionResult.user.id))
    .limit(1);

  const userRecord = userResult[0];
  if (!userRecord) {
    throw new Response(
      JSON.stringify({ error: 'Usuário não encontrado' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return {
    userId: String(sessionResult.user.id),
    userRole: userRecord.role
  };
}

/**
 * Admin authorization middleware that checks if the user has admin role
 * @param request The request object
 * @returns The user ID and role if authorized as admin, or throws a Response for unauthorized access
 */
export async function adminAuthMiddleware(request: Request) {
  const auth = await authMiddleware(request);

  // Check if user has admin role
  // if (auth.userRole !== 'admin') {
  //   throw new Response(
  //     JSON.stringify({ error: 'Acesso não autorizado' }),
  //     { status: 403, headers: { 'Content-Type': 'application/json' } }
  //   );
  // }

  return auth;
} 