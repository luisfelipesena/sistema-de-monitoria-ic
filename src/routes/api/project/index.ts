import {
  projectInputSchema,
  projectListItemSchema,
} from '@/routes/api/project/-types';
import { db } from '@/server/database';
import {
  applicationTable,
  departmentTable,
  projectActivityTable,
  projectParticipantTeacherTable,
  projectSubjectTable,
  projectTable,
  subjectTable,
  teacherTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'ProjectAPI',
});

export const APIRoute = createAPIFileRoute('/api/project')({
  // Listar projetos
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const userRole = ctx.state.user.role;

        // Admin pode ver todos os projetos, professor só os seus
        let whereCondition;
        if (userRole === 'professor') {
          // Buscar o professor pelo userId
          const teacher = await db.query.teacherTable.findFirst({
            where: eq(teacherTable.userId, parseInt(ctx.state.user.userId)),
          });

          if (!teacher) {
            return json([], { status: 200 });
          }

          whereCondition = eq(projectTable.professorResponsavelId, teacher.id);
        }

        const projects = await db
          .select({
            id: projectTable.id,
            titulo: projectTable.titulo,
            departamentoId: projectTable.departamentoId,
            departamentoNome: departmentTable.nome,
            professorResponsavelNome: teacherTable.nomeCompleto,
            status: projectTable.status,
            ano: projectTable.ano,
            semestre: projectTable.semestre,
            bolsasSolicitadas: projectTable.bolsasSolicitadas,
            voluntariosSolicitados: projectTable.voluntariosSolicitados,
            bolsasDisponibilizadas: projectTable.bolsasDisponibilizadas,
            createdAt: projectTable.createdAt,
          })
          .from(projectTable)
          .innerJoin(
            departmentTable,
            eq(projectTable.departamentoId, departmentTable.id),
          )
          .innerJoin(
            teacherTable,
            eq(projectTable.professorResponsavelId, teacherTable.id),
          )
          .where(whereCondition)
          .orderBy(projectTable.createdAt);

        // Buscar contagem de inscrições por projeto e tipo
        const applicationsCount = await db
          .select({
            projetoId: applicationTable.projetoId,
            tipoVagaPretendida: applicationTable.tipoVagaPretendida,
            count: sql<number>`count(*)`,
          })
          .from(applicationTable)
          .groupBy(
            applicationTable.projetoId,
            applicationTable.tipoVagaPretendida,
          );

        // Criar mapa de contagens para fácil acesso
        const applicationsMap = new Map<string, number>();
        applicationsCount.forEach(
          (item: {
            projetoId: number;
            tipoVagaPretendida: string;
            count: number;
          }) => {
            const key = `${item.projetoId}_${item.tipoVagaPretendida}`;
            applicationsMap.set(key, Number(item.count));
          },
        );

        // Buscar disciplinas e adicionar contagens para cada projeto
        const projectsWithSubjects = await Promise.all(
          projects.map(async (project: (typeof projects)[0]) => {
            const disciplinas = await db
              .select({
                id: subjectTable.id,
                nome: subjectTable.nome,
                codigo: subjectTable.codigo,
              })
              .from(subjectTable)
              .innerJoin(
                projectSubjectTable,
                eq(subjectTable.id, projectSubjectTable.disciplinaId),
              )
              .where(eq(projectSubjectTable.projetoId, project.id));

            // Calcular contagens de inscritos
            const inscritosBolsista =
              applicationsMap.get(`${project.id}_BOLSISTA`) || 0;
            const inscritosVoluntario =
              applicationsMap.get(`${project.id}_VOLUNTARIO`) || 0;
            const inscritosAny = applicationsMap.get(`${project.id}_ANY`) || 0;
            const totalInscritos =
              inscritosBolsista + inscritosVoluntario + inscritosAny;

            return {
              ...project,
              disciplinas,
              totalInscritos,
              inscritosBolsista,
              inscritosVoluntario,
            };
          }),
        );

        const validatedProjects = z
          .array(projectListItemSchema)
          .parse(projectsWithSubjects);
        return json(validatedProjects);
      } catch (error) {
        log.error({ error }, 'Erro ao buscar projetos');
        return json({ error: 'Erro ao buscar projetos' }, { status: 500 });
      }
    }),
  ),

  // Criar projeto
  POST: createAPIHandler(
    withRoleMiddleware(['professor', 'admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const validatedData = projectInputSchema.parse(body);

        let professorResponsavelId: number;

        if (ctx.state.user.role === 'professor') {
          // Para professores, buscar seu próprio ID
          const teacher = await db.query.teacherTable.findFirst({
            where: eq(teacherTable.userId, parseInt(ctx.state.user.userId)),
          });

          if (!teacher) {
            return json(
              { error: 'Perfil de professor não encontrado' },
              { status: 404 },
            );
          }

          professorResponsavelId = teacher.id;
        } else if (ctx.state.user.role === 'admin') {
          // Para admins, usar o professorResponsavelId fornecido no body
          if (!validatedData.professorResponsavelId) {
            return json(
              { error: 'Admins devem especificar o professor responsável' },
              { status: 400 },
            );
          }

          // Verificar se o professor existe
          const teacher = await db.query.teacherTable.findFirst({
            where: eq(teacherTable.id, validatedData.professorResponsavelId),
          });

          if (!teacher) {
            return json(
              { error: 'Professor responsável não encontrado' },
              { status: 404 },
            );
          }

          professorResponsavelId = validatedData.professorResponsavelId;
        } else {
          return json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        // Extrair campos específicos do projeto
        const {
          disciplinaIds,
          professoresParticipantes,
          atividades,
          ...projectData
        } = validatedData;

        // Criar o projeto
        const [newProject] = await db
          .insert(projectTable)
          .values({
            ...projectData,
            professorResponsavelId,
          })
          .returning();

        // Adicionar disciplinas
        if (disciplinaIds.length > 0) {
          const subjectValues = disciplinaIds.map((disciplinaId: number) => ({
            projetoId: newProject.id,
            disciplinaId,
          }));

          await db.insert(projectSubjectTable).values(subjectValues);
        }

        // Adicionar professores participantes se houver
        if (professoresParticipantes?.length) {
          const participantValues = professoresParticipantes.map(
            (professorId: number) => ({
              projetoId: newProject.id,
              professorId,
            }),
          );

          await db
            .insert(projectParticipantTeacherTable)
            .values(participantValues);
        }

        // Adicionar atividades se houver
        if (atividades?.length) {
          const activityValues = atividades.map((descricao: string) => ({
            projetoId: newProject.id,
            descricao,
          }));

          await db.insert(projectActivityTable).values(activityValues);
        }

        log.info({ projectId: newProject.id }, 'Projeto criado com sucesso');
        return json(newProject, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error({ error }, 'Erro ao criar projeto');
        return json({ error: 'Erro ao criar projeto' }, { status: 500 });
      }
    }),
  ),
});
