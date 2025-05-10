'use client';
;
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';

export const APIRoute = createAPIFileRoute('/api/auth/me')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      return json(ctx.state.user);
    })
  ),
}) 