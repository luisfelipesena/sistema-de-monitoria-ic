import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { BusinessError } from '@/server/lib/errors'
import { configuracoesService } from '@/server/services/configuracoes/configuracoes-service'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

function handleConfigError(error: unknown): never {
  if (error instanceof BusinessError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  throw error
}

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

  getEmailsNotificacaoEdital: adminProtectedProcedure.query(async () => {
    return await configuracoesService.getEmailsNotificacaoEdital()
  }),

  // --- Emails de Notificação ---

  getEmailsNotificacao: adminProtectedProcedure.query(async () => {
    return await configuracoesService.getEmailsNotificacao()
  }),

  createEmailNotificacao: adminProtectedProcedure
    .input(
      z.object({
        nome: z.string().min(1, 'Nome é obrigatório.'),
        email: z.string().email('Email inválido.'),
        descricao: z.string().nullish(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await configuracoesService.createEmailNotificacao({
          nome: input.nome,
          email: input.email,
          descricao: input.descricao ?? null,
        })
      } catch (error) {
        handleConfigError(error)
      }
    }),

  updateEmailNotificacao: adminProtectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        nome: z.string().min(1, 'Nome é obrigatório.').optional(),
        email: z.string().email('Email inválido.').optional(),
        descricao: z.string().nullish(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await configuracoesService.updateEmailNotificacao(input)
      } catch (error) {
        handleConfigError(error)
      }
    }),

  deleteEmailNotificacao: adminProtectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return await configuracoesService.deleteEmailNotificacao(input.id)
    }),
})
