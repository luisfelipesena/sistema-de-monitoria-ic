import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { createProjetoTemplatesService } from '@/server/services/projeto-templates/projeto-templates-service'
import { z } from 'zod'

export const projetoTemplatesRouter = createTRPCRouter({
  getTemplates: adminProtectedProcedure.query(async ({ ctx }) => {
    const service = createProjetoTemplatesService(ctx.db)
    return service.getAllTemplates()
  }),

  getProjetoTemplates: protectedProcedure.query(async ({ ctx }) => {
    const service = createProjetoTemplatesService(ctx.db)
    return service.getTemplatesForProfessor()
  }),

  getTemplate: adminProtectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
    const service = createProjetoTemplatesService(ctx.db)
    return service.getTemplate(input.id)
  }),

  createTemplate: adminProtectedProcedure
    .input(
      z.object({
        disciplinaId: z.number(),
        tituloDefault: z.string().optional(),
        descricaoDefault: z.string().optional(),
        cargaHorariaSemanaDefault: z.number().int().positive().optional(),
        numeroSemanasDefault: z.number().int().positive().optional(),
        publicoAlvoDefault: z.string().optional(),
        atividadesDefault: z.array(z.string()).optional(),
        pontosProvaDefault: z.string().optional(),
        bibliografiaDefault: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = createProjetoTemplatesService(ctx.db)
      return service.createTemplate(input, ctx.user.id)
    }),

  updateTemplate: adminProtectedProcedure
    .input(
      z.object({
        id: z.number(),
        tituloDefault: z.string().optional(),
        descricaoDefault: z.string().optional(),
        cargaHorariaSemanaDefault: z.number().int().positive().optional(),
        numeroSemanasDefault: z.number().int().positive().optional(),
        publicoAlvoDefault: z.string().optional(),
        atividadesDefault: z.array(z.string()).optional(),
        pontosProvaDefault: z.string().optional(),
        bibliografiaDefault: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = createProjetoTemplatesService(ctx.db)
      return service.updateTemplate(input, ctx.user.id)
    }),

  deleteTemplate: adminProtectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const service = createProjetoTemplatesService(ctx.db)
    return service.deleteTemplate(input.id)
  }),

  getDisciplinasDisponiveis: adminProtectedProcedure.query(async ({ ctx }) => {
    const service = createProjetoTemplatesService(ctx.db)
    return service.getAvailableDisciplines()
  }),

  getTemplateByDisciplina: adminProtectedProcedure
    .input(z.object({ disciplinaId: z.number() }))
    .query(async ({ input, ctx }) => {
      const service = createProjetoTemplatesService(ctx.db)
      return service.getTemplateByDisciplina(input.disciplinaId)
    }),

  duplicateTemplate: adminProtectedProcedure
    .input(
      z.object({
        sourceId: z.number(),
        targetDisciplinaId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createProjetoTemplatesService(ctx.db)
      return service.duplicateTemplate(input, ctx.user.id)
    }),

  getTemplateStats: adminProtectedProcedure.query(async ({ ctx }) => {
    const service = createProjetoTemplatesService(ctx.db)
    return service.getTemplateStats()
  }),

  getTemplateByDisciplinaForProfessor: protectedProcedure
    .input(z.object({ disciplinaId: z.number() }))
    .query(async ({ input, ctx }) => {
      const service = createProjetoTemplatesService(ctx.db)
      return service.getTemplateByDisciplina(input.disciplinaId)
    }),

  upsertTemplateByProfessor: protectedProcedure
    .input(
      z.object({
        disciplinaId: z.number(),
        tituloDefault: z.string().optional(),
        descricaoDefault: z.string().optional(),
        cargaHorariaSemanaDefault: z.number().int().positive().optional(),
        numeroSemanasDefault: z.number().int().positive().optional(),
        publicoAlvoDefault: z.string().optional(),
        atividadesDefault: z.array(z.string()).optional(),
        pontosProvaDefault: z.string().optional(),
        bibliografiaDefault: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = createProjetoTemplatesService(ctx.db)
      return service.upsertTemplateByProfessor(input, ctx.user.id)
    }),
})
