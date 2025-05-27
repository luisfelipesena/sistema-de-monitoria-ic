import { db } from '@/server/database';
import { projetoDocumentoTable, projetoTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'ProjetoDocuments',
});

export const documentResponseSchema = z.object({
  id: z.number(),
  fileId: z.string(),
  tipoDocumento: z.enum([
    'PROPOSTA_ORIGINAL',
    'PROPOSTA_ASSINADA_PROFESSOR',
    'PROPOSTA_ASSINADA_ADMIN',
    'ATA_SELECAO',
  ]),
  assinadoPor: z
    .object({
      id: z.number(),
      username: z.string(),
      email: z.string(),
      role: z.enum(['admin', 'professor', 'student']),
    })
    .nullable(),
  observacoes: z.string().nullable(),
  createdAt: z.date(),
});

export type DocumentResponse = z.infer<typeof documentResponseSchema>;

export const APIRoute = createAPIFileRoute('/api/projeto/$id/documents')(
  {
    GET: createAPIHandler(
      withRoleMiddleware(['professor', 'admin'], async (ctx) => {
        try {
          const projetoId = parseInt(ctx.params.projetoId);
          const userId = ctx.state.user.userId;

          if (isNaN(projetoId)) {
            return json({ error: 'ID do projeto inválido' }, { status: 400 });
          }

          // Verificar se o projeto existe
          const projeto = await db.query.projetoTable.findFirst({
            where: eq(projetoTable.id, projetoId),
            with: {
              professorResponsavel: {
                with: {
                  user: true,
                },
              },
            },
          });

          if (!projeto) {
            return json({ error: 'Projeto não encontrado' }, { status: 404 });
          }

          // Verificar permissões (professor só pode ver seus próprios projetos)
          if (ctx.state.user.role === 'professor') {
            if (projeto.professorResponsavel.userId !== parseInt(userId)) {
              return json({ error: 'Acesso negado' }, { status: 403 });
            }
          }

          // Buscar todos os documentos do projeto
          const documentos = await db.query.projetoDocumentoTable.findMany({
            where: eq(projetoDocumentoTable.projetoId, projetoId),
            with: {
              assinadoPor: true,
            },
            orderBy: (table, { desc }) => [desc(table.createdAt)],
          });

          const documentosFormatados = documentos.map((doc) => ({
            id: doc.id,
            fileId: doc.fileId,
            tipoDocumento: doc.tipoDocumento,
            assinadoPor: doc.assinadoPor
              ? {
                  id: doc.assinadoPor.id,
                  username: doc.assinadoPor.username,
                  email: doc.assinadoPor.email,
                  role: doc.assinadoPor.role,
                }
              : null,
            observacoes: doc.observacoes,
            createdAt: doc.createdAt,
          }));

          const validatedDocuments = z
            .array(documentResponseSchema)
            .parse(documentosFormatados);

          log.info(
            {
              projetoId,
              userId,
              documentCount: documentos.length,
            },
            'Documentos do projeto listados com sucesso',
          );

          return json(validatedDocuments, { status: 200 });
        } catch (error) {
          log.error(error, 'Erro ao buscar documentos do projeto');
          return json({ error: 'Erro interno do servidor' }, { status: 500 });
        }
      }),
    ),
  },
);
