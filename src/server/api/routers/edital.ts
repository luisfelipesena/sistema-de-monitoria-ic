import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { editalTable, periodoInscricaoTable, userTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const editalRouter = createTRPCRouter({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/edital',
        tags: ['edital'],
        summary: 'List all editais',
        description: 'Get all editais in the system',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          titulo: z.string(),
          numeroEdital: z.string(),
          descricaoHtml: z.string().nullable(),
          publicado: z.boolean(),
          dataPublicacao: z.date().nullable(),
          periodo: z.object({
            id: z.number(),
            semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
            ano: z.number(),
            dataInicio: z.date(),
            dataFim: z.date(),
          }),
          criadoPor: z.object({
            id: z.number(),
            username: z.string(),
          }),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const editais = await ctx.db
        .select({
          edital: editalTable,
          periodo: {
            id: periodoInscricaoTable.id,
            semestre: periodoInscricaoTable.semestre,
            ano: periodoInscricaoTable.ano,
            dataInicio: periodoInscricaoTable.dataInicio,
            dataFim: periodoInscricaoTable.dataFim,
          },
          criadoPor: {
            id: userTable.id,
            username: userTable.username,
          },
        })
        .from(editalTable)
        .innerJoin(periodoInscricaoTable, eq(editalTable.periodoInscricaoId, periodoInscricaoTable.id))
        .innerJoin(userTable, eq(editalTable.criadoPorUserId, userTable.id))

      return editais.map((item) => ({
        id: item.edital.id,
        titulo: item.edital.titulo,
        numeroEdital: item.edital.numeroEdital,
        descricaoHtml: item.edital.descricaoHtml,
        publicado: item.edital.publicado,
        dataPublicacao: item.edital.dataPublicacao,
        periodo: {
          ...item.periodo,
          semestre: item.periodo.semestre as 'SEMESTRE_1' | 'SEMESTRE_2',
        },
        criadoPor: item.criadoPor,
        createdAt: item.edital.createdAt,
      }))
    }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/edital/{id}',
        tags: ['edital'],
        summary: 'Get edital by ID',
        description: 'Get a specific edital by its ID',
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
        titulo: z.string(),
        numeroEdital: z.string(),
        descricaoHtml: z.string().nullable(),
        fileIdAssinado: z.string().nullable(),
        publicado: z.boolean(),
        dataPublicacao: z.date().nullable(),
        periodo: z.object({
          id: z.number(),
          semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
          ano: z.number(),
          dataInicio: z.date(),
          dataFim: z.date(),
        }),
        criadoPor: z.object({
          id: z.number(),
          username: z.string(),
        }),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          edital: editalTable,
          periodo: {
            id: periodoInscricaoTable.id,
            semestre: periodoInscricaoTable.semestre,
            ano: periodoInscricaoTable.ano,
            dataInicio: periodoInscricaoTable.dataInicio,
            dataFim: periodoInscricaoTable.dataFim,
          },
          criadoPor: {
            id: userTable.id,
            username: userTable.username,
          },
        })
        .from(editalTable)
        .innerJoin(periodoInscricaoTable, eq(editalTable.periodoInscricaoId, periodoInscricaoTable.id))
        .innerJoin(userTable, eq(editalTable.criadoPorUserId, userTable.id))
        .where(eq(editalTable.id, input.id))
        .limit(1)

      if (!result[0]) {
        throw new Error('Edital not found')
      }

      return {
        id: result[0].edital.id,
        titulo: result[0].edital.titulo,
        numeroEdital: result[0].edital.numeroEdital,
        descricaoHtml: result[0].edital.descricaoHtml,
        fileIdAssinado: result[0].edital.fileIdAssinado,
        publicado: result[0].edital.publicado,
        dataPublicacao: result[0].edital.dataPublicacao,
        periodo: {
          ...result[0].periodo,
          semestre: result[0].periodo.semestre as 'SEMESTRE_1' | 'SEMESTRE_2',
        },
        criadoPor: result[0].criadoPor,
        createdAt: result[0].edital.createdAt,
        updatedAt: result[0].edital.updatedAt,
      }
    }),

  create: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/edital',
        tags: ['edital'],
        summary: 'Create a new edital',
        description: 'Create a new edital in the system',
      },
    })
    .input(
      z.object({
        titulo: z.string().min(1),
        numeroEdital: z.string().min(1),
        descricaoHtml: z.string().optional(),
        periodoInscricaoId: z.number(),
        criadoPorUserId: z.number(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        titulo: z.string(),
        numeroEdital: z.string(),
        descricaoHtml: z.string().nullable(),
        publicado: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [edital] = await ctx.db
        .insert(editalTable)
        .values({
          titulo: input.titulo,
          numeroEdital: input.numeroEdital,
          descricaoHtml: input.descricaoHtml || null,
          periodoInscricaoId: input.periodoInscricaoId,
          criadoPorUserId: input.criadoPorUserId,
          publicado: false,
        })
        .returning()

      return {
        id: edital.id,
        titulo: edital.titulo,
        numeroEdital: edital.numeroEdital,
        descricaoHtml: edital.descricaoHtml,
        publicado: edital.publicado,
      }
    }),

  update: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/edital/{id}',
        tags: ['edital'],
        summary: 'Update an edital',
        description: 'Update an existing edital',
      },
    })
    .input(
      z.object({
        id: z.number(),
        titulo: z.string().min(1).optional(),
        numeroEdital: z.string().min(1).optional(),
        descricaoHtml: z.string().optional(),
        publicado: z.boolean().optional(),
        dataPublicacao: z.date().optional(),
        fileIdAssinado: z.string().optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        titulo: z.string(),
        numeroEdital: z.string(),
        descricaoHtml: z.string().nullable(),
        publicado: z.boolean(),
        dataPublicacao: z.date().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      if (input.titulo) updateData.titulo = input.titulo
      if (input.numeroEdital) updateData.numeroEdital = input.numeroEdital
      if (input.descricaoHtml !== undefined) updateData.descricaoHtml = input.descricaoHtml
      if (input.publicado !== undefined) updateData.publicado = input.publicado
      if (input.dataPublicacao !== undefined) updateData.dataPublicacao = input.dataPublicacao
      if (input.fileIdAssinado !== undefined) updateData.fileIdAssinado = input.fileIdAssinado

      const [edital] = await ctx.db
        .update(editalTable)
        .set(updateData)
        .where(eq(editalTable.id, input.id))
        .returning()

      if (!edital) {
        throw new Error('Edital not found')
      }

      return {
        id: edital.id,
        titulo: edital.titulo,
        numeroEdital: edital.numeroEdital,
        descricaoHtml: edital.descricaoHtml,
        publicado: edital.publicado,
        dataPublicacao: edital.dataPublicacao,
      }
    }),

  delete: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/edital/{id}',
        tags: ['edital'],
        summary: 'Delete an edital',
        description: 'Delete an edital from the system',
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
      await ctx.db.delete(editalTable).where(eq(editalTable.id, input.id))
      return { success: true }
    }),
}) 