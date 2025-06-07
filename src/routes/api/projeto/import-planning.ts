import { db } from '@/server/database';
import * as schema from '@/server/database/schema';
import { createAPIHandler, withRoleMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import * as xlsx from 'xlsx';
import { insertProjetoTableSchema } from '@/server/database/schema';

const log = logger.child({
  context: 'ImportPlanningAPI',
});

// Zod schema for a single row from the Excel file
const planningRowSchema = z.object({
  CODIGO_DISCIPLINA: z.string(),
  NOME_DISCIPLINA: z.string(),
  DEPARTAMENTO_SIGLA: z.string(),
  PROFESSOR_RESPONSAVEL_EMAIL: z.string().email(),
  CARGA_HORARIA_SEMANAL: z.number().int().positive(),
  NUMERO_SEMANAS: z.number().int().positive(),
  TITULO_PROJETO: z.string(),
  DESCRICAO_PROJETO: z.string(),
  PUBLICO_ALVO: z.string(),
});

type PlanningRow = z.infer<typeof planningRowSchema>;

export const APIRoute = createAPIFileRoute('/api/projeto/import-planning')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const { semestre, ano, file } = await ctx.request.json();
        const { user } = ctx.state;

        const buffer = Buffer.from(file.split(',')[1], 'base64');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet) as PlanningRow[];

        const validation = z.array(planningRowSchema).safeParse(data);
        if (!validation.success) {
          log.error(validation.error, 'Excel data validation failed');
          return json(
            {
              error: 'Invalid file format or data.',
              details: validation.error.format(),
            },
            { status: 400 },
          );
        }

        const validatedData = validation.data;
        const createdProjects = [];
        const errors: string[] = [];

        const disciplineCodes = validatedData.map(
          (row) => row.CODIGO_DISCIPLINA,
        );
        const professorEmails = validatedData.map(
          (row) => row.PROFESSOR_RESPONSAVEL_EMAIL,
        );

        const existingDisciplinas = await db.query.disciplinaTable.findMany({
          where: inArray(schema.disciplinaTable.codigo, disciplineCodes),
        });

        const existingProfessors = await db.query.professorTable.findMany({
          where: inArray(
            schema.professorTable.emailInstitucional,
            professorEmails,
          ),
        });

        for (const row of validatedData) {
          const disciplina = existingDisciplinas.find(
            (d) => d.codigo === row.CODIGO_DISCIPLINA,
          );
          if (!disciplina) {
            errors.push(
              `Disciplina com código ${row.CODIGO_DISCIPLINA} não encontrada.`,
            );
            continue;
          }

          const professor = existingProfessors.find(
            (p) => p.emailInstitucional === row.PROFESSOR_RESPONSAVEL_EMAIL,
          );
          if (!professor) {
            errors.push(
              `Professor com email ${row.PROFESSOR_RESPONSAVEL_EMAIL} não encontrado.`,
            );
            continue;
          }

          const template = await db.query.projetoTemplateTable.findFirst({
            where: eq(schema.projetoTemplateTable.disciplinaId, disciplina.id),
          });

          const newProjectData = insertProjetoTableSchema.parse({
            titulo: row.TITULO_PROJETO || template?.tituloDefault,
            descricao: row.DESCRICAO_PROJETO || template?.descricaoDefault,
            departamentoId: disciplina.departamentoId,
            ano: parseInt(ano, 10),
            semestre,
            tipoProposicao: 'INDIVIDUAL',
            cargaHorariaSemana:
              row.CARGA_HORARIA_SEMANAL ||
              template?.cargaHorariaSemanaDefault,
            numeroSemanas:
              row.NUMERO_SEMANAS || template?.numeroSemanasDefault,
            publicoAlvo: row.PUBLICO_ALVO || template?.publicoAlvoDefault,
            professorResponsavelId: professor.id,
            status: 'PENDING_PROFESSOR_SIGNATURE',
          });

          const [newProject] = await db
            .insert(schema.projetoTable)
            .values(newProjectData)
            .returning();

          await db.insert(schema.projetoDisciplinaTable).values({
            projetoId: newProject.id,
            disciplinaId: disciplina.id,
          });

          createdProjects.push(newProject);
        }

        log.info(`Successfully created ${createdProjects.length} projects.`);
        if (errors.length > 0) {
          log.warn({ errors }, 'Some projects could not be created');
          return json(
            {
              message: `${createdProjects.length} projects created. Some rows had errors.`,
              created: createdProjects,
              errors,
            },
            { status: 207 },
          );
        }

        return json(
          { message: 'All projects created successfully', created: createdProjects },
          { status: 201 },
        );
      } catch (error) {
        log.error(error, 'Error importing planning');
        return json({ error: 'Failed to import planning data.' }, { status: 500 });
      }
    }),
  ),
}); 