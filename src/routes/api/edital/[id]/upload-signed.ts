import { db } from '@/server/database';
import { editalTable } from '@/server/database/schema';
import minioClient, {
  bucketName,
  ensureBucketExists,
} from '@/server/lib/minio';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const log = logger.child({
  context: 'EditalUploadSignedAPI',
});

const paramsSchema = z.object({
  id: z.string().transform(Number),
});

// Não há um schema de body específico além do FormData que contém o arquivo.
// Poderíamos adicionar um campo 'observacoes' se necessário.

export const APIRoute = createAPIFileRoute('/api/edital/[id]/upload-signed')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const { id: editalId } = paramsSchema.parse(ctx.params);
        const adminUserId = parseInt(ctx.state.user.userId, 10);

        const edital = await db.query.editalTable.findFirst({
          where: eq(editalTable.id, editalId),
        });

        if (!edital) {
          return json({ error: 'Edital não encontrado' }, { status: 404 });
        }
        
        // Opcional: Verificar se o edital já foi publicado antes de permitir novo upload de assinado
        // if (!edital.publicado) {
        //   return json({ error: 'O edital precisa ser publicado antes de anexar o documento assinado.' }, { status: 400 });
        // }

        await ensureBucketExists();

        const formData = await ctx.request.formData();
        const file = formData.get('file') as File;

        if (!file) {
          return json({ error: 'Arquivo não fornecido' }, { status: 400 });
        }
        
        if (file.type !== 'application/pdf') {
            return json({ error: 'Arquivo deve ser um PDF.'}, { status: 400 });
        }

        const fileId = uuidv4();
        const originalFilename = file.name;
        const extension = path.extname(originalFilename) || '.pdf'; // Garante extensão .pdf
        
        const metaData = {
          'Content-Type': file.type,
          'X-Amz-Meta-Entity-Type': 'edital_assinado',
          'X-Amz-Meta-Entity-Id': editalId.toString(),
          'X-Amz-Meta-User-Id': adminUserId.toString(),
          'X-Amz-Meta-Original-Filename': originalFilename,
          'X-Amz-Meta-Edital-Numero': edital.numeroEdital,
        };

        const objectName = `edital_assinado/${editalId}/${fileId}${extension}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileStream = Readable.from(buffer);

        await minioClient.putObject(
          bucketName,
          objectName,
          fileStream,
          buffer.length,
          metaData,
        );

        // Atualizar edital com o fileId do documento assinado
        const [updatedEdital] = await db
          .update(editalTable)
          .set({
            fileIdAssinado: objectName, // Salvar o objectName completo do MinIO
            updatedAt: new Date(),
          })
          .where(eq(editalTable.id, editalId))
          .returning();

        log.info(
          {
            editalId,
            fileId: objectName, // Logar o objectName
            adminUserId,
          },
          'PDF do edital assinado enviado com sucesso',
        );

        return json(
          {
            success: true,
            message: 'Documento do edital assinado enviado com sucesso.',
            edital: updatedEdital,
          },
          { status: 200 },
        );

      } catch (error) {
        if (error instanceof z.ZodError && error.message.includes('params')) {
          return json({ error: 'ID do edital inválido' }, { status: 400 });
        }
        log.error(error, 'Erro ao fazer upload do PDF do edital assinado');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
}); 