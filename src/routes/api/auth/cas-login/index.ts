'use client';

import { CasLoginService } from '@/routes/api/auth/cas-login/service';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';

const log = logger.child({
  context: 'CASLogin',
});

const casLoginService = new CasLoginService();

export const APIRoute = createAPIFileRoute('/api/auth/cas-login')({
  GET: async () => {
    const redirectUrl = casLoginService.getRedirectUrl();

    log.info(`Redirecting to CAS: ${redirectUrl}`)
    return json(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    })
  },
}) 