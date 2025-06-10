import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { departamentoTable, disciplinaTable } from '@/server/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

export const disciplinaRouter = createTRPCRouter({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplina',
        tags: ['disciplina'],
        summary: 'List all disciplines',
        description: 'Get all disciplines in the system',
      },
    })
    .input(
      z.object({
        departamentoId: z.number().optional(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          nome: z.string(),
          codigo: z.string(),
          departamento: z.object({
            id: z.number(),
            nome: z.string(),
            sigla: z.string().nullable(),
          }),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const conditions = [isNull(disciplinaTable.deletedAt)]

      if (input.departamentoId) {
        conditions.push(eq(disciplinaTable.departamentoId, input.departamentoId))
      }

      const disciplinas = await ctx.db
        .select({
          id: disciplinaTable.id,
          nome: disciplinaTable.nome,
          codigo: disciplinaTable.codigo,
          createdAt: disciplinaTable.createdAt,
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(disciplinaTable)
        .innerJoin(departamentoTable, eq(disciplinaTable.departamentoId, departamentoTable.id))
        .where(and(...conditions))

      return disciplinas
    }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplina/{id}',
        tags: ['disciplina'],
        summary: 'Get discipline by ID',
        description: 'Get a specific discipline by its ID',
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
        codigo: z.string(),
        departamento: z.object({
          id: z.number(),
          nome: z.string(),
          sigla: z.string().nullable(),
        }),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const disciplina = await ctx.db
        .select({
          id: disciplinaTable.id,
          nome: disciplinaTable.nome,
          codigo: disciplinaTable.codigo,
          createdAt: disciplinaTable.createdAt,
          updatedAt: disciplinaTable.updatedAt,
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(disciplinaTable)
        .innerJoin(departamentoTable, eq(disciplinaTable.departamentoId, departamentoTable.id))
        .where(and(eq(disciplinaTable.id, input.id), isNull(disciplinaTable.deletedAt)))
        .limit(1)

      if (!disciplina[0]) {
        throw new Error('Discipline not found')
      }

      return disciplina[0]
    }),

  create: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/disciplina',
        tags: ['disciplina'],
        summary: 'Create a new discipline',
        description: 'Create a new discipline in the system',
      },
    })
    .input(
      z.object({
        nome: z.string().min(1),
        codigo: z.string().min(1),
        departamentoId: z.number(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        nome: z.string(),
        codigo: z.string(),
        departamentoId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [disciplina] = await ctx.db
        .insert(disciplinaTable)
        .values({
          nome: input.nome,
          codigo: input.codigo,
          departamentoId: input.departamentoId,
        })
        .returning()

      return disciplina
    }),

  update: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/disciplina/{id}',
        tags: ['disciplina'],
        summary: 'Update a discipline',
        description: 'Update an existing discipline',
      },
    })
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(1).optional(),
        codigo: z.string().min(1).optional(),
        departamentoId: z.number().optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        nome: z.string(),
        codigo: z.string(),
        departamentoId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {}

      if (input.nome) updateData.nome = input.nome
      if (input.codigo) updateData.codigo = input.codigo
      if (input.departamentoId) updateData.departamentoId = input.departamentoId

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update')
      }

      const [disciplina] = await ctx.db
        .update(disciplinaTable)
        .set(updateData)
        .where(and(eq(disciplinaTable.id, input.id), isNull(disciplinaTable.deletedAt)))
        .returning()

      if (!disciplina) {
        throw new Error('Discipline not found')
      }

      return disciplina
    }),

  delete: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/disciplina/{id}',
        tags: ['disciplina'],
        summary: 'Delete a discipline',
        description: 'Soft delete a discipline from the system',
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
      await ctx.db
        .update(disciplinaTable)
        .set({ deletedAt: new Date() })
        .where(eq(disciplinaTable.id, input.id))

      return { success: true }
    }),
}) 