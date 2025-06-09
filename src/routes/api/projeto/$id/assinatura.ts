import { db } from '@/server/database';
import { 
  professorTable, 
  projetoTable, 
  assinaturaDocumentoTable,
  tipoAssinaturaEnum,
  projetoStatusEnum,
  userTable,
  departamentoTable,
  projetoDocumentoTable
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { emailService } from '@/server/lib/emailService';
import { getProjectPdfData } from '@/server/lib/pdf-generation';
import { renderToBuffer } from '@react-pdf/renderer';
import { MonitoriaFormTemplate } from '@/components/features/projects/MonitoriaFormTemplate';
import minioClient, { bucketName } from '@/server/lib/minio';
import { v4 as uuidv4 } from 'uuid';

const log = logger.child({
  context: 'AssinaturaProjetoAPI',
});

const assinaturaInputSchema = z.object({
  signatureImage: z.string().optional(), // base64 data URL (opcional se usar assinatura do perfil)
  tipoAssinatura: z.enum(['professor', 'admin']),
  useProfileSignature: z.boolean().default(false), // usar assinatura do perfil
});

export type AssinaturaInput = z.infer<typeof assinaturaInputSchema>;

export const APIRoute = createAPIFileRoute('/api/projeto/$id/assinatura')({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      const { id } = ctx.params;
      const projectId = parseInt(id, 10);
      const userNumericId = ctx.state.user?.userId ? parseInt(ctx.state.user.userId, 10) : undefined;

      if (isNaN(projectId)) {
        return json({ error: 'ID do projeto inválido' }, { status: 400 });
      }

      if (!userNumericId || isNaN(userNumericId)) {
        return json({ error: 'Usuário inválido' }, { status: 401 });
      }

      try {
        const body = await ctx.request.json();
        const { signatureImage, tipoAssinatura, useProfileSignature } = assinaturaInputSchema.parse(body);

        let finalSignatureData = signatureImage;

        // Se deve usar assinatura do perfil, buscar no banco
        if (useProfileSignature && !signatureImage) {
          if (tipoAssinatura === 'professor') {
            const professor = await db.query.professorTable.findFirst({
              where: eq(professorTable.userId, userNumericId),
              columns: { assinaturaDefault: true },
            });
            finalSignatureData = professor?.assinaturaDefault || undefined;
          } else if (tipoAssinatura === 'admin') {
            const user = await db.query.userTable.findFirst({
              where: eq(userTable.id, userNumericId),
              columns: { assinaturaDefault: true },
            });
            finalSignatureData = user?.assinaturaDefault || undefined;
          }

          if (!finalSignatureData) {
            return json({ 
              error: 'Assinatura não encontrada no perfil. Configure sua assinatura no perfil primeiro.' 
            }, { status: 400 });
          }
        }

        if (!finalSignatureData) {
          return json({ 
            error: 'Dados da assinatura são obrigatórios' 
          }, { status: 400 });
        }

        const result = await db.transaction(async (tx) => {
          const projeto = await tx.query.projetoTable.findFirst({
            where: eq(projetoTable.id, projectId),
          });

          if (!projeto) {
            const err = new Error('Projeto não encontrado.');
            (err as any).status = 404;
            throw err;
          }

          let updatedProjeto;

          if (tipoAssinatura === 'professor') {
            if (ctx.state.user.role !== 'professor') {
              const err = new Error('Apenas professores podem assinar como professor.');
              (err as any).status = 403;
              throw err;
            }

            const professor = await tx.query.professorTable.findFirst({
              where: eq(professorTable.userId, userNumericId),
            });

            if (!professor) {
              const err = new Error('Perfil de professor não encontrado.');
              (err as any).status = 404;
              throw err;
            }

            if (projeto.professorResponsavelId !== professor.id) {
              const err = new Error('Você não é o professor responsável por este projeto.');
              (err as any).status = 403;
              throw err;
            }

            if (projeto.status !== 'DRAFT' && projeto.status !== 'PENDING_PROFESSOR_SIGNATURE') {
              const err = new Error(`Projeto com status '${projeto.status}' não pode ser assinado pelo professor.`);
              (err as any).status = 400;
              throw err;
            }

            const [newSignature] = await tx
              .insert(assinaturaDocumentoTable)
              .values({
                assinaturaData: finalSignatureData,
                tipoAssinatura: 'PROJETO_PROFESSOR_RESPONSAVEL',
                userId: userNumericId,
                projetoId: projectId,
              })
              .returning();

            [updatedProjeto] = await tx
              .update(projetoTable)
              .set({
                status: 'SUBMITTED',
                updatedAt: new Date(),
              })
              .where(eq(projetoTable.id, projectId))
              .returning();

            // Notify admins
            try {
              const admins = await tx.query.userTable.findMany({
                where: eq(userTable.role, 'admin'),
              });
              const adminEmails = admins
                .map((admin) => admin.email)
                .filter((email): email is string => !!email && email.length > 0);

              if (adminEmails.length > 0) {
                const professorData = await tx.query.professorTable.findFirst({
                  where: eq(professorTable.id, updatedProjeto.professorResponsavelId),
                });
                const departamento = await tx.query.departamentoTable.findFirst({
                  where: eq(departamentoTable.id, updatedProjeto.departamentoId),
                });

                await emailService.sendProjetoSubmetidoParaAdminsNotification(
                  {
                    professorNome: professorData?.nomeCompleto || 'Professor Desconhecido',
                    projetoTitulo: updatedProjeto.titulo,
                    projetoId: updatedProjeto.id,
                    departamento: departamento?.nome,
                    semestre: updatedProjeto.semestre,
                    ano: updatedProjeto.ano,
                  },
                  adminEmails,
                );
              }
            } catch (emailError) {
              log.error({ emailError, projectId }, 'Erro ao enviar notificação para admins');
            }

            log.info({ projectId, signatureId: newSignature.id }, 'Assinatura do professor salva com sucesso');

          } else if (tipoAssinatura === 'admin') {
            if (ctx.state.user.role !== 'admin') {
              const err = new Error('Apenas administradores podem assinar como admin.');
              (err as any).status = 403;
              throw err;
            }

            if (projeto.status !== 'SUBMITTED' && projeto.status !== 'PENDING_ADMIN_SIGNATURE') {
              const err = new Error(`Projeto com status '${projeto.status}' não pode ser assinado pelo admin.`);
              (err as any).status = 400;
              throw err;
            }

            const [newSignature] = await tx
              .insert(assinaturaDocumentoTable)
              .values({
                assinaturaData: finalSignatureData,
                tipoAssinatura: 'PROJETO_COORDENADOR_DEPARTAMENTO',
                userId: userNumericId,
                projetoId: projectId,
              })
              .returning();

            [updatedProjeto] = await tx
              .update(projetoTable)
              .set({
                status: 'APPROVED',
                updatedAt: new Date(),
              })
              .where(eq(projetoTable.id, projectId))
              .returning();

            // Notify professor
            try {
              const professor = await tx.query.professorTable.findFirst({
                where: eq(professorTable.id, updatedProjeto.professorResponsavelId),
              });
              const user = await tx.query.userTable.findFirst({
                where: eq(userTable.id, professor?.userId || 0),
              });

              if (user?.email) {
                await emailService.sendProjetoStatusChangeNotification({
                  professorNome: professor?.nomeCompleto || 'Professor',
                  professorEmail: user.email,
                  projetoTitulo: updatedProjeto.titulo,
                  projetoId: updatedProjeto.id,
                  novoStatus: 'APPROVED',
                  feedback: 'Projeto aprovado e assinado pelo coordenador.',
                });
              }
            } catch (emailError) {
              log.error({ emailError, projectId }, 'Erro ao enviar notificação para professor');
            }

            log.info({ projectId, signatureId: newSignature.id }, 'Assinatura do admin salva com sucesso');
          } else {
            const err = new Error('Tipo de assinatura inválido.');
            (err as any).status = 400;
            throw err;
          }

          // --- PDF Generation and Upload ---
          const pdfData = await getProjectPdfData(projectId, tx);
          
          // Buscar assinaturas anteriores
          const assinaturasAnteriores = await tx.query.assinaturaDocumentoTable.findMany({
            where: eq(assinaturaDocumentoTable.projetoId, projectId),
          });

          // Incluir assinatura atual
          if (tipoAssinatura === 'professor') {
            pdfData.assinaturaProfessor = finalSignatureData;
          } else {
            pdfData.assinaturaAdmin = finalSignatureData;
            
            // Se admin está assinando, buscar assinatura anterior do professor
            const assinaturaProfessor = assinaturasAnteriores.find(
              (ass) => ass.tipoAssinatura === 'PROJETO_PROFESSOR_RESPONSAVEL'
            );
            if (assinaturaProfessor) {
              pdfData.assinaturaProfessor = assinaturaProfessor.assinaturaData;
            }
          }
          
          const pdfBuffer = await renderToBuffer(MonitoriaFormTemplate({ data: pdfData as any }));
          
          const fileId = uuidv4();
          const objectName = `projetos/${projectId}/propostas_assinadas/${fileId}.pdf`;

          await minioClient.putObject(bucketName, objectName, pdfBuffer, pdfBuffer.length, {
            'Content-Type': 'application/pdf',
            'X-Amz-Meta-Entity-Type': 'projeto_documento',
            'X-Amz-Meta-Project-Id': projectId.toString(),
            'X-Amz-Meta-Uploader-Id': userNumericId.toString(),
            'X-Amz-Meta-Signature-Type': tipoAssinatura,
          });

          const tipoDocumento = tipoAssinatura === 'professor' ? 'PROPOSTA_ASSINADA_PROFESSOR' : 'PROPOSTA_ASSINADA_ADMIN';

          await tx.insert(projetoDocumentoTable).values({
            projetoId: projectId,
            fileId: objectName,
            tipoDocumento: tipoDocumento,
            assinadoPorUserId: userNumericId,
          });

          log.info({ projectId, fileId: objectName }, `PDF de ${tipoAssinatura} salvo no MinIO e DB.`);
          
          return { success: true, projeto: updatedProjeto };
        });

        return json(result, { status: 200 });
      } catch (error: any) {
        log.error(error, `Erro ao salvar assinatura do projeto ${projectId}`);
        if (error.status) {
          return json({ error: error.message }, { status: error.status });
        }
        return json({ error: 'Erro interno ao processar assinatura' }, { status: 500 });
      }
    }),
  ),
}); 