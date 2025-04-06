import { lucia } from '@/lib/auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppVariables } from '../../types';
import { AuthService } from './service';
import { signInSchema, signUpSchema } from './types';

export const authRoutes = new Hono<{ Variables: AppVariables }>()
  .post('/signup', zValidator('json', signUpSchema), async (c) => {
    const { email, password, role } = c.req.valid('json');
    const authService = AuthService.getInstance();

    const session = await authService.signUp(email, password, role);
    const sessionCookie = lucia.createSessionCookie(session.id);

    c.header('Set-Cookie', sessionCookie.serialize(), { append: true });
    return c.json({ message: 'Signup successful' }, 201);
  })
  .post('/signin', zValidator('json', signInSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const authService = AuthService.getInstance();

    const session = await authService.signIn(email, password);
    const sessionCookie = lucia.createSessionCookie(session.id);

    c.header('Set-Cookie', sessionCookie.serialize(), { append: true });
    return c.json({ message: 'Signin successful' });
  })
  .post('/signout', async (c) => {
    const sessionId = lucia.readSessionCookie(c.req.header('Cookie') ?? '');
    if (!sessionId) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }
    const authService = AuthService.getInstance();

    await authService.signOut(sessionId);

    const sessionCookie = lucia.createBlankSessionCookie();
    c.header('Set-Cookie', sessionCookie.serialize(), { append: true });
    return c.json({ message: 'Signout successful' });
  })
  .get('/me', async (c) => {
    const user = c.get('user')!;
    return c.json(user);
  });
