import { vagaDisponivelSchema } from '@/routes/api/monitoria/-types';
import { db } from '@/server/database';
import {
  disciplinaTable,
  projetoDisciplinaTable,
  projetoTable,
  vagaTable,
} from '@/server/database/schema';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, sql } from 'drizzle-orm';

const log = logger.child({ context: 'MonitoriaVagasAPI' });

export const APIRoute = createAPIFileRoute('/api/monitoria/vagas')({
  GET: async () => {
    try {
      // Buscar todos os projetos aprovados
      const projetos = await db
        .select({
          projetoId: projetoTable.id,
          disciplinaNome: disciplinaTable.nome,
          disciplinaCodigo: disciplinaTable.codigo,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
        })
        .from(projetoTable)
        .innerJoin(
          projetoDisciplinaTable,
          eq(projetoDisciplinaTable.projetoId, projetoTable.id),
        )
        .innerJoin(
          disciplinaTable,
          eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId),
        )
        .where(eq(projetoTable.status, 'APPROVED'));

      // Obter quantidade de vagas já ocupadas por projeto/tipo
      const vagaStats = await db
        .select({
          projetoId: vagaTable.projetoId,
          tipo: vagaTable.tipo,
          total: sql<number>`count(*)`,
        })
        .from(vagaTable)
        .groupBy(vagaTable.projetoId, vagaTable.tipo);

      const ocupadasMap = new Map<string, number>();
      vagaStats.forEach((v: any) => {
        ocupadasMap.set(`${v.projetoId}_${v.tipo}`, Number(v.total));
      });

      const response = projetos.flatMap((p: any) => {
        const acceptedBolsista =
          ocupadasMap.get(`${p.projetoId}_BOLSISTA`) || 0;
        const acceptedVol = ocupadasMap.get(`${p.projetoId}_VOLUNTARIO`) || 0;

        const vagasDisponiveis: unknown[] = [];

        const dispBol = (p.bolsasDisponibilizadas || 0) - acceptedBolsista;
        if (dispBol > 0) {
          vagasDisponiveis.push(
            vagaDisponivelSchema.parse({
              id: `${p.projetoId}-BOLSISTA`,
              projetoId: p.projetoId,
              nome: p.disciplinaNome,
              codigo: p.disciplinaCodigo,
              tipo: 'BOLSISTA',
              vagas: dispBol,
            }),
          );
        }

        const dispVol = (p.voluntariosSolicitados || 0) - acceptedVol;
        if (dispVol > 0) {
          vagasDisponiveis.push(
            vagaDisponivelSchema.parse({
              id: `${p.projetoId}-VOLUNTARIO`,
              projetoId: p.projetoId,
              nome: p.disciplinaNome,
              codigo: p.disciplinaCodigo,
              tipo: 'VOLUNTARIO',
              vagas: dispVol,
            }),
          );
        }

        return vagasDisponiveis;
      });

      log.info({ count: response.length }, 'Vagas disponíveis retornadas');
      return json(response, { status: 200 });
    } catch (error) {
      log.error(error, 'Erro ao listar vagas');
      return json({ error: 'Erro ao listar vagas' }, { status: 500 });
    }
  },
});
