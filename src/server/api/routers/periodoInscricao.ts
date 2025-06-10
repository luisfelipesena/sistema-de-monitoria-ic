import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import { editalTable, periodoInscricaoTable } from "@/server/db/schema"
import { Semestre } from "@/types/enums"
import { and, eq, gte, lte } from "drizzle-orm"
import { z } from "zod"

export const periodoInscricaoRouter = createTRPCRouter({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/periodo-inscricao',
        tags: ['periodo-inscricao'],
        summary: 'List application periods',
        description: 'Get all application periods',
      },
    })
    .input(
      z.object({
        ano: z.number().optional(),
        semestre: z.nativeEnum(Semestre).optional(),
        ativo: z.boolean().optional(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          semestre: z.nativeEnum(Semestre),
          ano: z.number(),
          dataInicio: z.date(),
          dataFim: z.date(),
          ativo: z.boolean(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const conditions = []

      if (input.ano) {
        conditions.push(eq(periodoInscricaoTable.ano, input.ano))
      }

      if (input.semestre) {
        conditions.push(eq(periodoInscricaoTable.semestre, input.semestre))
      }

      const now = new Date()

      const periodos = await ctx.db
        .select()
        .from(periodoInscricaoTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)

      return periodos
        .map((periodo) => ({
          ...periodo,
          semestre: periodo.semestre as Semestre,
          ativo: periodo.dataInicio <= now && periodo.dataFim >= now,
        }))
        .filter((periodo) => (input.ativo !== undefined ? periodo.ativo === input.ativo : true))
    }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/periodo-inscricao/{id}',
        tags: ['periodo-inscricao'],
        summary: 'Get application period by ID',
        description: 'Get a specific application period by its ID',
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
        semestre: z.nativeEnum(Semestre),
        ano: z.number(),
        dataInicio: z.date(),
        dataFim: z.date(),
        ativo: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const periodo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: eq(periodoInscricaoTable.id, input.id),
      })

      if (!periodo) {
        throw new Error("Application period not found")
      }

      const now = new Date()
      const ativo = periodo.dataInicio <= now && periodo.dataFim >= now

      return {
        ...periodo,
        semestre: periodo.semestre as Semestre,
        ativo,
      }
    }),

  getPeriodoAtivo: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/periodo-inscricao/ativo',
        tags: ['periodo-inscricao'],
        summary: 'Get active application period',
        description: 'Get the currently active application period if any',
      },
    })
    .input(z.void())
    .output(
      z
        .object({
          id: z.number(),
          semestre: z.nativeEnum(Semestre),
          ano: z.number(),
          dataInicio: z.date(),
          dataFim: z.date(),
          createdAt: z.date(),
        })
        .nullable()
    )
    .query(async ({ ctx }) => {
      const now = new Date()

      const periodoAtivo = await ctx.db
        .select()
        .from(periodoInscricaoTable)
        .where(and(lte(periodoInscricaoTable.dataInicio, now), gte(periodoInscricaoTable.dataFim, now)))
        .limit(1)

      if (!periodoAtivo[0]) {
        return null
      }

      return {
        ...periodoAtivo[0],
        semestre: periodoAtivo[0].semestre as Semestre,
      }
    }),

  create: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/periodo-inscricao',
        tags: ['periodo-inscricao'],
        summary: 'Create application period',
        description: 'Create a new application period',
      },
    })
    .input(
      z.object({
        semestre: z.nativeEnum(Semestre),
        ano: z.number(),
        dataInicio: z.date(),
        dataFim: z.date(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        semestre: z.nativeEnum(Semestre),
        ano: z.number(),
        dataInicio: z.date(),
        dataFim: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.dataInicio >= input.dataFim) {
        throw new Error("Start date must be before end date")
      }

      const existingPeriodo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(eq(periodoInscricaoTable.ano, input.ano), eq(periodoInscricaoTable.semestre, input.semestre)),
      })

      if (existingPeriodo) {
        throw new Error("Application period already exists for this year and semester")
      }

      const [periodo] = await ctx.db
        .insert(periodoInscricaoTable)
        .values({
          semestre: input.semestre,
          ano: input.ano,
          dataInicio: input.dataInicio,
          dataFim: input.dataFim,
        })
        .returning()

      return {
        ...periodo,
        semestre: periodo.semestre as Semestre,
      }
    }),

  update: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/periodo-inscricao/{id}',
        tags: ['periodo-inscricao'],
        summary: 'Update application period',
        description: 'Update an existing application period',
      },
    })
    .input(
      z.object({
        id: z.number(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        semestre: z.nativeEnum(Semestre),
        ano: z.number(),
        dataInicio: z.date(),
        dataFim: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {}

      if (input.dataInicio) updateData.dataInicio = input.dataInicio
      if (input.dataFim) updateData.dataFim = input.dataFim

      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update")
      }

      if (input.dataInicio && input.dataFim && input.dataInicio >= input.dataFim) {
        throw new Error("Start date must be before end date")
      }

      const [periodo] = await ctx.db
        .update(periodoInscricaoTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(periodoInscricaoTable.id, input.id))
        .returning()

      if (!periodo) {
        throw new Error("Application period not found")
      }

      return {
        ...periodo,
        semestre: periodo.semestre as Semestre,
      }
    }),

  delete: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/periodo-inscricao/{id}',
        tags: ['periodo-inscricao'],
        summary: 'Delete application period',
        description: 'Delete an application period from the system',
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
      await ctx.db.delete(periodoInscricaoTable).where(eq(periodoInscricaoTable.id, input.id))

      return { success: true }
    }),

  getEditais: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/periodo-inscricao/{id}/editais',
        tags: ['periodo-inscricao', 'editais'],
        summary: 'Get period notices',
        description: 'Get all notices (editais) for a specific application period',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          numeroEdital: z.string(),
          titulo: z.string(),
          fileIdAssinado: z.string().nullable(),
          publicado: z.boolean(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const editais = await ctx.db.select().from(editalTable).where(eq(editalTable.periodoInscricaoId, input.id))

      return editais
    }),

  getActive: publicProcedure.query(() => {
    // This is mocked data. Replace with actual database query.
    return {
      id: 1,
      nome: "Processo Seletivo 2024.2",
      dataInicio: new Date("2024-02-01").toISOString(),
      dataFim: new Date("2024-02-28").toISOString(),
      daysRemaining: 12,
    }
  }),
}) 