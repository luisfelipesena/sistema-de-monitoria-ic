import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { disciplinaTable, projetoTemplateTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const templateRouter = createTRPCRouter({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/template',
        tags: ['template'],
        summary: 'List all templates',
        description: 'Get all project templates in the system',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          disciplina: z.object({
            id: z.number(),
            nome: z.string(),
            codigo: z.string(),
          }),
          tituloDefault: z.string().nullable(),
          descricaoDefault: z.string().nullable(),
          cargaHorariaSemanaDefault: z.number().nullable(),
          numeroSemanasDefault: z.number().nullable(),
          publicoAlvoDefault: z.string().nullable(),
          atividadesDefault: z.string().nullable(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const templates = await ctx.db
        .select({
          template: projetoTemplateTable,
          disciplina: {
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
          },
        })
        .from(projetoTemplateTable)
        .innerJoin(disciplinaTable, eq(projetoTemplateTable.disciplinaId, disciplinaTable.id))

      return templates.map((item) => ({
        id: item.template.id,
        disciplina: item.disciplina,
        tituloDefault: item.template.tituloDefault,
        descricaoDefault: item.template.descricaoDefault,
        cargaHorariaSemanaDefault: item.template.cargaHorariaSemanaDefault,
        numeroSemanasDefault: item.template.numeroSemanasDefault,
        publicoAlvoDefault: item.template.publicoAlvoDefault,
        atividadesDefault: item.template.atividadesDefault,
        createdAt: item.template.createdAt,
      }))
    }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/template/{id}',
        tags: ['template'],
        summary: 'Get template by ID',
        description: 'Get a specific template by its ID',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        disciplina: z.object({
          id: z.number(),
          nome: z.string(),
          codigo: z.string(),
        }),
        tituloDefault: z.string().nullable(),
        descricaoDefault: z.string().nullable(),
        cargaHorariaSemanaDefault: z.number().nullable(),
        numeroSemanasDefault: z.number().nullable(),
        publicoAlvoDefault: z.string().nullable(),
        atividadesDefault: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          template: projetoTemplateTable,
          disciplina: {
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
          },
        })
        .from(projetoTemplateTable)
        .innerJoin(disciplinaTable, eq(projetoTemplateTable.disciplinaId, disciplinaTable.id))
        .where(eq(projetoTemplateTable.id, input.id))
        .limit(1)

      if (!result[0]) {
        throw new Error('Template not found')
      }

      return {
        id: result[0].template.id,
        disciplina: result[0].disciplina,
        tituloDefault: result[0].template.tituloDefault,
        descricaoDefault: result[0].template.descricaoDefault,
        cargaHorariaSemanaDefault: result[0].template.cargaHorariaSemanaDefault,
        numeroSemanasDefault: result[0].template.numeroSemanasDefault,
        publicoAlvoDefault: result[0].template.publicoAlvoDefault,
        atividadesDefault: result[0].template.atividadesDefault,
        createdAt: result[0].template.createdAt,
        updatedAt: result[0].template.updatedAt,
      }
    }),

  create: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/template',
        tags: ['template'],
        summary: 'Create a new template',
        description: 'Create a new project template',
      },
    })
    .input(
      z.object({
        disciplinaId: z.number(),
        tituloDefault: z.string().optional(),
        descricaoDefault: z.string().optional(),
        cargaHorariaSemanaDefault: z.number().optional(),
        numeroSemanasDefault: z.number().optional(),
        publicoAlvoDefault: z.string().optional(),
        atividadesDefault: z.string().optional(),
        criadoPorUserId: z.number(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        disciplinaId: z.number(),
        tituloDefault: z.string().nullable(),
        descricaoDefault: z.string().nullable(),
        cargaHorariaSemanaDefault: z.number().nullable(),
        numeroSemanasDefault: z.number().nullable(),
        publicoAlvoDefault: z.string().nullable(),
        atividadesDefault: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .insert(projetoTemplateTable)
        .values({
          disciplinaId: input.disciplinaId,
          tituloDefault: input.tituloDefault || null,
          descricaoDefault: input.descricaoDefault || null,
          cargaHorariaSemanaDefault: input.cargaHorariaSemanaDefault || null,
          numeroSemanasDefault: input.numeroSemanasDefault || null,
          publicoAlvoDefault: input.publicoAlvoDefault || null,
          atividadesDefault: input.atividadesDefault || null,
          criadoPorUserId: input.criadoPorUserId,
        })
        .returning()

      return {
        id: template.id,
        disciplinaId: template.disciplinaId,
        tituloDefault: template.tituloDefault,
        descricaoDefault: template.descricaoDefault,
        cargaHorariaSemanaDefault: template.cargaHorariaSemanaDefault,
        numeroSemanasDefault: template.numeroSemanasDefault,
        publicoAlvoDefault: template.publicoAlvoDefault,
        atividadesDefault: template.atividadesDefault,
      }
    }),

  update: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/template/{id}',
        tags: ['template'],
        summary: 'Update a template',
        description: 'Update an existing template',
      },
    })
    .input(
      z.object({
        id: z.number(),
        tituloDefault: z.string().optional(),
        descricaoDefault: z.string().optional(),
        cargaHorariaSemanaDefault: z.number().optional(),
        numeroSemanasDefault: z.number().optional(),
        publicoAlvoDefault: z.string().optional(),
        atividadesDefault: z.string().optional(),
        ultimaAtualizacaoUserId: z.number(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        disciplinaId: z.number(),
        tituloDefault: z.string().nullable(),
        descricaoDefault: z.string().nullable(),
        cargaHorariaSemanaDefault: z.number().nullable(),
        numeroSemanasDefault: z.number().nullable(),
        publicoAlvoDefault: z.string().nullable(),
        atividadesDefault: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        ultimaAtualizacaoUserId: input.ultimaAtualizacaoUserId,
        updatedAt: new Date(),
      }

      if (input.tituloDefault !== undefined) updateData.tituloDefault = input.tituloDefault
      if (input.descricaoDefault !== undefined) updateData.descricaoDefault = input.descricaoDefault
      if (input.cargaHorariaSemanaDefault !== undefined) updateData.cargaHorariaSemanaDefault = input.cargaHorariaSemanaDefault
      if (input.numeroSemanasDefault !== undefined) updateData.numeroSemanasDefault = input.numeroSemanasDefault
      if (input.publicoAlvoDefault !== undefined) updateData.publicoAlvoDefault = input.publicoAlvoDefault
      if (input.atividadesDefault !== undefined) updateData.atividadesDefault = input.atividadesDefault

      const [template] = await ctx.db
        .update(projetoTemplateTable)
        .set(updateData)
        .where(eq(projetoTemplateTable.id, input.id))
        .returning()

      if (!template) {
        throw new Error('Template not found')
      }

      return {
        id: template.id,
        disciplinaId: template.disciplinaId,
        tituloDefault: template.tituloDefault,
        descricaoDefault: template.descricaoDefault,
        cargaHorariaSemanaDefault: template.cargaHorariaSemanaDefault,
        numeroSemanasDefault: template.numeroSemanasDefault,
        publicoAlvoDefault: template.publicoAlvoDefault,
        atividadesDefault: template.atividadesDefault,
      }
    }),

  delete: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/template/{id}',
        tags: ['template'],
        summary: 'Delete a template',
        description: 'Delete a template from the system',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(projetoTemplateTable).where(eq(projetoTemplateTable.id, input.id))
      return { success: true }
    }),
}) 