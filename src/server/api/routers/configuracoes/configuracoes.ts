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

  createDepartamento: adminProtectedProcedure
    .input(
      z.object({
        nome: z.string().min(1, 'Nome é obrigatório.'),
        sigla: z.string().nullish(),
        email: z.string().nullish(),
      })
    )
    .mutation(async ({ input }) => {
      const email = input.email && input.email.trim().length > 0 ? input.email.trim() : null
      return await configuracoesService.createDepartamento({ ...input, email })
    }),

  updateDepartamento: adminProtectedProcedure
    .input(
      z.object({
        departamentoId: z.number().int().positive(),
        nome: z.string().min(1, 'Nome é obrigatório.').optional(),
        sigla: z.string().nullish(),
        email: z.string().nullish(),
      })
    )
    .mutation(async ({ input }) => {
      const email = input.email && input.email.trim().length > 0 ? input.email.trim() : null
      return await configuracoesService.updateDepartamento({ ...input, email })
    }),

  deleteDepartamento: adminProtectedProcedure
    .input(
      z.object({
        departamentoId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return await configuracoesService.deleteDepartamento(input.departamentoId)
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

  getEmailGeralProfessores: adminProtectedProcedure.query(async () => {
    return await configuracoesService.getEmailGeralProfessores()
  }),

  setEmailGeralProfessores: adminProtectedProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido.').nullish(),
      })
    )
    .mutation(async ({ input }) => {
      return await configuracoesService.setEmailGeralProfessores(input.email ?? null)
    }),

  getEmailGeralEstudantes: adminProtectedProcedure.query(async () => {
    return await configuracoesService.getEmailGeralEstudantes()
  }),

  setEmailGeralEstudantes: adminProtectedProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido.').nullish(),
      })
    )
    .mutation(async ({ input }) => {
      return await configuracoesService.setEmailGeralEstudantes(input.email ?? null)
    }),

  getEmailsNotificacaoEdital: adminProtectedProcedure.query(async () => {
    return await configuracoesService.getEmailsNotificacaoEdital()
  }),
})
