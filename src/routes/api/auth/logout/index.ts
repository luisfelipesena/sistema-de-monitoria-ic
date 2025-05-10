;
import { lucia } from '@/server/lib/auth';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';

export const APIRoute = createAPIFileRoute('/api/auth/logout')({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      const userId = ctx.state.user?.userId;
      const sessionCookie = lucia.createBlankSessionCookie();

      return json(
        { success: true, message: `User ${userId} logged out successfully` },
        {
          status: 200,
          headers: {
            'Set-Cookie': sessionCookie.serialize()
          },
        }
      );
    })
  ),
})
