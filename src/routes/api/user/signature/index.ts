import { db } from '@/server/database';
import { userTable, professorTable } from '@/server/database/schema';
import { 
  createAPIHandler, 
  withAuthMiddleware 
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'UserSignatureAPI',
});

const signatureInputSchema = z.object({
  signatureData: z.string().min(1, 'Dados da assinatura são obrigatórios'),
});

export const signatureResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  signatureData: z.string().optional(),
  dataAssinatura: z.string().optional(),
});

export type SignatureInput = z.infer<typeof signatureInputSchema>;
export type SignatureResponse = z.infer<typeof signatureResponseSchema>;

export const APIRoute = createAPIFileRoute('/api/user/signature')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const userId = parseInt(ctx.state.user.userId);
        const userRole = ctx.state.user.role;

        if (userRole === 'admin') {
          const user = await db.query.userTable.findFirst({
            where: eq(userTable.id, userId),
            columns: {
              assinaturaDefault: true,
              dataAssinaturaDefault: true,
            },
          });

          return json({
            success: true,
            message: 'Assinatura recuperada com sucesso',
            signatureData: user?.assinaturaDefault || undefined,
            dataAssinatura: user?.dataAssinaturaDefault?.toISOString(),
          }, { status: 200 });

        } else if (userRole === 'professor') {
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, userId),
            columns: {
              assinaturaDefault: true,
              dataAssinaturaDefault: true,
            },
          });

          return json({
            success: true,
            message: 'Assinatura recuperada com sucesso',
            signatureData: professor?.assinaturaDefault || undefined,
            dataAssinatura: professor?.dataAssinaturaDefault?.toISOString(),
          }, { status: 200 });

        } else {
          return json({
            success: false,
            message: 'Apenas professores e administradores podem gerenciar assinaturas',
          }, { status: 403 });
        }

      } catch (error) {
        log.error(error, 'Erro ao buscar assinatura do usuário');
        return json({
          success: false,
          message: 'Erro interno do servidor',
        }, { status: 500 });
      }
    })
  ),

  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const body = await ctx.request.json();
        const { signatureData } = signatureInputSchema.parse(body);
        const userId = parseInt(ctx.state.user.userId);
        const userRole = ctx.state.user.role;
        const now = new Date();

        if (userRole === 'admin') {
          await db
            .update(userTable)
            .set({
              assinaturaDefault: signatureData,
              dataAssinaturaDefault: now,
            })
            .where(eq(userTable.id, userId));

          log.info({ userId }, 'Assinatura de admin salva com sucesso');

        } else if (userRole === 'professor') {
          await db
            .update(professorTable)
            .set({
              assinaturaDefault: signatureData,
              dataAssinaturaDefault: now,
              updatedAt: now,
            })
            .where(eq(professorTable.userId, userId));

          log.info({ userId }, 'Assinatura de professor salva com sucesso');

        } else {
          return json({
            success: false,
            message: 'Apenas professores e administradores podem gerenciar assinaturas',
          }, { status: 403 });
        }

        return json({
          success: true,
          message: 'Assinatura salva com sucesso',
          dataAssinatura: now.toISOString(),
        }, { status: 200 });

      } catch (error) {
        if (error instanceof z.ZodError) {
          return json({
            success: false,
            message: 'Dados de entrada inválidos',
          }, { status: 400 });
        }

        log.error(error, 'Erro ao salvar assinatura do usuário');
        return json({
          success: false,
          message: 'Erro interno do servidor',
        }, { status: 500 });
      }
    })
  ),

  DELETE: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const userId = parseInt(ctx.state.user.userId);
        const userRole = ctx.state.user.role;

        if (userRole === 'admin') {
          await db
            .update(userTable)
            .set({
              assinaturaDefault: null,
              dataAssinaturaDefault: null,
            })
            .where(eq(userTable.id, userId));

        } else if (userRole === 'professor') {
          await db
            .update(professorTable)
            .set({
              assinaturaDefault: null,
              dataAssinaturaDefault: null,
              updatedAt: new Date(),
            })
            .where(eq(professorTable.userId, userId));

        } else {
          return json({
            success: false,
            message: 'Apenas professores e administradores podem gerenciar assinaturas',
          }, { status: 403 });
        }

        log.info({ userId, userRole }, 'Assinatura removida com sucesso');

        return json({
          success: true,
          message: 'Assinatura removida com sucesso',
        }, { status: 200 });

      } catch (error) {
        log.error(error, 'Erro ao remover assinatura do usuário');
        return json({
          success: false,
          message: 'Erro interno do servidor',
        }, { status: 500 });
      }
    })
  ),
}); 