import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { json } from '@tanstack/react-start';
import { logger } from '@/utils/logger';
import minioClient, { bucketName } from '@/server/lib/minio';
import { db } from '@/server/database';
import {
  alunoTable,
  professorTable,
  projetoDocumentoTable,
} from '@/server/database/schema';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'FileMetadataAPI',
});

const fileMetadataSchema = z.object({
  fileId: z.string().min(1, 'File ID é obrigatório'),
});

export const fileMetadataResponseSchema = z.object({
  objectName: z.string(),
  originalFilename: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.number(),
  lastModified: z.date(),
});

export type FileMetadataResponse = z.infer<typeof fileMetadataResponseSchema>;

export const APIRoute = createAPIFileRoute('/api/files/metadata')({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const body = await ctx.request.json();
        const { fileId } = fileMetadataSchema.parse(body);
        const userId = parseInt(ctx.state.user.userId, 10);

        // Verificar se o usuário tem permissão para acessar este arquivo
        const [aluno, professor, projetoDocumento] = await Promise.all([
          db.query.alunoTable.findFirst({
            where: or(
              eq(alunoTable.historicoEscolarFileId, fileId),
              eq(alunoTable.comprovanteMatriculaFileId, fileId),
            ),
          }),
          db.query.professorTable.findFirst({
            where: or(
              eq(professorTable.curriculumVitaeFileId, fileId),
              eq(professorTable.comprovanteVinculoFileId, fileId),
            ),
          }),
          db.query.projetoDocumentoTable.findFirst({
            where: eq(projetoDocumentoTable.fileId, fileId),
            with: {
              projeto: {
                with: {
                  professoresParticipantes: true,
                },
              },
            },
          }),
        ]);

        let isAuthorized = false;
        if (aluno && aluno.userId === userId) {
          isAuthorized = true;
        } else if (professor && professor.userId === userId) {
          isAuthorized = true;
        } else if (
          projetoDocumento &&
          (projetoDocumento.projeto?.professorResponsavelId === userId ||
            projetoDocumento.projeto?.professoresParticipantes.some(
              (p) => p.professorId === userId,
            ))
        ) {
          isAuthorized = true;
        }

        // Admins podem acessar qualquer arquivo
        if (ctx.state.user.role === 'admin') {
          isAuthorized = true;
        }

        if (!isAuthorized) {
          log.warn(`Unauthorized metadata access attempt for fileId: ${fileId} by userId: ${userId}`);
          return json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        // Obter metadados do arquivo do MinIO
        const stat = await minioClient.statObject(bucketName, fileId);
        
        const metadata: FileMetadataResponse = {
          objectName: fileId,
          originalFilename: stat.metaData['original-filename'] || stat.metaData['x-amz-meta-original-filename'],
          mimeType: stat.metaData['content-type'],
          size: stat.size,
          lastModified: stat.lastModified,
        };

        return json(metadata, { status: 200 });
      } catch (error) {
        // Tratamento específico para arquivo não encontrado no MinIO
        if (error instanceof Error && (error.message.includes('NoSuchKey') || (error as any).code === 'NoSuchKey')) {
          log.warn({ fileId: (error as any).fileId, userId: (error as any).userId, error }, 'Arquivo não encontrado no MinIO');
          return json({ error: 'Arquivo não encontrado' }, { status: 404 });
        }
        
        if (error instanceof z.ZodError) {
          return json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
        }
        
        log.error(error, `Error getting file metadata`);
        return json({ error: 'Erro ao obter metadados do arquivo' }, { status: 500 });
      }
    }),
  ),
}); 