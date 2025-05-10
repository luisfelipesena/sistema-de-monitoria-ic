import { db } from '@/server/database';
import { alunoTable, professorTable } from '@/server/database/schema';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'onboarding status',
});

// Schema for onboarding status response
export const onboardingStatusSchema = z.object({
  pending: z.boolean().describe('Indica se o usuário ainda precisa completar o onboarding'),
});

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export const APIRoute = createAPIFileRoute('/api/onboarding/status')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        // Verificar o papel do usuário
        const userRole = ctx.state.user.role;

        // Admin não precisa de onboarding
        if (userRole === 'admin') {
          return json({ pending: false });
        }

        // Verificar se o usuário já completou o onboarding
        // Exemplo: verificar se existe um registro de aluno ou professor para o usuário
        let hasProfile = false;

        if (userRole === 'student') {
          // Verificar se existe perfil de aluno
          const aluno = await db.query.alunoTable.findFirst({
            where: eq(alunoTable.userId, parseInt(ctx.state.user.userId)),
          });
          hasProfile = !!aluno;
        } else if (userRole === 'professor') {
          // Verificar se existe perfil de professor
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, parseInt(ctx.state.user.userId)),
          });
          hasProfile = !!professor;
        }

        // O onboarding está pendente se o usuário não tiver perfil
        return json({ pending: !hasProfile });
      } catch (error) {
        log.error({ error }, 'Erro ao verificar status de onboarding');
        return json(
          { error: 'Erro ao verificar status de onboarding' },
          { status: 500 }
        );
      }
    })
  ),
}); 