import { disciplinaComProfessorSchema } from '@/routes/api/disciplina/-types';
import { db } from '@/server/database';
import {
  disciplinaProfessorResponsavelTable,
  disciplinaTable,
  professorTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'DisciplinaAPI',
});

const disciplinaInputSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  departamentoId: z.number().min(1, 'Departamento é obrigatório'),
});

export const APIRoute = createAPIFileRoute('/api/disciplina')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const url = new URL(ctx.request.url);
        const departamentoId = url.searchParams.get('departamentoId');
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const currentSemester = currentMonth <= 6 ? 'SEMESTRE_1' : 'SEMESTRE_2';

        let whereCondition;
        if (departamentoId) {
          whereCondition = eq(
            disciplinaTable.departamentoId,
            parseInt(departamentoId),
          );
        } else {
          // Se não especificar departamento, buscar apenas disciplinas não deletadas
          whereCondition = isNull(disciplinaTable.deletedAt);
        }

        // Buscar as disciplinas
        const disciplinas = await db
          .select({
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
            departamentoId: disciplinaTable.departamentoId,
            createdAt: disciplinaTable.createdAt,
            updatedAt: disciplinaTable.updatedAt,
            deletedAt: disciplinaTable.deletedAt,
          })
          .from(disciplinaTable)
          .where(whereCondition)
          .orderBy(disciplinaTable.nome);

        // Buscar vínculos de professores para o semestre atual
        const disciplinaIds = disciplinas.map((d) => d.id);

        const vinculos = await db
          .select({
            disciplinaId: disciplinaProfessorResponsavelTable.disciplinaId,
            professorId: disciplinaProfessorResponsavelTable.professorId,
            professorNome: professorTable.nomeCompleto,
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
              disciplinaIds.length > 0
                ? inArray(
                    disciplinaProfessorResponsavelTable.disciplinaId,
                    disciplinaIds,
                  )
                : undefined,
              eq(disciplinaProfessorResponsavelTable.ano, currentYear),
              eq(disciplinaProfessorResponsavelTable.semestre, currentSemester),
            ),
          );

        // Criar mapa de professores por disciplina
        const professorPorDisciplina = new Map();
        vinculos.forEach((v) => {
          professorPorDisciplina.set(v.disciplinaId, {
            professorResponsavel: v.professorNome,
            professorResponsavelId: v.professorId,
          });
        });

        // Combinar os dados
        const disciplinasComProfessor = disciplinas.map((disciplina) => {
          const professorInfo = professorPorDisciplina.get(disciplina.id) || {
            professorResponsavel: null,
            professorResponsavelId: null,
          };

          return {
            ...disciplina,
            ...professorInfo,
          };
        });

        log.info(
          { count: disciplinasComProfessor.length },
          'Disciplinas recuperadas com sucesso',
        );
        return json(
          z.array(disciplinaComProfessorSchema).parse(disciplinasComProfessor),
          {
            status: 200,
          },
        );
      } catch (error) {
        log.error(error, 'Erro ao recuperar disciplinas');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),

  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const validatedData = disciplinaInputSchema.parse(body);

        const result = await db
          .insert(disciplinaTable)
          .values({
            nome: validatedData.nome,
            codigo: validatedData.codigo,
            departamentoId: validatedData.departamentoId,
          })
          .returning();

        return json(result[0], { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao criar disciplina');
        return json({ error: 'Erro ao criar disciplina' }, { status: 500 });
      }
    }),
  ),
});
