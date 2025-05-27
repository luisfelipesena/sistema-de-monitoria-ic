import { db } from '@/server/database';
import { projetoTable } from '@/server/database/schema';
import minioClient, { bucketName } from '@/server/lib/minio';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'ProjetoDownloadDocument',
});

const tipoDocumentoSchema = z.enum([
  'PROPOSTA_ASSINADA_PROFESSOR',
  'PROPOSTA_ASSINADA_ADMIN',
]);

export const APIRoute = createAPIFileRoute(
  '/api/projeto/$id/download-document',
)({
  GET: createAPIHandler(
    withRoleMiddleware(['professor', 'admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const userId = parseInt(ctx.state.user.userId, 10);
        const url = new URL(ctx.request.url);
        const tipoDocumento = url.searchParams.get('tipo');

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        if (!tipoDocumento) {
          return json(
            { error: 'Tipo de documento é obrigatório' },
            { status: 400 },
          );
        }

        const validatedTipo = tipoDocumentoSchema.parse(tipoDocumento);

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
          with: {
            professorResponsavel: {
              with: {
                user: true,
              },
            },
          },
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        if (ctx.state.user.role === 'professor') {
          if (projeto.professorResponsavel.userId !== userId) {
            return json({ error: 'Acesso negado' }, { status: 403 });
          }
        }

        const documento = await db.query.projetoDocumentoTable.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.projetoId, projetoId),
              eq(table.tipoDocumento, validatedTipo),
            ),
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        });

        if (!documento) {
          return json({ error: 'Documento não encontrado' }, { status: 404 });
        }

        try {
          const objectName = `projeto/${projetoId}/${documento.fileId}`;
          const objects = minioClient.listObjects(bucketName, objectName, true);

          return new Promise<Response>((resolve, reject) => {
            let foundObject: string | null = null;

            objects.on('data', (obj) => {
              if (obj.name && obj.name.includes(documento.fileId)) {
                foundObject = obj.name;
              }
            });

            objects.on('error', (err) => {
              log.error(err, 'Erro ao listar objetos no MinIO');
              resolve(
                json({ error: 'Erro ao buscar o arquivo' }, { status: 500 }),
              );
            });

            objects.on('end', async () => {
              if (!foundObject) {
                return resolve(
                  json({ error: 'Arquivo não encontrado' }, { status: 404 }),
                );
              }

              try {
                const stat = await minioClient.statObject(
                  bucketName,
                  foundObject,
                );
                const url = await minioClient.presignedGetObject(
                  bucketName,
                  foundObject,
                  60 * 60,
                );

                resolve(
                  json(
                    {
                      url,
                      fileName:
                        stat.metaData['x-amz-meta-original-filename'] ||
                        'documento.pdf',
                      mimeType:
                        stat.metaData['content-type'] || 'application/pdf',
                      fileSize: stat.size,
                    },
                    { status: 200 },
                  ),
                );
              } catch (error) {
                log.error(error, 'Erro ao obter URL pré-assinada');
                resolve(
                  json(
                    { error: 'Erro ao gerar link de acesso ao arquivo' },
                    { status: 500 },
                  ),
                );
              }
            });
          });
        } catch (error) {
          log.error(error, 'Erro ao buscar documento no MinIO');
          return json({ error: 'Erro ao buscar documento' }, { status: 500 });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Tipo de documento inválido', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao baixar documento do projeto');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
});
