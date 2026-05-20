import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { semestreSchema } from '@/types'
import { createImportProjectsService } from '@/server/services/import-projects/import-projects-service'
import { z } from 'zod'
import { processImportedFileDCC } from './process-dcc'

export const importProjectsRouter = createTRPCRouter({
  uploadFile: adminProtectedProcedure
    .input(
      z.object({
        fileId: z.string(),
        fileName: z.string(),
        ano: z.number().int().min(2000).max(2100),
        semestre: semestreSchema,
        numeroEditalPrograd: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = createImportProjectsService(ctx.db)
      return service.uploadFile(input, ctx.user.id)
    }),

  processImportedFileDCC: adminProtectedProcedure
    .input(z.object({ importacaoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return processImportedFileDCC(input.importacaoId, ctx)
    }),

  processImportedFile: adminProtectedProcedure
    .input(
      z.object({
        importacaoId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createImportProjectsService(ctx.db)
      return service.processImportedFile(input.importacaoId)
    }),

  getImportHistory: adminProtectedProcedure.query(async ({ ctx }) => {
    const service = createImportProjectsService(ctx.db)
    return service.getImportHistory()
  }),

  getImportDetails: adminProtectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
    const service = createImportProjectsService(ctx.db)
    return service.getImportDetails(input.id)
  }),

  deleteImport: adminProtectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const service = createImportProjectsService(ctx.db)
    return service.deleteImport(input.id)
  }),

  notifyProfessors: adminProtectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const service = createImportProjectsService(ctx.db)
    return service.notifyProfessors(input.id)
  }),

  getProfessores: adminProtectedProcedure.query(async ({ ctx }) => {
    const service = createImportProjectsService(ctx.db)
    return service.getProfessores()
  }),

  getDisciplinas: adminProtectedProcedure.query(async ({ ctx }) => {
    const service = createImportProjectsService(ctx.db)
    return service.getDisciplinas()
  }),
})
