import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { userRoleEnum } from '../database/schema'; // Import the enum to get roles
import type { AppEnv } from '../types';

// Infer the Role type directly from the enum values
type Role = (typeof userRoleEnum.enumValues)[number];

/**
 * Middleware factory to ensure the user has one of the specified roles.
 * Must be placed *after* `requireAuth` middleware.
 * Throws a 403 Forbidden HTTPException if the user does not have the required role.
 *
 * @param allowedRoles - A single role or an array of roles allowed to access the route.
 */
export const requireRole = (allowedRoles: Role | Role[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (roles.length === 0) {
    // Log a warning if no roles are provided, as it effectively blocks everyone
    console.warn(
      'requireRole middleware created with an empty allowedRoles array. This will block all access to the route.',
    );
  }

  return createMiddleware<AppEnv>(async (c, next) => {
    // requireAuth middleware should have already run, guaranteeing user exists.
    // The non-null assertion (!) is safe here under that assumption.
    const user = c.get('user')!;

    // Check if the user's role is included in the allowed roles
    if (!user.role || !roles.includes(user.role)) {
      throw new HTTPException(403, {
        message: `Forbidden: Role '${user.role || '<none>'}' is not authorized. Required: ${roles.join(' or ')}.`,
      });
    }

    // User has the required role, proceed to the next middleware or handler.
    await next();
  });
};
