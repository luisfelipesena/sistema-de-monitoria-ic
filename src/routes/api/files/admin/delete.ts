import minioClient, { bucketName } from '@/server/lib/minio';
import { createAPIHandler, withRoleMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';

const log = logger.child({ context: 'AdminFileDelete' });

const deleteBodySchema = z.object({
  objectName: z.string().min(1, 'Nome do objeto é obrigatório'),
});

const deleteResponseSchema = z.object({
  message: z.string().min(1, 'Mensagem é obrigatória'),
});

export type DeleteBody = z.infer<typeof deleteBodySchema>;
export type DeleteResponse = z.infer<typeof deleteResponseSchema>;

export const APIRoute = createAPIFileRoute('/api/files/admin/delete')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        // Get userId from middleware
        const userId = ctx.state.user.userId;

        // --- Body Validation ---
        let body;
        try {
          body = await ctx.request.clone().json();
        } catch (e) {
          return json({ error: 'Corpo da requisição inválido (não é JSON)' }, { status: 400 });
        }

        const validation = deleteBodySchema.safeParse(body);
        if (!validation.success) {
          return json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }
        const { objectName } = validation.data;
        // --- End Body Validation ---

        log.info({ adminUserId: userId, objectName }, 'Excluindo arquivo...');

        await minioClient.removeObject(bucketName, objectName);

        log.info({ adminUserId: userId, objectName }, 'Arquivo excluído com sucesso.');

        return json(deleteResponseSchema.parse({ message: 'Arquivo excluído com sucesso' }), { status: 200 });
      } catch (error) {
        if (error instanceof Response) {
          return error; // Return the error response from the middleware
        }

        // Handle specific MinIO errors if needed (e.g., file not found)
        if (error instanceof Error && error.message.includes('NoSuchKey')) {
          log.warn({ error }, 'Tentativa de excluir arquivo não encontrado');
          return json({ error: 'Arquivo não encontrado no bucket' }, { status: 404 });
        }
        log.error(error, 'Erro ao excluir arquivo do MinIO');
        return json({ error: 'Erro interno do servidor ao excluir o arquivo' }, { status: 500 });
      }
    })
  ),
}); 