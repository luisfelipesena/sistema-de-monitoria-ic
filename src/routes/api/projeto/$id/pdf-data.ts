import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { getProjectPdfData } from '@/server/lib/pdf-generation';
import { db } from '@/server/database';

const log = logger.child({
  context: 'ProjetoPDFDataAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/pdf-data')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      const { id } = ctx.params;
      const projectId = parseInt(id, 10);

      if (isNaN(projectId)) {
        return json({ error: 'ID do projeto inválido' }, { status: 400 });
      }

      try {
        const pdfData = await getProjectPdfData(projectId, db);
        
        log.info({ projectId }, 'Dados do PDF buscados com sucesso');
        return json(pdfData, { status: 200 });
      } catch (error: any) {
        log.error(error, `Erro ao buscar dados do PDF do projeto ${projectId}`);
        return json({ error: 'Erro interno ao buscar dados do PDF' }, { status: 500 });
      }
    }),
  ),
}); 