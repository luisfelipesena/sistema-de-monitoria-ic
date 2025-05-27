import { db } from '@/server/database';
import {
  disciplinaProfessorResponsavelTable,
  professorTable,
} from '@/server/database/schema';
import { createAPIHandler } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'DisciplinaProfessorAPI',
});

const paramsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

export type DisciplinaProfessorParams = z.infer<typeof paramsSchema>;

export const responseSchema = z
  .object({
    id: z.number(),
    nomeCompleto: z.string(),
    emailInstitucional: z.string(),
    departamentoId: z.number(),
    matriculaSiape: z.string().optional(),
    regime: z.enum(['20H', '40H', 'DE']),
  })
  .nullable();

export type DisciplinaProfessorResponse = z.infer<typeof responseSchema>;

export const APIRoute = createAPIFileRoute('/api/disciplina/$id/professor')({
  GET: createAPIHandler(async (ctx) => {
    try {
      const params = paramsSchema.parse(ctx.params);
      const currentYear = new Date().getFullYear();
      const currentSemester =
        new Date().getMonth() <= 6 ? 'SEMESTRE_1' : 'SEMESTRE_2';

      log.info(
        `Fetching professor for discipline ${params.id} in ${currentYear}.${currentSemester}`,
      );

      const result = await db
        .select({
          id: professorTable.id,
          nomeCompleto: professorTable.nomeCompleto,
          emailInstitucional: professorTable.emailInstitucional,
          departamentoId: professorTable.departamentoId,
          matriculaSiape: professorTable.matriculaSiape,
          regime: professorTable.regime,
        })
        .from(disciplinaProfessorResponsavelTable)
        .innerJoin(
          professorTable,
          eq(
            disciplinaProfessorResponsavelTable.professorId,
            professorTable.id,
          ),
        )
        .where(
          and(
            eq(disciplinaProfessorResponsavelTable.disciplinaId, params.id),
            eq(disciplinaProfessorResponsavelTable.ano, currentYear),
            eq(disciplinaProfessorResponsavelTable.semestre, currentSemester),
          ),
        )
        .limit(1);

      const professor = result[0] || null;

      log.info(`Found professor: ${professor?.nomeCompleto || 'none'}`);
      return json(professor, { status: 200 });
    } catch (error) {
      log.error(error, 'Error fetching professor for discipline');
      return json({ error: 'Failed to fetch professor' }, { status: 500 });
    }
  }),
});
