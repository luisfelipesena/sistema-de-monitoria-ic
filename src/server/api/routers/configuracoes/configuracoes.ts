import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { configuracoesService } from '@/server/services/configuracoes/configuracoes-service'
import { z } from 'zod'

export const configuracoesRouter = createTRPCRouter({
  getDepartamentos: adminProtectedProcedure.query(async () => {
    return await configuracoesService.getDepartamentos()
  }),

  updateEmails: adminProtectedProcedure
    .input(
      z.object({
        departamentoId: z.number().int().positive(),
        emailInstituto: z.string().email('Email do instituto inválido.').nullish(),
        emailChefeDepartamento: z.string().email('Email do chefe inválido.').nullish(),
      })
    )
    .mutation(async ({ input }) => {
      return await configuracoesService.updateEmails(input)
    }),
})
