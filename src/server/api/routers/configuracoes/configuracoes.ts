import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { configuracoesService } from '@/server/services/configuracoes/configuracoes-service'
import { z } from 'zod'

export const configuracoesRouter = createTRPCRouter({
  getDepartamentos: adminProtectedProcedure.query(async () => {
    return await configuracoesService.getDepartamentos()
  }),

  updateDepartamentoEmail: adminProtectedProcedure
    .input(
      z.object({
        departamentoId: z.number().int().positive(),
        email: z.string().email('Email inválido.').nullish(),
      })
    )
    .mutation(async ({ input }) => {
      return await configuracoesService.updateDepartamentoEmail(input)
    }),

  getEmailIC: adminProtectedProcedure.query(async () => {
    return await configuracoesService.getEmailIC()
  }),

  setEmailIC: adminProtectedProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido.').nullish(),
      })
    )
    .mutation(async ({ input }) => {
      return await configuracoesService.setEmailIC(input.email ?? null)
    }),
})
