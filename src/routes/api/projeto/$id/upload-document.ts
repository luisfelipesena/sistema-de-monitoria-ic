import { db } from '@/server/database';
import {
  projetoDocumentoTable,
  projetoTable,
  userTable,
} from '@/server/database/schema';
import { sendEmail } from '@/server/lib/emailService';
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
  context: 'ProjetoDocumentUpload',
});

const uploadDocumentSchema = z.object({
  tipoDocumento: z.enum([
    'PROPOSTA_ASSINADA_PROFESSOR',
    'PROPOSTA_ASSINADA_ADMIN',
  ]),
  observacoes: z.string().optional(),
});

export const APIRoute = createAPIFileRoute(
  '/api/projeto/$id/upload-document',
)({
  POST: createAPIHandler(
    withRoleMiddleware(['professor', 'admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.projetoId);
        const userId = ctx.state.user.userId;

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        // Verificar se o projeto existe
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

        // Verificar permissões
        if (ctx.state.user.role === 'professor') {
          if (projeto.professorResponsavel.userId !== parseInt(userId)) {
            return json({ error: 'Acesso negado' }, { status: 403 });
          }
        }

        await ensureBucketExists();

        const formData = await ctx.request.formData();
        const file = formData.get('file') as File;
        const tipoDocumentoStr = formData.get('tipoDocumento') as string;
        const observacoes = formData.get('observacoes') as string;

        if (!file || !tipoDocumentoStr) {
          return json(
            { error: 'Arquivo e tipo de documento são obrigatórios' },
            { status: 400 },
          );
        }

        const validatedData = uploadDocumentSchema.parse({
          tipoDocumento: tipoDocumentoStr,
          observacoes,
        });

        // Verificar se o usuário pode fazer upload deste tipo de documento
        if (
          ctx.state.user.role === 'professor' &&
          validatedData.tipoDocumento !== 'PROPOSTA_ASSINADA_PROFESSOR'
        ) {
          return json(
            {
              error:
                'Professores só podem fazer upload de propostas assinadas por eles',
            },
            { status: 403 },
          );
        }

        if (
          ctx.state.user.role === 'admin' &&
          validatedData.tipoDocumento !== 'PROPOSTA_ASSINADA_ADMIN'
        ) {
          return json(
            {
              error:
                'Admins só podem fazer upload de propostas assinadas por eles',
            },
            { status: 403 },
          );
        }

        const fileId = uuidv4();
        const originalFilename = file.name;
        const extension = path.extname(originalFilename);
        const metaData = {
          'Content-Type': file.type || 'application/pdf',
          'X-Amz-Meta-Entity-Type': 'projeto',
          'X-Amz-Meta-Entity-Id': projetoId.toString(),
          'X-Amz-Meta-User-Id': userId,
          'X-Amz-Meta-Original-Filename': originalFilename,
          'X-Amz-Meta-Document-Type': validatedData.tipoDocumento,
        };

        const objectName = `projeto/${projetoId}/${fileId}${extension}`;

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

        // Salvar na base de dados
        const [novoDocumento] = await db
          .insert(projetoDocumentoTable)
          .values({
            projetoId,
            fileId,
            tipoDocumento: validatedData.tipoDocumento,
            assinadoPorUserId: parseInt(userId),
            observacoes: validatedData.observacoes,
          })
          .returning();

        // Enviar notificação por email
        if (validatedData.tipoDocumento === 'PROPOSTA_ASSINADA_PROFESSOR') {
          // Notificar admins
          const admins = await db.query.userTable.findMany({
            where: eq(userTable.role, 'admin'),
          });

          for (const admin of admins) {
            await sendEmail({
              to: admin.email,
              subject:
                'Nova Proposta de Monitoria Assinada - Requer Assinatura Admin',
              html: `
                <h2>Nova Proposta de Monitoria Assinada</h2>
                <p>O professor ${projeto.professorResponsavel.nomeCompleto} enviou uma proposta assinada para o projeto:</p>
                <p><strong>Título:</strong> ${projeto.titulo}</p>
                <p>A proposta precisa da sua assinatura como administrador.</p>
                <p>Acesse o sistema para revisar e assinar a proposta.</p>
              `,
            });
          }
        } else if (validatedData.tipoDocumento === 'PROPOSTA_ASSINADA_ADMIN') {
          // Notificar professor responsável
          await sendEmail({
            to: projeto.professorResponsavel.user.email,
            subject: 'Proposta de Monitoria Aprovada e Assinada',
            html: `
              <h2>Proposta de Monitoria Aprovada</h2>
              <p>Sua proposta de monitoria foi aprovada e assinada pelo administrador:</p>
              <p><strong>Título:</strong> ${projeto.titulo}</p>
              <p>O processo de assinatura foi concluído com sucesso.</p>
            `,
          });
        }

        log.info(
          {
            projetoId,
            fileId,
            tipoDocumento: validatedData.tipoDocumento,
            userId,
          },
          'Documento de projeto enviado com sucesso',
        );

        return json(
          {
            id: novoDocumento.id,
            fileId: novoDocumento.fileId,
            tipoDocumento: novoDocumento.tipoDocumento,
            observacoes: novoDocumento.observacoes,
            createdAt: novoDocumento.createdAt,
          },
          { status: 201 },
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao fazer upload do documento');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
});
