import { db } from '@/server/database';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { vagaTable, projetoTable } from '@/server/database/schema';

const log = logger.child({
  context: 'PublishResultsDataAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/publish-results-data')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
          with: {
            vagas: { with: { aluno: true } },
            departamento: true,
          },
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        const aprovados = projeto.vagas.map(vaga => ({
            nome: vaga.aluno.nomeCompleto,
            matricula: vaga.aluno.matricula,
            tipoVaga: vaga.tipo === 'BOLSISTA' ? 'Bolsista' : 'Voluntário' as 'Bolsista' | 'Voluntário'
        }));

        const resultadoData = {
          projetoTitulo: projeto.titulo,
          departamento: projeto.departamento.nome,
          semestre: `${projeto.ano}.${projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}`,
          dataPublicacao: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          aprovados,
        };

        return json(resultadoData, { status: 200 });

      } catch (error) {
        log.error(error, 'Erro ao gerar dados do resultado');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
}); 