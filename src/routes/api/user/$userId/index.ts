import { updateUserRoleSchema } from '@/routes/api/user/-types';
import { db } from '@/server/database';
import { userTable } from '@/server/database/schema';
import { createAPIHandler, withRoleMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'UserAPIItem', // Differentiating context from the collection UserAPI
});

export const APIRoute = createAPIFileRoute('/api/user/$userId')({
  // GET a specific user - might not be strictly necessary if GET /api/user provides enough
  // GET: createAPIHandler(
  //   withRoleMiddleware(['admin'], async ({ params }) => {
  //     try {
  //       const userId = Number(params.userId);
  //       if (isNaN(userId)) {
  //         return json({ error: 'ID de usuário inválido' }, { status: 400 });
  //       }
  //       const user = await db.query.userTable.findFirst({
  //         where: eq(userTable.id, userId),
  //         columns: {
  //           id: true,
  //           username: true,
  //           email: true,
  //           role: true,
  //         },
  //       });

  //       if (!user) {
  //         return json({ error: 'Usuário não encontrado' }, { status: 404 });
  //       }
  //       return json(user);
  //     } catch (error) {
  //       log.error({ error }, 'Erro ao buscar usuário');
  //       return json({ error: 'Erro ao buscar usuário' }, { status: 500 });
  //     }
  //   })
  // ),

  // Update a user's role
  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const userId = Number(ctx.params.userId);
        if (isNaN(userId)) {
          return json({ error: 'ID de usuário inválido' }, { status: 400 });
        }

        const body = await ctx.request.json();
        const validatedData = updateUserRoleSchema.parse(body);

        // Prevent admin from removing their own admin role accidentally if they are the sole admin?
        // This logic can be complex, for now, we allow it.
        // Consider also if a user can change their own role - typically no, only admin does.

        const result = await db
          .update(userTable)
          .set({
            role: validatedData.role,
            // updatedAt: new Date(), // If you have an updatedAt field in userTable
          })
          .where(eq(userTable.id, userId))
          .returning({
            id: userTable.id,
            username: userTable.username,
            email: userTable.email,
            role: userTable.role,
          });

        if (!result.length) {
          return json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return json(result[0]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 }
          );
        }
        log.error(
          {
            message: error instanceof Error ? error.message : 'Unknown error',
            errorObject: error,
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Erro ao atualizar papel do usuário'
        );
        return json(
          {
            error: 'Erro ao atualizar papel do usuário',
            details:
              error instanceof Error ? error.message : 'Unknown error details',
          },
          { status: 500 }
        );
      }
    })
  ),

  // Delete a user
  DELETE: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const userId = Number(ctx.params.userId);
        if (isNaN(userId)) {
          return json({ error: 'ID de usuário inválido' }, { status: 400 });
        }

        // Prevent admin from deleting themselves? This might be important.
        // For example: if (ctx.state.user.id === userId) return json({ error: 'Não pode deletar a si mesmo'}, { status: 403});

        const result = await db
          .delete(userTable)
          .where(eq(userTable.id, userId))
          .returning({ id: userTable.id });

        if (!result.length) {
          return json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return json({ message: 'Usuário removido com sucesso' });
      } catch (error) {
        log.error(
          {
            message: error instanceof Error ? error.message : 'Unknown error',
            errorObject: error,
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Erro ao excluir usuário'
        );
        return json(
          {
            error: 'Erro ao excluir usuário',
            details:
              error instanceof Error ? error.message : 'Unknown error details',
          },
          { status: 500 }
        );
      }
    })
  ),
}); 