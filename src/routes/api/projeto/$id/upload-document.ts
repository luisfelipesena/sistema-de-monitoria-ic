import { db } from '@/server/database';
import {
  projetoDocumentoTable,
  projetoTable,
  userTable,
} from '@/server/database/schema';
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
import { emailService } from '@/server/lib/emailService';

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
        const projetoId = parseInt(ctx.params.id);
        const userId = ctx.state.user.userId;
        const userRole = ctx.state.user.role;

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

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

        if (userRole === 'professor') {
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

        if (
          userRole === 'professor' &&
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
          userRole === 'admin' &&
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
        
        // Lógica de transição de status
        let novoStatusProjeto = projeto.status;
        if (userRole === 'professor' && validatedData.tipoDocumento === 'PROPOSTA_ASSINADA_PROFESSOR') {
          if (projeto.status === 'DRAFT' || projeto.status === 'PENDING_PROFESSOR_SIGNATURE') {
            novoStatusProjeto = 'SUBMITTED';
          } else {
            log.warn({ projetoId, currentStatus: projeto.status }, "Professor tentou enviar assinatura para projeto que não está em DRAFT ou PENDING_PROFESSOR_SIGNATURE");
            // Não impede o upload do documento, mas não altera o status se não for o caso esperado.
            // Poderia retornar um erro se a regra de negócio exigir.
          }
        } else if (userRole === 'admin' && validatedData.tipoDocumento === 'PROPOSTA_ASSINADA_ADMIN') {
          if (projeto.status === 'PENDING_ADMIN_SIGNATURE') {
            novoStatusProjeto = 'APPROVED';
          } else {
             log.warn({ projetoId, currentStatus: projeto.status }, "Admin tentou enviar assinatura para projeto que não está em PENDING_ADMIN_SIGNATURE");
          }
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

        // Atualizar status do projeto se necessário
        let statusFinalDoProjeto = projeto.status;
        if (novoStatusProjeto !== projeto.status) {
          const [resultadoUpdate] = await db.update(projetoTable)
            .set({ status: novoStatusProjeto, updatedAt: new Date() })
            .where(eq(projetoTable.id, projetoId))
            .returning({ status: projetoTable.status });
          
          if (resultadoUpdate && resultadoUpdate.status) {
            statusFinalDoProjeto = resultadoUpdate.status;
          }
          log.info({ projetoId, oldStatus: projeto.status, newStatus: statusFinalDoProjeto }, "Status do projeto atualizado após upload de documento.");
        }
        

        // Enviar notificação por email
        if (userRole === 'professor' && validatedData.tipoDocumento === 'PROPOSTA_ASSINADA_PROFESSOR') {
          const admins = await db.query.userTable.findMany({
            where: eq(userTable.role, 'admin'),
          });
          const adminEmails = admins.map(admin => admin.email).filter((email): email is string => !!email);

          if (adminEmails.length > 0) {
            await emailService.sendProfessorAssinouPropostaNotification(
              {
                professorNome: projeto.professorResponsavel.nomeCompleto,
                projetoTitulo: projeto.titulo,
                projetoId: projeto.id,
                novoStatusProjeto: statusFinalDoProjeto,
              },
              adminEmails,
            );
          }
        } else if (userRole === 'admin' && validatedData.tipoDocumento === 'PROPOSTA_ASSINADA_ADMIN') {
          if (projeto.professorResponsavel?.user?.email) {
            await emailService.sendAdminAssinouPropostaNotification({
              professorEmail: projeto.professorResponsavel.user.email,
              professorNome: projeto.professorResponsavel.nomeCompleto,
              projetoTitulo: projeto.titulo,
              projetoId: projeto.id,
              novoStatusProjeto: novoStatusProjeto,
            });
          } else {
            log.warn({ projetoId }, "Email do professor responsável não encontrado para notificação de assinatura do admin.")
          }
        }

        log.info(
          {
            projetoId,
            fileId,
            tipoDocumento: validatedData.tipoDocumento,
            userId,
            novoStatusProjetoLog: statusFinalDoProjeto !== projeto.status ? statusFinalDoProjeto : undefined
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
            statusProjeto: statusFinalDoProjeto
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
