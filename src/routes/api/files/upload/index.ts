import { authMiddleware } from '@/routes/api/-middlewares/auth';
import minioClient, { bucketName, ensureBucketExists } from '@/server/lib/minio';
import { logger } from '@/utils/logger';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

const log = logger.child({
  context: 'FileUpload',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export const APIRoute = createAPIFileRoute('/api/files/upload')({
  POST: async ({ request }) => {
    try {
      const { userId } = await authMiddleware(request);
      await ensureBucketExists();

      const formData = await request.formData();
      const file = formData.get('file') as File;
      const entityType = formData.get('entityType') as string;
      const entityId = formData.get('entityId') as string;

      if (!file || !entityType || !entityId) {
        return new Response(JSON.stringify({ error: 'Arquivo, tipo de entidade ou ID de entidade não fornecidos' }), {
          status: 400,
        });
      }

      try {
        const fileId = uuidv4();
        const originalFilename = file.name;
        const extension = path.extname(originalFilename);
        const metaData = {
          'Content-Type': file.type || 'application/octet-stream',
          'X-Amz-Meta-Entity-Type': entityType,
          'X-Amz-Meta-Entity-Id': entityId,
          'X-Amz-Meta-User-Id': String(userId),
          'X-Amz-Meta-Original-Filename': originalFilename,
        };

        // Caminho no MinIO: entityType/entityId/fileId-originalFilename
        const objectName = `${entityType}/${entityId}/${fileId}${extension}`;

        // Converter File para buffer/stream
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileStream = Readable.from(buffer);

        await minioClient.putObject(
          bucketName,
          objectName,
          fileStream,
          buffer.length,
          metaData
        );

        log.info({
          fileId,
          objectName,
          entityType,
          entityId,
          userId,
        }, 'Arquivo enviado com sucesso');

        return new Response(JSON.stringify({
          fileId,
          fileName: originalFilename,
          mimeType: file.type,
          fileSize: file.size,
        }), {
          status: 200,
        });
      } catch (error) {
        log.error(error, 'Erro ao enviar arquivo para MinIO');
        return new Response(JSON.stringify({ error: 'Erro ao salvar o arquivo' }), {
          status: 500,
        });
      }
    } catch (error) {
      log.error(error, 'Erro no processamento do upload');
      return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
        status: 500,
      });
    }
  },
}); 