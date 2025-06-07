import { db } from '@/server/database';
import { 
  professorTable, 
  projetoTable, 
  assinaturaDocumentoTable,
  tipoAssinaturaEnum,
  projetoStatusEnum,
  userTable,
  departamentoTable
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

const log = logger.child({
  context: 'AssinaturaProjetoAPI',
});

const assinaturaInputSchema = z.object({
  signatureImage: z.string(), // base64 data URL
  tipoAssinatura: z.enum(['professor', 'admin']),
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
        const { signatureImage, tipoAssinatura } = assinaturaInputSchema.parse(body);

        const result = await db.transaction(async (tx) => {
          const projeto = await tx.query.projetoTable.findFirst({
            where: eq(projetoTable.id, projectId),
          });

          if (!projeto) {
            const err = new Error('Projeto não encontrado.');
            (err as any).status = 404;
            throw err;
          }

          if (tipoAssinatura === 'professor') {
            // Lógica para assinatura do professor
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

            // Salvar assinatura do professor
            const [newSignature] = await tx
              .insert(assinaturaDocumentoTable)
              .values({
                assinaturaData: signatureImage,
                tipoAssinatura: 'PROJETO_PROFESSOR_RESPONSAVEL',
                userId: userNumericId,
                projetoId: projectId,
              })
              .returning();

            // Atualizar status do projeto para SUBMITTED
            const [updatedProjeto] = await tx
              .update(projetoTable)
              .set({
                status: 'SUBMITTED',
                updatedAt: new Date(),
              })
              .where(eq(projetoTable.id, projectId))
              .returning();

            // Notificar admins sobre submissão
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
            return { success: true, projeto: updatedProjeto, signatureId: newSignature.id };

          } else if (tipoAssinatura === 'admin') {
            // Lógica para assinatura do admin
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

            // Salvar assinatura do admin
            const [newSignature] = await tx
              .insert(assinaturaDocumentoTable)
              .values({
                assinaturaData: signatureImage,
                tipoAssinatura: 'PROJETO_COORDENADOR_DEPARTAMENTO',
                userId: userNumericId,
                projetoId: projectId,
              })
              .returning();

            // Atualizar status do projeto para APPROVED
            const [updatedProjeto] = await tx
              .update(projetoTable)
              .set({
                status: 'APPROVED',
                updatedAt: new Date(),
              })
              .where(eq(projetoTable.id, projectId))
              .returning();

            // Notificar professor sobre aprovação
            try {
              const professor = await tx.query.professorTable.findFirst({
                where: eq(professorTable.id, updatedProjeto.professorResponsavelId),
              });
              const user = await tx.query.userTable.findFirst({
                where: eq(userTable.id, professor?.userId || 0),
              });

                             if (user?.email) {
                 await emailService.sendProjetoStatusChangeNotification(
                   {
                     professorNome: professor?.nomeCompleto || 'Professor',
                     professorEmail: user.email,
                     projetoTitulo: updatedProjeto.titulo,
                     projetoId: updatedProjeto.id,
                     novoStatus: 'APPROVED',
                     feedback: 'Projeto aprovado e assinado pelo coordenador.',
                   },
                 );
               }
            } catch (emailError) {
              log.error({ emailError, projectId }, 'Erro ao enviar notificação para professor');
            }

            log.info({ projectId, signatureId: newSignature.id }, 'Assinatura do admin salva com sucesso');
            return { success: true, projeto: updatedProjeto, signatureId: newSignature.id };
          } else {
            const err = new Error('Tipo de assinatura inválido.');
            (err as any).status = 400;
            throw err;
          }
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