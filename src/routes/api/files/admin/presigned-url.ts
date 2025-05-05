import { adminAuthMiddleware } from '@/routes/api/-middlewares/auth';
import minioClient, { bucketName } from '@/server/lib/minio';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({ context: 'AdminFilePresignedUrl' });

const urlBodySchema = z.object({
  objectName: z.string().min(1, 'Nome do objeto é obrigatório'),
});

export const APIRoute = createAPIFileRoute('/api/files/admin/presigned-url')({
  POST: async ({ request }) => {
    try {
      const { userId } = await adminAuthMiddleware(request);

      let body;
      try {
        body = await request.clone().json();
      } catch (e) {
        return json({ error: 'Corpo da requisição inválido (não é JSON)' }, { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const validation = urlBodySchema.safeParse(body);
      if (!validation.success) {
        return json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const { objectName } = validation.data;

      log.info({ adminUserId: userId, objectName }, 'Gerando URL pré-assinada...');

      const stat = await minioClient.statObject(bucketName, objectName);
      const originalFilename = stat.metaData['original-filename'] || objectName.split('/').pop()
      const mimeType = stat.metaData['content-type'] || 'application/octet-stream';

      const url = await minioClient.presignedGetObject(bucketName, objectName, 60 * 60);

      log.info({ adminUserId: userId, objectName }, 'URL pré-assinada gerada.');

      return json({
        url,
        fileName: originalFilename,
        mimeType,
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      // Handle specific MinIO errors (e.g., file not found)
      if (error instanceof Error && (error.message.includes('NoSuchKey') || (error as any).code === 'NoSuchKey')) {
        log.warn({ error }, 'Tentativa de gerar URL para arquivo não encontrado');
        return json({ error: 'Arquivo não encontrado no bucket' }, { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      log.error(error, 'Erro ao gerar URL pré-assinada');
      return json({ error: 'Erro interno do servidor ao gerar URL' }, { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },
}); 