import { db } from '@/server/database';
import { professorTable } from '@/server/database/schema';
import { lucia } from '@/server/lib/auth';
import { getSessionId } from '@/utils/lucia';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';

export const APIRoute = createAPIFileRoute('/api/professor')({
  async GET(params) {
    const {
      request: { headers },
    } = params;
    const sessionId = getSessionId(headers);
    if (!sessionId) return new Response(null, { status: 401 });
    const result = await lucia.validateSession(sessionId);
    if (!result.session || !result.user)
      return new Response(null, { status: 401 });
    if (result.user.role !== 'professor')
      return new Response(null, { status: 403 });
    const professor = await db.query.professorTable.findFirst({
      where: eq(professorTable.userId, result.user.id),
    });
    if (!professor) return new Response(JSON.stringify({}), { status: 200 });
    return new Response(JSON.stringify(professor), { status: 200 });
  },
});
