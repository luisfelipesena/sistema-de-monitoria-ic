import { CasCallbackService } from '@/routes/api/auth/cas-callback/service';
import { logger } from '@/utils/logger';
import { createAPIFileRoute } from '@tanstack/react-start/api';

const log = logger.child({
  context: 'CASCallback',
});

const casCallbackService = new CasCallbackService();

export const APIRoute = createAPIFileRoute('/api/auth/cas-callback')({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const ticket = url.searchParams.get('ticket');

      if (!ticket) {
        log.error('CAS Callback: No ticket provided');
        return new Response('No ticket provided', { status: 500, statusText: 'No ticket provided' });
      }


      const serviceUrl = `${url.origin}${url.pathname}`;
      const serviceResponse = await casCallbackService.validateTicket(ticket, serviceUrl);

      if (serviceResponse && serviceResponse['cas:authenticationSuccess']) {
        const authSuccess = serviceResponse['cas:authenticationSuccess'];
        const username = authSuccess['cas:user'];
        const attributes = authSuccess['cas:attributes'] || {};

        return await casCallbackService.handleAuthSuccess(username, attributes);
      }

      if (serviceResponse && serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        log.error('CAS Authentication failed:', failure);
        return new Response(failure, { status: 500, statusText: failure });
      }

      log.error('Unexpected CAS response format:', serviceResponse);
      return new Response('Unexpected CAS response format', { status: 500, statusText: 'Unexpected CAS response format' });
    } catch (error: any) {
      log.error(error, 'CAS validation internal error:');
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(errorMessage, { status: 500, statusText: errorMessage });
    }
  },
});
