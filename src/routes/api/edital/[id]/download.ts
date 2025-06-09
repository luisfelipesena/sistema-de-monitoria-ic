import { db } from '@/server/database';
import { editalTable } from '@/server/database/schema';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import minioClient, { bucketName } from '@/server/lib/minio';

const log = logger.child({
  context: 'EditalDownloadAPI',
});

const paramsSchema = z.object({
  id: z.string().transform(Number),
});

export const APIRoute = createAPIFileRoute('/api/edital/[id]/download')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const { id: editalId } = paramsSchema.parse(ctx.params);

        // Buscar edital
        const edital = await db.query.editalTable.findFirst({
          where: eq(editalTable.id, editalId),
          with: {
            periodoInscricao: true,
          },
        });

        if (!edital) {
          return new Response('Edital não encontrado', { status: 404 });
        }

        // Verificar se há arquivo disponível
        if (!edital.fileIdAssinado) {
          return new Response('Arquivo do edital não encontrado', { status: 404 });
        }

        // Buscar arquivo no MinIO
        const fileStream = await minioClient.getObject(bucketName, edital.fileIdAssinado);
        
        // Converter stream para buffer
        const chunks: Buffer[] = [];
        for await (const chunk of fileStream) {
          chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        log.info({ editalId, fileId: edital.fileIdAssinado }, 'Edital baixado com sucesso');

        // Retornar arquivo
        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="edital-${edital.numeroEdital}.pdf"`,
            'Content-Length': fileBuffer.length.toString(),
          },
        });

      } catch (error) {
        if (error instanceof z.ZodError) {
          return new Response('ID do edital inválido', { status: 400 });
        }
        
        log.error(error, 'Erro ao baixar edital');
        return new Response('Erro interno ao baixar edital', { status: 500 });
      }
    }),
  ),
}); 