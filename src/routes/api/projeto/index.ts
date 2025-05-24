import {
  projetoInputSchema,
  projetoListItemSchema,
} from '@/routes/api/projeto/-types';
import { db } from '@/server/database';
import {
  atividadeProjetoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoProfessorParticipanteTable,
  projetoTable,
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
  context: 'ProjetoAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto')({
  // Listar projetos
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const userRole = ctx.state.user.role;

        // Admin pode ver todos os projetos, professor só os seus
        let whereCondition;
        if (userRole === 'professor') {
          // Buscar o professor pelo userId
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, parseInt(ctx.state.user.userId)),
          });

          if (!professor) {
            return json([], { status: 200 });
          }

          whereCondition = eq(
            projetoTable.professorResponsavelId,
            professor.id,
          );
        }

        const projetos = await db
          .select({
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            departamentoId: projetoTable.departamentoId,
            departamentoNome: departamentoTable.nome,
            professorResponsavelNome: professorTable.nomeCompleto,
            status: projetoTable.status,
            ano: projetoTable.ano,
            semestre: projetoTable.semestre,
            bolsasSolicitadas: projetoTable.bolsasSolicitadas,
            voluntariosSolicitados: projetoTable.voluntariosSolicitados,
            bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
            createdAt: projetoTable.createdAt,
          })
          .from(projetoTable)
          .innerJoin(
            departamentoTable,
            eq(projetoTable.departamentoId, departamentoTable.id),
          )
          .innerJoin(
            professorTable,
            eq(projetoTable.professorResponsavelId, professorTable.id),
          )
          .where(whereCondition)
          .orderBy(projetoTable.createdAt);

        // Buscar contagem de inscrições por projeto e tipo
        const inscricoesCount = await db
          .select({
            projetoId: inscricaoTable.projetoId,
            tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
            count: sql<number>`count(*)`,
          })
          .from(inscricaoTable)
          .groupBy(inscricaoTable.projetoId, inscricaoTable.tipoVagaPretendida);

        // Criar mapa de contagens para fácil acesso
        const inscricoesMap = new Map<string, number>();
        inscricoesCount.forEach((item) => {
          const key = `${item.projetoId}_${item.tipoVagaPretendida}`;
          inscricoesMap.set(key, Number(item.count));
        });

        // Buscar disciplinas e adicionar contagens para cada projeto
        const projetosComDisciplinas = await Promise.all(
          projetos.map(async (projeto) => {
            const disciplinas = await db
              .select({
                id: disciplinaTable.id,
                nome: disciplinaTable.nome,
                codigo: disciplinaTable.codigo,
              })
              .from(disciplinaTable)
              .innerJoin(
                projetoDisciplinaTable,
                eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId),
              )
              .where(eq(projetoDisciplinaTable.projetoId, projeto.id));

            // Calcular contagens de inscritos
            const inscritosBolsista =
              inscricoesMap.get(`${projeto.id}_BOLSISTA`) || 0;
            const inscritosVoluntario =
              inscricoesMap.get(`${projeto.id}_VOLUNTARIO`) || 0;
            const inscritosAny = inscricoesMap.get(`${projeto.id}_ANY`) || 0;
            const totalInscritos =
              inscritosBolsista + inscritosVoluntario + inscritosAny;

            return {
              ...projeto,
              disciplinas,
              totalInscritos,
              inscritosBolsista,
              inscritosVoluntario,
            };
          }),
        );

        const validatedProjetos = z
          .array(projetoListItemSchema)
          .parse(projetosComDisciplinas);
        return json(validatedProjetos);
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
        const validatedData = projetoInputSchema.parse(body);

        // Buscar o professor responsável
        const professor = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, parseInt(ctx.state.user.userId)),
        });

        if (!professor && ctx.state.user.role === 'professor') {
          return json(
            { error: 'Perfil de professor não encontrado' },
            { status: 404 },
          );
        }

        if (!professor && ctx.state.user.role === 'admin') {
          return json(
            { error: 'Admins devem especificar o professor responsável' },
            { status: 400 },
          );
        }

        // Extrair campos específicos do projeto
        const {
          disciplinaIds,
          professoresParticipantes,
          atividades,
          ...projetoData
        } = validatedData;

        // Criar o projeto
        const [novoProjeto] = await db
          .insert(projetoTable)
          .values({
            ...projetoData,
            professorResponsavelId: professor!.id,
          })
          .returning();

        // Adicionar disciplinas
        if (disciplinaIds.length > 0) {
          const disciplinaValues = disciplinaIds.map(
            (disciplinaId: number) => ({
              projetoId: novoProjeto.id,
              disciplinaId,
            }),
          );

          await db.insert(projetoDisciplinaTable).values(disciplinaValues);
        }

        // Adicionar professores participantes se houver
        if (professoresParticipantes?.length) {
          const participanteValues = professoresParticipantes.map(
            (professorId: number) => ({
              projetoId: novoProjeto.id,
              professorId,
            }),
          );

          await db
            .insert(projetoProfessorParticipanteTable)
            .values(participanteValues);
        }

        // Adicionar atividades se houver
        if (atividades?.length) {
          const atividadeValues = atividades.map((descricao: string) => ({
            projetoId: novoProjeto.id,
            descricao,
          }));

          await db.insert(atividadeProjetoTable).values(atividadeValues);
        }

        log.info({ projetoId: novoProjeto.id }, 'Projeto criado com sucesso');
        return json(novoProjeto, { status: 201 });
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
