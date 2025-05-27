import { db } from '@/server/database';
import { projetoTable } from '@/server/database/schema';
import { sendEmail } from '@/server/lib/emailService';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'ProjetoNotifySigning',
});

const notifySigningSchema = z.object({
  message: z.string().optional(),
});

export const APIRoute = createAPIFileRoute('/api/projeto/[id]/notify-signing')({
  POST: createAPIHandler(
    withRoleMiddleware(['professor', 'admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.projetoId);
        const userId = ctx.state.user.userId;

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const body = await ctx.request.json();
        const validatedData = notifySigningSchema.parse(body);

        // Verificar se o projeto existe
        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
          with: {
            professorResponsavel: {
              with: {
                user: true,
              },
            },
            departamento: true,
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

        // Enviar email de notificação para o professor responsável
        await sendEmail({
          to: projeto.professorResponsavel.user.email,
          subject: 'Assinatura Necessária - Proposta de Monitoria',
          html: `
            <h2>Assinatura Necessária</h2>
            <p>Sua proposta de monitoria foi gerada e precisa ser assinada:</p>
            <p><strong>Título:</strong> ${projeto.titulo}</p>
            <p><strong>Departamento:</strong> ${projeto.departamento?.nome || 'N/A'}</p>
            <p><strong>Ano/Semestre:</strong> ${projeto.ano}.${projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}</p>
            
            <h3>Próximos passos:</h3>
            <ol>
              <li>Faça o download do PDF da proposta no sistema</li>
              <li>Assine digitalmente o documento</li>
              <li>Faça o upload do documento assinado no sistema</li>
            </ol>
            
            ${validatedData.message ? `<p><strong>Observação:</strong> ${validatedData.message}</p>` : ''}
            
            <p>Acesse o sistema para realizar a assinatura.</p>
          `,
        });

        log.info(
          {
            projetoId,
            professorEmail: projeto.professorResponsavel.user.email,
            userId,
          },
          'Notificação de assinatura enviada ao professor',
        );

        return json(
          { message: 'Notificação enviada com sucesso' },
          { status: 200 },
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao enviar notificação de assinatura');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
});
