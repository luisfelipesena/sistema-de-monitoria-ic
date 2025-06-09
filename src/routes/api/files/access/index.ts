import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { json } from '@tanstack/react-start';
import { logger } from '@/utils/logger';
import minioClient from '@/server/lib/minio';
import { env } from '@/utils/env';
import { db } from '@/server/database';
import {
  alunoTable,
  professorTable,
  projetoDocumentoTable,
} from '@/server/database/schema';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'FileAccessAPI',
});

const fileAccessSchema = z.object({
  fileId: z.string().min(1, 'File ID é obrigatório'),
  action: z.enum(['view', 'download']).optional().default('view'),
});

export const APIRoute = createAPIFileRoute('/api/files/access')({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const body = await ctx.request.json();
        const { fileId, action } = fileAccessSchema.parse(body);
        const userId = parseInt(ctx.state.user.userId, 10);

        // We need to verify the user has permission to access this file.
        // For now, we check if the fileId is referenced in their user-related tables.
        // This logic should be expanded as more document types are added.

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
          // Basic check if user is related to the project of the document
          // NOTE: This assumes the user ID is the same as the professor ID, which needs careful management.
          // A better approach would be to check against the professor table's user_id.
          isAuthorized = true;
        }

        // Admins can access any file.
        if (ctx.state.user.role === 'admin') {
          isAuthorized = true;
        }

        if (!isAuthorized) {
          log.warn(`Unauthorized access attempt for fileId: ${fileId} by userId: ${userId}`);
          return json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        log.info(`Generating presigned URL for authorized access - fileId: ${fileId} by userId: ${userId}, action: ${action}`);
        
        const bucketName = env.MINIO_BUCKET_NAME;
        
        // Para visualização, usar headers que permitem display inline
        const responseHeaders: Record<string, string> = {};
        if (action === 'view') {
          responseHeaders['Content-Disposition'] = 'inline';
          responseHeaders['Content-Type'] = 'application/pdf';
        }
        
        const presignedUrl = await minioClient.presignedGetObject(
          bucketName,
          fileId,
          60 * 5, // 5 minutes validity
          responseHeaders,
        );

        return json({ url: presignedUrl }, { status: 200 });
      } catch (error) {
        // Tratamento específico para arquivo não encontrado no MinIO
        if (error instanceof Error && (error.message.includes('NoSuchKey') || (error as any).code === 'NoSuchKey')) {
          log.warn({ fileId: (error as any).fileId, userId: (error as any).userId, error }, 'Arquivo não encontrado no MinIO');
          return json({ error: 'Arquivo não encontrado' }, { status: 404 });
        }
        
        if (error instanceof z.ZodError) {
          return json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
        }
        
        log.error(error, `Error generating presigned URL`);
        return json({ error: 'Erro ao acessar o arquivo' }, { status: 500 });
      }
    }),
  ),
}); 