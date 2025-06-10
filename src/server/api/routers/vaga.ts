import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import { alunoTable, inscricaoTable, projetoTable, userTable, vagaTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const vagaRouter = createTRPCRouter({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/vaga',
        tags: ['vaga'],
        summary: 'List all vagas',
        description: 'Get all vagas in the system',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
          dataInicio: z.date().nullable(),
          dataFim: z.date().nullable(),
          aluno: z.object({
            id: z.number(),
            nomeCompleto: z.string(),
            matricula: z.string(),
            user: z.object({
              id: z.number(),
              username: z.string(),
              email: z.string(),
            }),
          }),
          projeto: z.object({
            id: z.number(),
            titulo: z.string(),
          }),
          inscricao: z.object({
            id: z.number(),
            status: z.enum(['SUBMITTED', 'SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO', 'ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO', 'REJECTED_BY_PROFESSOR', 'REJECTED_BY_STUDENT']),
          }),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const vagas = await ctx.db
        .select({
          vaga: vagaTable,
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
          },
          user: {
            id: userTable.id,
            username: userTable.username,
            email: userTable.email,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
          },
          inscricao: {
            id: inscricaoTable.id,
            status: inscricaoTable.status,
          },
        })
        .from(vagaTable)
        .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .innerJoin(inscricaoTable, eq(vagaTable.inscricaoId, inscricaoTable.id))

      return vagas.map((item) => ({
        id: item.vaga.id,
        tipo: item.vaga.tipo as 'BOLSISTA' | 'VOLUNTARIO',
        dataInicio: item.vaga.dataInicio,
        dataFim: item.vaga.dataFim,
        aluno: {
          ...item.aluno,
          user: item.user,
        },
        projeto: item.projeto,
        inscricao: {
          ...item.inscricao,
          status: item.inscricao.status as 'SUBMITTED' | 'SELECTED_BOLSISTA' | 'SELECTED_VOLUNTARIO' | 'ACCEPTED_BOLSISTA' | 'ACCEPTED_VOLUNTARIO' | 'REJECTED_BY_PROFESSOR' | 'REJECTED_BY_STUDENT',
        },
        createdAt: item.vaga.createdAt,
      }))
    }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/vaga/{id}',
        tags: ['vaga'],
        summary: 'Get vaga by ID',
        description: 'Get a specific vaga by its ID',
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
        tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
        dataInicio: z.date().nullable(),
        dataFim: z.date().nullable(),
        aluno: z.object({
          id: z.number(),
          nomeCompleto: z.string(),
          matricula: z.string(),
          user: z.object({
            id: z.number(),
            username: z.string(),
            email: z.string(),
          }),
        }),
        projeto: z.object({
          id: z.number(),
          titulo: z.string(),
        }),
        inscricao: z.object({
          id: z.number(),
          status: z.enum(['SUBMITTED', 'SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO', 'ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO', 'REJECTED_BY_PROFESSOR', 'REJECTED_BY_STUDENT']),
        }),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          vaga: vagaTable,
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
          },
          user: {
            id: userTable.id,
            username: userTable.username,
            email: userTable.email,
          },
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
          },
          inscricao: {
            id: inscricaoTable.id,
            status: inscricaoTable.status,
          },
        })
        .from(vagaTable)
        .innerJoin(alunoTable, eq(vagaTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .innerJoin(inscricaoTable, eq(vagaTable.inscricaoId, inscricaoTable.id))
        .where(eq(vagaTable.id, input.id))
        .limit(1)

      if (!result[0]) {
        throw new Error('Vaga not found')
      }

      return {
        id: result[0].vaga.id,
        tipo: result[0].vaga.tipo as 'BOLSISTA' | 'VOLUNTARIO',
        dataInicio: result[0].vaga.dataInicio,
        dataFim: result[0].vaga.dataFim,
        aluno: {
          ...result[0].aluno,
          user: result[0].user,
        },
        projeto: result[0].projeto,
        inscricao: {
          ...result[0].inscricao,
          status: result[0].inscricao.status as 'SUBMITTED' | 'SELECTED_BOLSISTA' | 'SELECTED_VOLUNTARIO' | 'ACCEPTED_BOLSISTA' | 'ACCEPTED_VOLUNTARIO' | 'REJECTED_BY_PROFESSOR' | 'REJECTED_BY_STUDENT',
        },
        createdAt: result[0].vaga.createdAt,
        updatedAt: result[0].vaga.updatedAt,
      }
    }),

  create: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/vaga',
        tags: ['vaga'],
        summary: 'Create a new vaga',
        description: 'Create a new vaga in the system',
      },
    })
    .input(
      z.object({
        alunoId: z.number(),
        projetoId: z.number(),
        inscricaoId: z.number(),
        tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        alunoId: z.number(),
        projetoId: z.number(),
        inscricaoId: z.number(),
        tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
        dataInicio: z.date().nullable(),
        dataFim: z.date().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [vaga] = await ctx.db
        .insert(vagaTable)
        .values({
          alunoId: input.alunoId,
          projetoId: input.projetoId,
          inscricaoId: input.inscricaoId,
          tipo: input.tipo,
          dataInicio: input.dataInicio || null,
          dataFim: input.dataFim || null,
        })
        .returning()

      return {
        id: vaga.id,
        alunoId: vaga.alunoId,
        projetoId: vaga.projetoId,
        inscricaoId: vaga.inscricaoId,
        tipo: vaga.tipo as 'BOLSISTA' | 'VOLUNTARIO',
        dataInicio: vaga.dataInicio,
        dataFim: vaga.dataFim,
      }
    }),

  update: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/vaga/{id}',
        tags: ['vaga'],
        summary: 'Update a vaga',
        description: 'Update an existing vaga',
      },
    })
    .input(
      z.object({
        id: z.number(),
        tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']).optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        alunoId: z.number(),
        projetoId: z.number(),
        inscricaoId: z.number(),
        tipo: z.enum(['BOLSISTA', 'VOLUNTARIO']),
        dataInicio: z.date().nullable(),
        dataFim: z.date().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      if (input.tipo) updateData.tipo = input.tipo
      if (input.dataInicio !== undefined) updateData.dataInicio = input.dataInicio
      if (input.dataFim !== undefined) updateData.dataFim = input.dataFim

      const [vaga] = await ctx.db
        .update(vagaTable)
        .set(updateData)
        .where(eq(vagaTable.id, input.id))
        .returning()

      if (!vaga) {
        throw new Error('Vaga not found')
      }

      return {
        id: vaga.id,
        alunoId: vaga.alunoId,
        projetoId: vaga.projetoId,
        inscricaoId: vaga.inscricaoId,
        tipo: vaga.tipo as 'BOLSISTA' | 'VOLUNTARIO',
        dataInicio: vaga.dataInicio,
        dataFim: vaga.dataFim,
      }
    }),

  delete: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/vaga/{id}',
        tags: ['vaga'],
        summary: 'Delete a vaga',
        description: 'Delete a vaga from the system',
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
      await ctx.db.delete(vagaTable).where(eq(vagaTable.id, input.id))
      return { success: true }
    }),
}) 