import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import { cursoTable, departamentoTable } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const cursoRouter = createTRPCRouter({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/curso',
        tags: ['curso'],
        summary: 'List all courses',
        description: 'Get all courses in the system',
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
          codigo: z.number(),
          cargaHoraria: z.number(),
          descricao: z.string().nullable(),
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
      const cursos = await ctx.db
        .select({
          id: cursoTable.id,
          nome: cursoTable.nome,
          codigo: cursoTable.codigo,
          cargaHoraria: cursoTable.cargaHoraria,
          descricao: cursoTable.descricao,
          createdAt: cursoTable.createdAt,
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(cursoTable)
        .innerJoin(departamentoTable, eq(cursoTable.departamentoId, departamentoTable.id))
        .where(input.departamentoId ? eq(cursoTable.departamentoId, input.departamentoId) : undefined)

      return cursos
    }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/curso/{id}',
        tags: ['curso'],
        summary: 'Get course by ID',
        description: 'Get a specific course by its ID',
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
        codigo: z.number(),
        cargaHoraria: z.number(),
        descricao: z.string().nullable(),
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
      const curso = await ctx.db
        .select({
          id: cursoTable.id,
          nome: cursoTable.nome,
          codigo: cursoTable.codigo,
          cargaHoraria: cursoTable.cargaHoraria,
          descricao: cursoTable.descricao,
          createdAt: cursoTable.createdAt,
          updatedAt: cursoTable.updatedAt,
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(cursoTable)
        .innerJoin(departamentoTable, eq(cursoTable.departamentoId, departamentoTable.id))
        .where(eq(cursoTable.id, input.id))
        .limit(1)

      if (!curso[0]) {
        throw new Error('Course not found')
      }

      return curso[0]
    }),

  create: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/curso',
        tags: ['curso'],
        summary: 'Create a new course',
        description: 'Create a new course in the system',
      },
    })
    .input(
      z.object({
        nome: z.string().min(1),
        codigo: z.number(),
        departamentoId: z.number(),
        cargaHoraria: z.number().min(1),
        descricao: z.string().optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        nome: z.string(),
        codigo: z.number(),
        cargaHoraria: z.number(),
        descricao: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [curso] = await ctx.db
        .insert(cursoTable)
        .values({
          nome: input.nome,
          codigo: input.codigo,
          departamentoId: input.departamentoId,
          cargaHoraria: input.cargaHoraria,
          descricao: input.descricao || null,
        })
        .returning()

      return curso
    }),

  update: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/curso/{id}',
        tags: ['curso'],
        summary: 'Update a course',
        description: 'Update an existing course',
      },
    })
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(1).optional(),
        codigo: z.number().optional(),
        departamentoId: z.number().optional(),
        cargaHoraria: z.number().min(1).optional(),
        descricao: z.string().optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        nome: z.string(),
        codigo: z.number(),
        cargaHoraria: z.number(),
        descricao: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {}

      if (input.nome) updateData.nome = input.nome
      if (input.codigo) updateData.codigo = input.codigo
      if (input.departamentoId) updateData.departamentoId = input.departamentoId
      if (input.cargaHoraria) updateData.cargaHoraria = input.cargaHoraria
      if (input.descricao !== undefined) updateData.descricao = input.descricao

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update')
      }

      const [curso] = await ctx.db.update(cursoTable).set(updateData).where(eq(cursoTable.id, input.id)).returning()

      if (!curso) {
        throw new Error('Course not found')
      }

      return curso
    }),

  delete: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/curso/{id}',
        tags: ['curso'],
        summary: 'Delete a course',
        description: 'Delete a course from the system',
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
      await ctx.db.delete(cursoTable).where(eq(cursoTable.id, input.id))

      return { success: true }
    }),
}) 