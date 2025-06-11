import { type NextApiRequest, type NextApiResponse } from 'next';
import { parse } from 'cookie';
import { JwtUser, Context } from './trpc';

export async function createContext({ req, res }: { req: NextApiRequest; res: NextApiResponse }): Promise<Context> {
  // TODO: integrate lucia session cookie verification; stub for now
  const cookies = parse(req.headers.cookie || '');
  const sessionId = cookies['auth_session'];

  let user: JwtUser | null = null;
  if (sessionId) {
    // placeholder: call existing backend to get user
    // Could fetch `/api/auth/me` locally but avoid recursive; for now null
  }

  return {
    user,
  };
}