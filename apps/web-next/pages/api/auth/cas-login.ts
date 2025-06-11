import type { NextApiRequest, NextApiResponse } from 'next';
import { CasLoginService } from '../../../../../src/routes/api/auth/cas-login/service';

const casLoginService = new CasLoginService();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const redirectUrl = casLoginService.getRedirectUrl();
  res.writeHead(302, { Location: redirectUrl });
  res.end();
}