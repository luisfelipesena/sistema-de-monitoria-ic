import { db } from '@/server/database';
import { alunoTable, insertAlunoTableSchema, selectAlunoTableSchema } from '@/server/database/schema';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'aluno',
});

// Schema estendido para incluir campos de upload
const alunoInputSchema = insertAlunoTableSchema.extend({
  historicoEscolarFileId: z.string().optional(),
  comprovanteMatriculaFileId: z.string().optional(),
});

// Schema for response to ensure type safety
export const alunoResponseSchema = selectAlunoTableSchema;

export type AlunoResponse = z.infer<typeof alunoResponseSchema>;
export type AlunoInput = z.infer<typeof alunoInputSchema>;

export const APIRoute = createAPIFileRoute('/api/aluno')({
  // GET: Obter dados do aluno autenticado
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, parseInt(ctx.state.user.userId)),
        });

        if (!aluno) {
          return json({ error: 'Aluno não encontrado' }, { status: 404 });
        }

        // Validate the response with Zod
        const validatedAluno = alunoResponseSchema.parse(aluno);

        return json(validatedAluno);
      } catch (error) {
        log.error({ error }, 'Erro ao buscar aluno');
        return json(
          { error: 'Erro ao buscar dados do aluno' },
          { status: 500 }
        );
      }
    })
  ),

  // POST: Criar ou atualizar dados do aluno
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const body = await ctx.request.json();

        // Validate the input with Zod
        const validatedInput = alunoInputSchema.parse(body);

        // Extrair os campos de upload antes de inserir no banco
        const { historicoEscolarFileId, comprovanteMatriculaFileId, ...alunoData } = validatedInput;

        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, parseInt(ctx.state.user.userId)),
        });

        let result;

        // TODO: Armazenar IDs de arquivos em uma tabela de documentos relacionada
        // por enquanto apenas registramos o aluno
        if (!aluno) {
          // Criar novo aluno
          result = await db
            .insert(alunoTable)
            .values({
              ...alunoData,
              userId: parseInt(ctx.state.user.userId),
            })
            .returning();
        } else {
          // Atualizar aluno existente
          result = await db
            .update(alunoTable)
            .set(alunoData)
            .where(eq(alunoTable.id, aluno.id))
            .returning();
        }

        // Validate the response with Zod
        const validatedAluno = alunoResponseSchema.parse(result[0]);

        return json(validatedAluno, { status: 201 });
      } catch (error) {
        log.error({ error }, 'Erro ao salvar aluno');

        if (error instanceof z.ZodError) {
          return json(
            {
              error: 'Dados inválidos',
              details: error.errors
            },
            { status: 400 }
          );
        }

        return json(
          { error: 'Erro ao salvar dados do aluno' },
          { status: 500 }
        );
      }
    })
  ),
}); 