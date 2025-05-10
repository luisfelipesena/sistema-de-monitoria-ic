import minioClient, { bucketName } from '@/server/lib/minio';
import { createAPIHandler, withRoleMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({ context: 'AdminFilePresignedUrl' });

const presignedUrlBodySchema = z.object({
  objectName: z.string().min(1, 'Nome do objeto é obrigatório'),
});

export const presignedUrlResponseSchema = z.object({
  url: z.string().min(1, 'URL é obrigatória'),
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
  mimeType: z.string().min(1, 'Tipo de mídia é obrigatório'),
});

export type PresignedUrlBody = z.infer<typeof presignedUrlBodySchema>;
export type PresignedUrlResponse = z.infer<typeof presignedUrlResponseSchema>;

export const APIRoute = createAPIFileRoute('/api/files/admin/presigned-url')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const userId = ctx.state.user.userId;

        let body;
        try {
          body = await ctx.request.clone().json();
        } catch (e) {
          return json({ error: 'Corpo da requisição inválido (não é JSON)' }, { status: 400 });
        }

        const validation = presignedUrlBodySchema.safeParse(body);
        if (!validation.success) {
          return json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }
        const { objectName } = validation.data;

        log.info({ adminUserId: userId, objectName }, 'Gerando URL pré-assinada...');

        const stat = await minioClient.statObject(bucketName, objectName);
        const originalFilename = stat.metaData['original-filename'] || objectName.split('/').pop();
        const mimeType = stat.metaData['content-type'] || 'application/octet-stream';

        const url = await minioClient.presignedGetObject(bucketName, objectName, 60 * 60);

        const response: PresignedUrlResponse = {
          url,
          fileName: originalFilename,
          mimeType,
        };

        log.info({ response }, 'URL pré-assinada gerada.');
        return json(response, { status: 200 });

      } catch (error) {
        if (error instanceof Response) {
          return error;
        }

        // Handle specific MinIO errors (e.g., file not found)
        if (error instanceof Error && (error.message.includes('NoSuchKey') || (error as any).code === 'NoSuchKey')) {
          log.warn({ error }, 'Tentativa de gerar URL para arquivo não encontrado');
          return json({ error: 'Arquivo não encontrado no bucket' }, { status: 404 });
        }
        log.error(error, 'Erro ao gerar URL pré-assinada');
        return json({ error: 'Erro interno do servidor ao gerar URL' }, { status: 500 });
      }
    })
  ),
}); 