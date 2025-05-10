import { adminAuthMiddleware } from '@/routes/api/-middlewares/auth';
import { FileListItem } from '@/routes/api/files/admin/-admin-types';
import minioClient, { bucketName } from '@/server/lib/minio';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import * as Minio from 'minio';

const log = logger.child({ context: 'AdminFileList' });

export const APIRoute = createAPIFileRoute('/api/files/admin/list')({
  GET: async ({ request }) => {
    try {
      const { userId } = await adminAuthMiddleware(request);
      log.info({ adminUserId: userId }, 'Listando arquivos para admin...');

      const objectsStream = minioClient.listObjectsV2(bucketName, undefined, true);
      const statPromises: Promise<FileListItem | null>[] = [];

      return new Promise<Response>((resolve) => {
        objectsStream.on('data', (obj: Minio.BucketItem) => {
          if (obj.name) {
            statPromises.push(
              (async () => {
                try {
                  const stat = await minioClient.statObject(bucketName, obj.name!);
                  log.info({ objectName: obj.name, size: stat.size, stat }, 'Metadados obtidos.');
                  return {
                    objectName: obj.name!,
                    size: stat.size,
                    lastModified: stat.lastModified,
                    metaData: stat.metaData,
                    originalFilename: stat.metaData['original-filename'],
                    mimeType: stat.metaData['content-type'],
                  };
                } catch (statError) {
                  log.error({ objectName: obj.name, error: statError }, 'Erro ao obter metadados do objeto MinIO');
                  return null;
                }
              })()
            );
          }
        });

        objectsStream.on('error', (err: Error) => {
          log.error(err, 'Erro ao listar objetos no MinIO');
        });

        objectsStream.on('end', async () => {
          log.info('Stream \'end\' event received. Waiting for stat promises...');
          const results = await Promise.allSettled(statPromises);
          log.info(`Stat promises settled. Count: ${results.length}`);

          const files: FileListItem[] = [];
          results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              files.push(result.value);
            } else if (result.status === 'rejected') {
              log.error({ reason: result.reason, promiseIndex: index }, 'Promise de metadados falhou.');
            }
          });

          log.info({ count: files.length, adminUserId: userId }, 'Lista de arquivos admin finalizada e retornada com sucesso.');
          resolve(new Response(JSON.stringify(files), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }));
        });
      });
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      log.error(error, 'Erro geral no processamento da listagem de arquivos admin');
      return json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  },
}); 