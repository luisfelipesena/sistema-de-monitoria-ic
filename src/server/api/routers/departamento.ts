import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import { departamentoTable } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const departamentoRouter = createTRPCRouter({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/departamento',
        tags: ['departamento'],
        summary: 'List all departments',
        description: 'Get all departments in the system',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          nome: z.string(),
          sigla: z.string().nullable(),
          unidadeUniversitaria: z.string(),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const departamentos = await ctx.db.select().from(departamentoTable)
      return departamentos
    }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/departamento/{id}',
        tags: ['departamento'],
        summary: 'Get department by ID',
        description: 'Get a specific department by its ID',
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
        nome: z.string(),
        sigla: z.string().nullable(),
        unidadeUniversitaria: z.string(),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const departamento = await ctx.db.query.departamentoTable.findFirst({
        where: eq(departamentoTable.id, input.id),
      })

      if (!departamento) {
        throw new Error("Department not found")
      }

      return departamento
    }),

  create: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/departamento',
        tags: ['departamento'],
        summary: 'Create a new department',
        description: 'Create a new department in the system',
      },
    })
    .input(
      z.object({
        nome: z.string().min(1),
        sigla: z.string().optional(),
        unidadeUniversitaria: z.string().min(1),
      })
    )
    .output(
      z.object({
        id: z.number(),
        nome: z.string(),
        sigla: z.string().nullable(),
        unidadeUniversitaria: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [departamento] = await ctx.db
        .insert(departamentoTable)
        .values({
          nome: input.nome,
          sigla: input.sigla || null,
          unidadeUniversitaria: input.unidadeUniversitaria,
        })
        .returning()

      return departamento
    }),

  update: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/departamento/{id}',
        tags: ['departamento'],
        summary: 'Update a department',
        description: 'Update an existing department',
      },
    })
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(1).optional(),
        sigla: z.string().optional(),
        unidadeUniversitaria: z.string().min(1).optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        nome: z.string(),
        sigla: z.string().nullable(),
        unidadeUniversitaria: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {}

      if (input.nome) updateData.nome = input.nome
      if (input.sigla !== undefined) updateData.sigla = input.sigla
      if (input.unidadeUniversitaria) updateData.unidadeUniversitaria = input.unidadeUniversitaria

      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update")
      }

      const [departamento] = await ctx.db
        .update(departamentoTable)
        .set(updateData)
        .where(eq(departamentoTable.id, input.id))
        .returning()

      if (!departamento) {
        throw new Error("Department not found")
      }

      return departamento
    }),

  delete: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/departamento/{id}',
        tags: ['departamento'],
        summary: 'Delete a department',
        description: 'Delete a department from the system',
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
      await ctx.db.delete(departamentoTable).where(eq(departamentoTable.id, input.id))

      return { success: true }
    }),
}) 