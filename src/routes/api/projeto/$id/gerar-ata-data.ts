import { db } from '@/server/database';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { inscricaoTable, projetoTable } from '@/server/database/schema';

const log = logger.child({
  context: 'GerarAtaDataAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/gerar-ata-data')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        
        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
          with: {
            professorResponsavel: true,
            departamento: true,
          },
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        const inscricoes = await db.query.inscricaoTable.findMany({
            where: eq(inscricaoTable.projetoId, projetoId),
            with: { aluno: true },
            orderBy: [desc(inscricaoTable.notaFinal)],
        });
        
        let bolsasAlocadas = projeto.bolsasDisponibilizadas || 0;
        let voluntariosAlocados = projeto.voluntariosSolicitados || 0;
        let classificacao = 1;

        const candidatos = inscricoes.map(inscricao => {
            let status: 'Aprovado (Bolsista)' | 'Aprovado (Voluntário)' | 'Reprovado' = 'Reprovado';
            if (bolsasAlocadas > 0) {
                status = 'Aprovado (Bolsista)';
                bolsasAlocadas--;
            } else if (voluntariosAlocados > 0) {
                status = 'Aprovado (Voluntário)';
                voluntariosAlocados--;
            }

            return {
                classificacao: classificacao++,
                nome: inscricao.aluno.nomeCompleto,
                matricula: inscricao.aluno.matricula,
                notaFinal: parseFloat(inscricao.notaFinal || '0'),
                status,
            };
        });

        const ataData = {
          projetoTitulo: projeto.titulo,
          departamento: projeto.departamento.nome,
          semestre: `${projeto.ano}.${projeto.semestre === 'SEMESTRE_1' ? 1 : 2}`,
          dataReuniao: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          professorResponsavel: projeto.professorResponsavel.nomeCompleto,
          candidatos,
        };

        return json(ataData, { status: 200 });

      } catch (error) {
        log.error(error, 'Erro ao gerar dados da ata');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
}); 