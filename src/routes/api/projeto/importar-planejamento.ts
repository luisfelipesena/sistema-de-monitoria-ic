import { createAPIFileRoute } from '@tanstack/react-start/api';
import { json } from '@tanstack/react-start';
import { z } from 'zod';
import { createAPIHandler, withAuthMiddleware, withRoleMiddleware } from '@/server/middleware/common';
import { projectGeneratorService } from '@/server/lib/projectGenerator';
import minioClient from '@/server/lib/minio';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';

const log = logger.child({
  context: 'ImportarPlanejamentoAPI',
});

const uploadSchema = z.object({
  fileName: z.string(),
  fileType: z.enum(['csv', 'xlsx']),
  ano: z.number().int().min(2024),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
});

export type UploadInputType = z.infer<typeof uploadSchema>;

export const responseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  result: z.object({
    totalRows: z.number(),
    projectsCreated: z.number(),
    errors: z.array(z.object({
      row: z.number(),
      error: z.string(),
      data: z.any().optional()
    }))
  }).optional()
});

export type ResponseType = z.infer<typeof responseSchema>;

export const APIRoute = createAPIFileRoute('/api/projeto/importar-planejamento')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const formData = await ctx.request.formData();
        const file = formData.get('file') as File;
        const metadata = formData.get('metadata') as string;

        if (!file) {
          return json({ error: 'Arquivo não fornecido' }, { status: 400 });
        }

        const parsedMetadata = uploadSchema.parse(JSON.parse(metadata));
        
        const bucketName = env.MINIO_BUCKET_NAME || 'sistema-monitoria';
        const fileId = `imports/${Date.now()}-${parsedMetadata.fileName}`;
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        await minioClient.putObject(
          bucketName,
          fileId,
          buffer,
          buffer.length,
          {
            'Content-Type': file.type,
            'Original-Name': parsedMetadata.fileName,
          }
        );

        const result = await projectGeneratorService.processImportFile(
          buffer,
          parsedMetadata.fileName,
          parsedMetadata.fileType,
          parsedMetadata.ano,
          parsedMetadata.semestre,
          parseInt(ctx.state.user.userId, 10),
          fileId
        );

        log.info('Import completed successfully', {
          projectsCreated: result.projectsCreated,
          totalRows: result.totalRows,
          errors: result.errors.length
        });

        return json({
          success: true,
          message: `Importação concluída. ${result.projectsCreated} projetos criados com sucesso.`,
          result: {
            totalRows: result.totalRows,
            projectsCreated: result.projectsCreated,
            errors: result.errors,
          },
        });
      } catch (error) {
        log.error(error, 'Error importing planning file');
        return json(
          {
            error: 'Erro ao processar arquivo de importação',
            details: error instanceof Error ? error.message : 'Erro desconhecido',
          },
          { status: 500 }
        );
      }
    })
  ),

  GET: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const history = await projectGeneratorService.getImportHistory();
        
        log.info('Import history fetched successfully');
        return json({ history });
      } catch (error) {
        log.error(error, 'Error fetching import history');
        return json(
          { error: 'Erro ao buscar histórico de importações' },
          { status: 500 }
        );
      }
    })
  ),
});