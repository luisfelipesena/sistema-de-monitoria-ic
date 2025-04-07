import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { env } from '../../config/env';
import { sendTestEmail } from './index';

/**
 * Email routes - for testing purposes only, should be protected or removed in production
 */
export const emailRouter = new Hono().post(
  '/test',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      name: z.string(),
    }),
  ),
  async (c) => {
    // This endpoint is for testing only, ensure it's properly secured in production
    // Should be disabled or protected with proper authentication
    if (env.NODE_ENV === 'production') {
      return c.json({ error: 'Not available in production' }, 403);
    }

    const { email, name } = c.req.valid('json');
    const result = await sendTestEmail(email, name);

    if (!result.success) {
      return c.json(
        { error: 'Failed to send email', details: result.error },
        500,
      );
    }

    return c.json({
      success: true,
      message: 'Test email sent successfully',
      data: result.data,
    });
  },
);
