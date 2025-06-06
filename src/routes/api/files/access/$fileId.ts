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

const log = logger.child({
  context: 'FileAccessAPI',
});

// This route is responsible for generating a presigned URL and redirecting the user to it.
// It ensures that only authorized users can access files.
export const APIRoute = createAPIFileRoute('/api/files/access/$fileId')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      const { fileId } = ctx.params;
      const userId = parseInt(ctx.state.user.userId, 10);

      try {
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
        
        const bucketName = env.MINIO_BUCKET_NAME;
        const presignedUrl = await minioClient.presignedGetObject(
          bucketName,
          fileId,
          60 * 5, // 5 minutes validity
        );

        // Instead of returning JSON, we issue a redirect.
        return new Response(null, {
          status: 302,
          headers: {
            Location: presignedUrl,
          },
        });
      } catch (error) {
        log.error(error, `Error generating presigned URL for fileId: ${fileId}`);
        return json({ error: 'Erro ao acessar o arquivo' }, { status: 500 });
      }
    }),
  ),
}); 