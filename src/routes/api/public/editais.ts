import { db } from '@/server/database';
import { editalTable } from '@/server/database/schema';
import { createAPIHandler } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';

const log = logger.child({
  context: 'PublicEditaisAPI',
});

export const APIRoute = createAPIFileRoute('/api/public/editais')({
  GET: createAPIHandler(async () => {
    try {
      const editais = await db.query.editalTable.findMany({
        where: eq(editalTable.publicado, true),
        orderBy: (table, { desc }) => [desc(table.dataPublicacao)],
        with: {
          periodoInscricao: true,
        },
      });
      return json(editais, { status: 200 });
    } catch (error) {
      log.error(error, 'Erro ao buscar editais públicos');
      return json({ error: 'Erro ao buscar editais' }, { status: 500 });
    }
  }),
}); 