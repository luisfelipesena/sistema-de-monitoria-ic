import { db } from '@/server/database';
import {
  alunoTable,
  disciplinaProfessorResponsavelTable,
  professorTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { getCurrentSemester } from '@/utils/get-current-semester';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';

import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'onboarding status',
});

// Schema for onboarding status response
export const onboardingStatusSchema = z.object({
  pending: z
    .boolean()
    .describe('Indica se o usuário ainda precisa completar o onboarding'),
  profile: z.object({
    exists: z.boolean().describe('Se o perfil do usuário existe'),
    type: z.enum(['student', 'professor', 'admin']).optional(),
  }),
  documents: z.object({
    required: z.array(z.string()).describe('Documentos obrigatórios'),
    uploaded: z.array(z.string()).describe('Documentos já enviados'),
    missing: z.array(z.string()).describe('Documentos em falta'),
  }),
  disciplinas: z
    .object({
      configured: z
        .boolean()
        .describe(
          'Indica se o professor configurou suas disciplinas para o semestre',
        ),
    })
    .optional(),
});

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

// Definir documentos obrigatórios por tipo de usuário
const REQUIRED_DOCUMENTS = {
  student: ['comprovante_matricula', 'historico_escolar'],
  professor: ['curriculum_vitae', 'comprovante_vinculo'],
} as const;

export const APIRoute = createAPIFileRoute('/api/onboarding/status')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const userRole = ctx.state.user.role;
        const userId = parseInt(ctx.state.user.userId);

        // Admin não precisa de onboarding
        if (userRole === 'admin') {
          return json({
            pending: false,
            profile: { exists: true, type: 'admin' },
            documents: { required: [], uploaded: [], missing: [] },
          });
        }

        // Verificar se existe perfil
        let hasProfile = false;
        let profileData: any = null;
        let hasDisciplinas = false;

        if (userRole === 'student') {
          profileData = await db.query.alunoTable.findFirst({
            where: eq(alunoTable.userId, userId),
          });
          hasProfile = !!profileData;
        } else if (userRole === 'professor') {
          profileData = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, userId),
          });
          hasProfile = !!profileData;

          if (hasProfile) {
            const { year, semester } = getCurrentSemester();
            const result =
              await db.query.disciplinaProfessorResponsavelTable.findFirst({
                where: and(
                  eq(
                    disciplinaProfessorResponsavelTable.professorId,
                    profileData.id,
                  ),
                  eq(disciplinaProfessorResponsavelTable.ano, year),
                  eq(disciplinaProfessorResponsavelTable.semestre, semester),
                ),
              });
            hasDisciplinas = !!result;
          }
        }

        // Verificar documentos obrigatórios
        const requiredDocs =
          REQUIRED_DOCUMENTS[userRole as keyof typeof REQUIRED_DOCUMENTS] || [];

        // Verificar documentos já enviados baseado nos fileIds nos perfis
        const uploadedDocTypes: string[] = [];

        // Para estudantes, verificar se tem documentos obrigatórios no perfil
        if (userRole === 'student' && profileData) {
          if (profileData.comprovanteMatriculaFileId) {
            uploadedDocTypes.push('comprovante_matricula');
          }
          if (profileData.historicoEscolarFileId) {
            uploadedDocTypes.push('historico_escolar');
          }
        }

        // Para professores, verificar documentos no perfil
        if (userRole === 'professor' && profileData) {
          if (profileData.curriculumVitaeFileId) {
            uploadedDocTypes.push('curriculum_vitae');
          }
          if (profileData.comprovanteVinculoFileId) {
            uploadedDocTypes.push('comprovante_vinculo');
          }
        }

        const uniqueUploadedDocs = [...new Set(uploadedDocTypes)];
        const missingDocs = requiredDocs.filter(
          (doc) => !uniqueUploadedDocs.includes(doc),
        );

        // Onboarding está pendente se não tem perfil OU se faltam documentos obrigatórios
        let pending = !hasProfile || missingDocs.length > 0;
        if (userRole === 'professor') {
          pending = pending || !hasDisciplinas;
        }

        return json({
          pending,
          profile: {
            exists: hasProfile,
            type: userRole as 'student' | 'professor' | 'admin',
          },
          documents: {
            required: requiredDocs,
            uploaded: uniqueUploadedDocs,
            missing: missingDocs,
          },
          ...(userRole === 'professor' && {
            disciplinas: { configured: hasDisciplinas },
          }),
        });
      } catch (error) {
        log.error({ error }, 'Erro ao verificar status de onboarding');
        return json(
          { error: 'Erro ao verificar status de onboarding' },
          { status: 500 },
        );
      }
    }),
  ),
});
