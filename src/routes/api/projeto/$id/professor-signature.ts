import { db } from '@/server/database';
import {
  assinaturaDocumentoTable,
  projetoStatusEnum,
  projetoTable,
  userTable, // Not directly used for selection here, user comes from context
} from '@/server/database/schema';
import {
  createAPIHandler,
  // httpError, // Removed, will return json directly
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm'; // 'and' was not used
import { z } from 'zod';
import { emailService } from '@/server/lib/emailService';
import { departamentoTable, professorTable } from '@/server/database/schema';

const log = logger.child({
  context: 'ProfessorSignatureAPI',
});

const signatureInputSchema = z.object({
  assinaturaData: z.string().min(1, 'Assinatura não pode estar em branco.'),
});

export type ProfessorSignatureInput = z.infer<typeof signatureInputSchema>;

export const APIRoute = createAPIFileRoute(
  '/api/projeto/$id/professor-signature',
)({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      const user = ctx.state.user;
      // userId from ctx.state.user is a string. Parse it for DB operations.
      const userNumericId = user?.userId ? parseInt(user.userId, 10) : undefined;

      if (user?.role !== 'professor' || !userNumericId || isNaN(userNumericId)) {
        log.warn(
          { userIdStr: user?.userId, role: user?.role },
          'Unauthorized attempt to sign project (professor role or valid user ID missing)',
        );
        return json(
          { error: 'Apenas professores autenticados podem assinar projetos.' },
          { status: 403 },
        );
      }

      const projetoId = parseInt(ctx.params.id, 10);
      if (isNaN(projetoId)) {
        return json({ error: 'ID do projeto inválido.' }, { status: 400 });
      }

      let parsedBody;
      try {
        const body = await ctx.request.json();
        parsedBody = signatureInputSchema.parse(body);
      } catch (error) {
        log.error(error, 'Invalid request body for professor signature');
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.format() },
            { status: 400 },
          );
        }
        return json(
          { error: 'Corpo da requisição inválido.' },
          { status: 400 },
        );
      }

      const { assinaturaData } = parsedBody;

      try {
        const result = await db.transaction(async (tx) => {
          const projeto = await tx.query.projetoTable.findFirst({
            where: eq(projetoTable.id, projetoId),
          });

          if (!projeto) {
            // This will be caught by the outer try-catch and return a 404 from there if error is re-thrown
            // Or, if we want to ensure the transaction rolls back AND a specific JSON is sent, we must throw here
            // and have the outer catch block handle it. For now, let's make it simpler by directly returning JSON
            // which means the transaction might commit successfully if this is the only operation (but it's not).
            // Better: throw specific error to be caught outside for proper JSON response.
            const err = new Error('Projeto não encontrado.');
            (err as any).status = 404;
            throw err;
          }

          if (projeto.professorResponsavelId !== userNumericId) {
            log.warn(
              {
                projectId: projetoId,
                userAttemptingId: userNumericId,
                responsibleId: projeto.professorResponsavelId,
              },
              'Professor attempting to sign a project they are not responsible for',
            );
            const err = new Error('Você não é o professor responsável por este projeto.');
            (err as any).status = 403;
            throw err;
          }

          if (
            projeto.status !== projetoStatusEnum.enumValues[0] /* DRAFT */ &&
            projeto.status !==
              projetoStatusEnum.enumValues[5] /* PENDING_PROFESSOR_SIGNATURE */
          ) {
            log.warn(
              { projectId: projetoId, currentStatus: projeto.status },
              'Attempt to sign project with invalid status for professor signature',
            );
            const err = new Error(`Projeto com status \'${projeto.status}\' não pode ser assinado pelo professor. Deve estar em Rascunho ou Aguardando Assinatura do Professor.`);
            (err as any).status = 400;
            throw err;
          }

          const [newSignature] = await tx
            .insert(assinaturaDocumentoTable)
            .values({
              assinaturaData,
              tipoAssinatura: 'PROJETO_PROFESSOR_RESPONSAVEL',
              userId: userNumericId, // Use the parsed numeric ID
              projetoId,
            })
            .returning();

          if (!newSignature) {
            throw new Error('Erro ao salvar assinatura do professor.');
          }

          const [updatedProjeto] = await tx
            .update(projetoTable)
            .set({
              status: projetoStatusEnum.enumValues[1], // SUBMITTED
              updatedAt: new Date(),
            })
            .where(eq(projetoTable.id, projetoId))
            .returning();

          if (!updatedProjeto) {
            throw new Error('Erro ao atualizar status do projeto após assinatura.');
          }

          // Send email notification to all admins
          try {
            const admins = await tx.query.userTable.findMany({
              where: eq(userTable.role, 'admin'),
            });
            const adminEmails = admins
              .map((admin) => admin.email)
              .filter((email): email is string => !!email && email.length > 0);

            if (adminEmails.length > 0) {
              const professor = await tx.query.professorTable.findFirst({
                where: eq(
                  professorTable.id,
                  updatedProjeto.professorResponsavelId,
                ),
              });
              const departamento = await tx.query.departamentoTable.findFirst({
                where: eq(
                  departamentoTable.id,
                  updatedProjeto.departamentoId,
                ),
              });

              await emailService.sendProjetoSubmetidoParaAdminsNotification(
                {
                  professorNome:
                    professor?.nomeCompleto || 'Professor Desconhecido',
                  projetoTitulo: updatedProjeto.titulo,
                  projetoId: updatedProjeto.id,
                  departamento: departamento?.nome,
                  semestre: updatedProjeto.semestre,
                  ano: updatedProjeto.ano,
                },
                adminEmails,
              );
              log.info(
                { projectId: projetoId, adminCount: adminEmails.length },
                'Notification of submission sent to administrators',
              );
            } else {
              log.warn(
                { projectId: projetoId },
                'No administrators found to send notification',
              );
            }
          } catch (emailError) {
            log.error(
              { emailError, projectId: projetoId },
              'Error sending submission notification, but the project was submitted successfully',
            );
          }

          log.info(
            {
              projectId: projetoId,
              userId: userNumericId,
              signatureId: newSignature.id,
            },
            'Professor signature submitted and project status updated',
          );
          return { success: true, projeto: updatedProjeto, signatureId: newSignature.id };
        });

        return json(result, { status: 200 });

      } catch (error: any) {
        log.error(
          error,
          'Error processing professor signature for project transaction',
          {
            projectId: projetoId,
            userIdAttempting: userNumericId,
          },
        );
        // Custom error with status thrown from transaction
        if (error.status) {
          return json({ error: error.message }, { status: error.status });
        }
        // Errors thrown by Drizzle or transaction itself (like the new Error() ones)
        if (error.message === 'Erro ao salvar assinatura do professor.' || 
            error.message === 'Erro ao atualizar status do projeto após assinatura.') {
            return json({ error: error.message }, { status: 500 });
        }
        return json(
          { error: 'Erro interno ao processar assinatura do professor.' },
          { status: 500 },
        );
      }
    }),
  ),
}); 