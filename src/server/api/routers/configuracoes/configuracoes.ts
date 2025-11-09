import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { departamentoTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const configuracoesRouter = createTRPCRouter({
  /**
   * Busca todos os departamentos para exibir na página de configuração
   */
  getDepartamentos: adminProtectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.departamentoTable.findMany({
      columns: {
        id: true,
        nome: true,
        sigla: true,
        emailInstituto: true,
        emailChefeDepartamento: true,
      },
      orderBy: (departamento, { asc }) => [asc(departamento.nome)],
    })
  }),

  /**
   * Atualiza os emails de um departamento específico
   */
  updateEmails: adminProtectedProcedure
    .input(
      z.object({
        departamentoId: z.number().int().positive(),
        // Permite um email válido ou um valor nulo/vazio
        emailInstituto: z.string().email('Email do instituto inválido.').nullish(),
        emailChefeDepartamento: z.string().email('Email do chefe inválido.').nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(departamentoTable)
        .set({
          // Garante que o banco receba 'null' se a string for vazia
          emailInstituto: input.emailInstituto || null,
          emailChefeDepartamento: input.emailChefeDepartamento || null,
        })
        .where(eq(departamentoTable.id, input.departamentoId))

      return { success: true }
    }),
})
