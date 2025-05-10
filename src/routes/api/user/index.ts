import { db } from '@/server/database';
import { createAPIHandler, withRoleMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
// We don't need the types here for GET all, but good practice if we add POST later
// import { apiUserSchema, UserListResponse } from '@/routes/api/user/-types';

const log = logger.child({
  context: 'UserAPI',
});

export const APIRoute = createAPIFileRoute('/api/user')({
  // Listar todos os usuários
  GET: createAPIHandler(
    withRoleMiddleware(['admin'], async () => {
      try {
        const users = await db.query.userTable.findMany({
          columns: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
          orderBy: (users, { asc }) => [asc(users.username)],
        });

        // At this point, 'users' matches the structure expected by ApiUser / UserListResponse
        return json(users);
      } catch (error) {
        log.error(
          {
            message: error instanceof Error ? error.message : 'Unknown error',
            errorObject: error,
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Erro ao buscar usuários'
        );
        return json(
          {
            error: 'Erro ao buscar usuários',
            details:
              error instanceof Error ? error.message : 'Unknown error details',
          },
          { status: 500 }
        );
      }
    })
  ),
  // POST for creating users can be added here if needed in the future.
  // For now, user creation is assumed to be handled by CAS authentication flow.
}); 