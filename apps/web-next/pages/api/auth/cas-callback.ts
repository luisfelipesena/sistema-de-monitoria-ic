import type { NextApiRequest, NextApiResponse } from 'next';
import { CasCallbackService } from '../../../../../src/routes/api/auth/cas-callback/service';

const casCallbackService = new CasCallbackService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const ticket = url.searchParams.get('ticket');

  if (!ticket) {
    res.status(400).json({ error: 'No ticket provided' });
    return;
  }

  const serviceUrl = `${url.origin}${url.pathname}`;
  const response = await casCallbackService.validateTicket(ticket, serviceUrl);

  // casCallbackService returns Response object (Fetch). Convert to Next res
  const body = await response.text();
  const headers = Object.fromEntries(response.headers.entries());
  res.writeHead(response.status, headers);
  res.end(body);
}