import { db } from '@/server/database';
import { disciplinaProfessorResponsavelTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';

export const APIRoute = createAPIFileRoute('/api/professor/disciplinas/$id')({
  DELETE: createAPIHandler(
    withRoleMiddleware(['professor'], async (ctx) => {
      const { id } = ctx.params;

      const deleted = await db
        .delete(disciplinaProfessorResponsavelTable)
        .where(
          eq(disciplinaProfessorResponsavelTable.id, parseInt(id as string))
        )
        .returning();

      if (!deleted.length) {
        return json({ error: 'Association not found' }, { status: 404 });
      }

      return json({ success: true });
    })
  ),
}); 