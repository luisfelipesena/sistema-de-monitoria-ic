import { db } from '@/server/database';
import { userTable } from '@/server/database/schema';
import { lucia } from '@/server/lib/auth';
import { logger } from '@/utils/logger';
import { getSessionId } from '@/utils/lucia';
import { json } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { User } from 'lucia';
import { AppState, createMiddleware } from '.';

const log = logger.child({
  context: 'auth middleware',
});


/**
 * Authentication middleware for checking if a user is authenticated
 * This middleware adapts the existing Lucia auth system to our middleware pattern
 */
export const requireAuth = createMiddleware<AppState>(async (ctx, next) => {
  try {
    // Get session ID from cookie
    const sessionId = getSessionId(ctx.request.headers);
    if (!sessionId) {
      return json(
        { error: 'Não autenticado' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate session with Lucia
    const sessionResult = await lucia.validateSession(sessionId);
    if (!sessionResult.session || !sessionResult.user) {
      return json(
        { error: 'Sessão inválida' },
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
      return json(
        { error: 'Usuário não encontrado' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // We know these values are valid based on our schema
    const role = userRecord.role as 'admin' | 'professor' | 'student';

    // Set properly typed user in state
    ctx.state.user = {
      ...sessionResult.user,
      userId: String(sessionResult.user.id),
      role
    };

    return next();
  } catch (error) {
    log.error({ error }, 'Authentication error');
    return json(
      { error: 'Erro de autenticação' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Role-based authorization middleware
 * @param allowedRoles Array of role names that are permitted to access the resource
 */
export const requireRole = (allowedRoles: string[]) => {
  return createMiddleware<AppState>(async (ctx, next) => {
    // Ensure user is authenticated
    if (!ctx.state.user) {
      return json(
        { error: 'Não autenticado' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has one of the allowed roles
    const { role } = ctx.state.user;

    if (!allowedRoles.includes(role)) {
      return json(
        { error: 'Acesso não autorizado' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Continue to the next middleware or route handler
    return next();
  });
};

/**
 * Standalone authentication function that can be used outside of middleware context
 * This maintains compatibility with code that was using the old implementation
 */
export async function validateAuth(request: Request): Promise<User> {
  // Get session ID from cookie
  const sessionId = getSessionId(request.headers);
  if (!sessionId) {
    throw json(
      { error: 'Não autenticado' },
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate session with Lucia
  const sessionResult = await lucia.validateSession(sessionId);
  if (!sessionResult.session || !sessionResult.user) {
    throw json(
      { error: 'Sessão inválida' },
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
    throw json(
      { error: 'Usuário não encontrado' },
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return sessionResult.user;
} 