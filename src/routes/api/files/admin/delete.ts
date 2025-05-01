import { adminAuthMiddleware } from '@/routes/api/-middlewares/auth';
import minioClient, { bucketName } from '@/server/lib/minio';
import { logger } from '@/utils/logger';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({ context: 'AdminFileDelete' });

const deleteBodySchema = z.object({
  objectName: z.string().min(1, 'Nome do objeto é obrigatório'),
});

export const APIRoute = createAPIFileRoute('/api/files/admin/delete')({
  POST: async ({ request }) => {
    try {
      // Handle authentication and authorization
      const { userId } = await adminAuthMiddleware(request);

      // --- Body Validation ---
      let body;
      try {
        body = await request.clone().json();
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Corpo da requisição inválido (não é JSON)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      const validation = deleteBodySchema.safeParse(body);
      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'Dados inválidos', details: validation.error.flatten() }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const { objectName } = validation.data;
      // --- End Body Validation ---

      log.info({ adminUserId: userId, objectName }, 'Excluindo arquivo...');

      await minioClient.removeObject(bucketName, objectName);

      log.info({ adminUserId: userId, objectName }, 'Arquivo excluído com sucesso.');

      return new Response(JSON.stringify({ message: 'Arquivo excluído com sucesso' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      if (error instanceof Response) {
        return error; // Return the error response from the middleware
      }

      // Handle specific MinIO errors if needed (e.g., file not found)
      if (error instanceof Error && error.message.includes('NoSuchKey')) {
        log.warn({ error }, 'Tentativa de excluir arquivo não encontrado');
        return new Response(JSON.stringify({ error: 'Arquivo não encontrado no bucket' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      log.error(error, 'Erro ao excluir arquivo do MinIO');
      return new Response(JSON.stringify({ error: 'Erro interno do servidor ao excluir o arquivo' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
}); 