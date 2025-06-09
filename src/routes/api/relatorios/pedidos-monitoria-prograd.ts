import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { z } from 'zod';
import { progradReportService } from '@/server/lib/relatorios/prograd';
import { semestreEnum } from '@/server/database/schema';

const log = logger.child({
  context: 'PedidosMonitoriaProgradAPI',
});

const pedidosParamsSchema = z.object({
  ano: z
    .string()
    .transform(Number)
    .optional()
    .default(new Date().getFullYear().toString()),
  semestre: z
    .enum(semestreEnum.enumValues)
    .optional()
    .default(
      new Date().getMonth() <= 5 ? 'SEMESTRE_1' : 'SEMESTRE_2',
    ),
  departamentoId: z.string().transform(Number).optional(),
});

export const APIRoute = createAPIFileRoute(
  '/api/relatorios/pedidos-monitoria-prograd',
)({
  GET: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const url = new URL(ctx.request.url);
        const queryParams = Object.fromEntries(url.searchParams);
        const { ano, semestre, departamentoId } =
          pedidosParamsSchema.parse(queryParams);

        const excelBuffer =
          await progradReportService.generatePedidosMonitoriaReport(
            ano,
            semestre,
            departamentoId,
          );

        const fileName = `pedidos-monitoria-prograd-${ano}-${semestre === 'SEMESTRE_1' ? '1' : '2'}${departamentoId ? `-dept${departamentoId}` : '-todos'}.xlsx`;

        return new Response(new Uint8Array(excelBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return json(
            {
              error: 'Parâmetros de requisição inválidos',
              details: error.errors,
            },
            { status: 400 },
          );
        }

        // Catch the specific error from the service
        if (error.message.includes('Nenhum projeto encontrado')) {
          return json({ message: error.message }, { status: 404 });
        }

        log.error(
          error,
          'Erro ao gerar planilha de Pedidos de Monitoria PROGRAD',
        );
        return json({ error: 'Erro ao gerar planilha' }, { status: 500 });
      }
    }),
  ),
}); 