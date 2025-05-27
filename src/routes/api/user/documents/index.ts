import minioClient, { bucketName } from '@/server/lib/minio';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import * as Minio from 'minio';

const log = logger.child({
  context: 'UserDocumentsAPI',
});

interface UserDocument {
  id: string;
  name: string;
  type: 'historico_escolar' | 'comprovante_matricula';
  fileId?: string;
  fileName?: string;
  uploadDate?: Date;
  status: 'missing' | 'valid' | 'expired';
  needsUpdate?: boolean;
}

export const APIRoute = createAPIFileRoute('/api/user/documents')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const userId = ctx.state.user.userId;

        // Buscar documentos no MinIO para este usuário
        const objectsStream = minioClient.listObjects(
          bucketName,
          undefined,
          true,
        );
        const userDocuments: UserDocument[] = [
          {
            id: 'historico_escolar',
            name: 'Histórico Escolar',
            type: 'historico_escolar',
            status: 'missing',
          },
          {
            id: 'comprovante_matricula',
            name: 'Comprovante de Matrícula',
            type: 'comprovante_matricula',
            status: 'missing',
          },
        ];

        return new Promise<Response>((resolve) => {
          const foundFiles: Record<
            string,
            { name: string; lastModified: Date }
          > = {};

          objectsStream.on('data', (obj: Minio.BucketItem) => {
            if (obj.name && obj.name.includes(userId)) {
              if (obj.name.includes('historico_escolar')) {
                foundFiles['historico_escolar'] = {
                  name: obj.name,
                  lastModified: obj.lastModified || new Date(),
                };
              } else if (obj.name.includes('comprovante_matricula')) {
                foundFiles['comprovante_matricula'] = {
                  name: obj.name,
                  lastModified: obj.lastModified || new Date(),
                };
              }
            }
          });

          objectsStream.on('error', (err: Error) => {
            log.error(err, 'Erro ao listar documentos do usuário');
            resolve(
              json({ error: 'Erro ao buscar documentos' }, { status: 500 }),
            );
          });

          objectsStream.on('end', async () => {
            // Atualizar status dos documentos encontrados
            for (const doc of userDocuments) {
              const foundFile = foundFiles[doc.type];
              if (foundFile) {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                const isExpired = foundFile.lastModified < sixMonthsAgo;

                doc.fileId =
                  foundFile.name.split('/').pop()?.split('.')[0] || '';
                doc.fileName = foundFile.name.split('/').pop() || '';
                doc.uploadDate = foundFile.lastModified;
                doc.status = isExpired ? 'expired' : 'valid';
                doc.needsUpdate = isExpired;
              }
            }

            log.info(
              { userId, documentsFound: Object.keys(foundFiles).length },
              'Documentos do usuário listados',
            );
            resolve(json(userDocuments));
          });
        });
      } catch (error) {
        log.error(error, 'Erro ao listar documentos do usuário');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
});
