import { CasCallbackService } from '@/routes/api/auth/cas-callback/service';
import { logger } from '@/utils/logger';
import { createAPIFileRoute } from '@tanstack/react-start/api';

const log = logger.child({
  context: 'CASCallback',
});

const casCallbackService = new CasCallbackService();

export const APIRoute = createAPIFileRoute('/api/auth/cas-callback')({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const ticket = url.searchParams.get('ticket');

    if (!ticket) {
      log.error('CAS Callback: No ticket provided');
      return casCallbackService.redirectToError('NO_TICKET');
    }

    try {
      const serviceUrl = `${url.origin}${url.pathname}`;
      const serviceResponse = await casCallbackService.validateTicket(ticket, serviceUrl);

      if (serviceResponse && serviceResponse['cas:authenticationSuccess']) {
        const authSuccess = serviceResponse['cas:authenticationSuccess'];
        const username = authSuccess['cas:user'];
        const attributes = authSuccess['cas:attributes'] || {};

        return casCallbackService.handleAuthSuccess(username, attributes);
      } else if (serviceResponse && serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        log.error('CAS Authentication failed:', failure);
        return casCallbackService.redirectToError('CAS_FAILURE', failure.code || 'UNKNOWN');
      } else {
        log.error('Unexpected CAS response format:', serviceResponse);
        return casCallbackService.redirectToError('INVALID_RESPONSE');
      }
    } catch (error: any) {
      log.error(error, 'CAS validation internal error:');
      const errorMessage = error instanceof Error ? error.message : String(error);
      return casCallbackService.redirectToError('INTERNAL_ERROR', errorMessage);
    }
  },
});
