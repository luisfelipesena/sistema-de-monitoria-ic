import { authMiddleware } from '@/routes/api/-middlewares/auth';
import minioClient, { bucketName } from '@/server/lib/minio';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import * as Minio from 'minio';

const log = logger.child({
  context: 'FileAccess',
});

interface RouteParams {
  fileId: string;
}

export const APIRoute = createAPIFileRoute('/api/files/access/$fileId')({
  GET: async ({ request, params }) => {
    try {
      await authMiddleware(request);

      const { fileId } = params as RouteParams;
      if (!fileId) {
        return json({ error: 'ID do arquivo não fornecido' }, { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Listar objetos no bucket para encontrar o arquivo pelo fileId no nome
      const objectsStream = minioClient.listObjects(bucketName, undefined, true);

      let foundObject: Minio.BucketItem | null = null;

      return new Promise<Response>((resolve, reject) => {
        objectsStream.on('data', (obj: Minio.BucketItem) => {
          // Verificar se o nome do objeto contém o fileId
          if (obj.name && obj.name.includes(fileId)) {
            foundObject = obj;
          }
        });

        objectsStream.on('error', (err: Error) => {
          log.error(err, 'Erro ao listar objetos no MinIO');
          resolve(new Response(JSON.stringify({ error: 'Erro ao buscar o arquivo' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }));
        });

        objectsStream.on('end', async () => {
          if (!foundObject || !foundObject.name) {
            return resolve(new Response(JSON.stringify({ error: 'Arquivo não encontrado' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            }));
          }

          try {
            // Obter metadados do objeto
            const stat = await minioClient.statObject(bucketName, foundObject.name);

            // Extrair informações dos metadados
            const originalFilename = stat.metaData['x-amz-meta-original-filename'] || 'arquivo';
            const mimeType = stat.metaData['content-type'] || 'application/octet-stream';

            // Gerar URL pré-assinada com validade de 1 hora
            const url = await minioClient.presignedGetObject(bucketName, foundObject.name, 60 * 60);

            resolve(json({
              url,
              fileName: originalFilename,
              mimeType,
              fileSize: stat.size,
            }, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }));
          } catch (error) {
            log.error(error, 'Erro ao obter URL pré-assinada');
            resolve(json({ error: 'Erro ao gerar link de acesso ao arquivo' }, {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }));
          }
        });
      });
    } catch (error) {
      log.error(error, 'Erro no processamento do acesso ao arquivo');
      return json({ error: 'Erro interno do servidor' }, { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },
}); 