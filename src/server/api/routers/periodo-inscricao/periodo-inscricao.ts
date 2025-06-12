import { createTRPCRouter, protectedProcedure, adminProtectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { periodoInscricaoTable, inscricaoTable, projetoTable } from '@/server/db/schema'
import { TRPCError } from '@trpc/server'
import { eq, sql, and, gte, lte, or } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'PeriodoInscricaoRouter' })

export const periodoInscricaoSchema = z.object({
  id: z.number(),
  ano: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  dataInicio: z.date(),
  dataFim: z.date(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
})

export const criarPeriodoInscricaoSchema = z
  .object({
    ano: z.number().min(2000).max(2050),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    dataInicio: z.date(),
    dataFim: z.date(),
  })
  .refine((data) => data.dataFim > data.dataInicio, {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['dataFim'],
  })

export const atualizarPeriodoInscricaoSchema = z
  .object({
    id: z.number(),
    ano: z.number().min(2000).max(2050).optional(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
    dataInicio: z.date().optional(),
    dataFim: z.date().optional(),
  })
  .refine(
    (data) => {
      if (data.dataInicio && data.dataFim) {
        return data.dataFim > data.dataInicio
      }
      return true
    },
    {
      message: 'Data de fim deve ser posterior à data de início',
      path: ['dataFim'],
    }
  )

export const periodoComEstatisticasSchema = periodoInscricaoSchema.extend({
  totalInscricoes: z.number(),
  totalProjetos: z.number(),
  statusAtual: z.enum(['FUTURO', 'ATIVO', 'ENCERRADO']),
})

export const periodoInscricaoRouter = createTRPCRouter({
  getPeriodos: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/periodos-inscricao',
        tags: ['periodos-inscricao'],
        summary: 'Get registration periods',
        description: 'Get all registration periods with statistics',
      },
    })
    .input(z.void())
    .output(z.array(periodoComEstatisticasSchema))
    .query(async ({ ctx }) => {
      try {
        const periodos = await ctx.db.query.periodoInscricaoTable.findMany({
          orderBy: (periodos, { desc }) => [desc(periodos.ano), desc(periodos.semestre)],
        })

        const periodosComEstatisticas = await Promise.all(
          periodos.map(async (periodo) => {
            // Contar inscrições do período
            const [totalInscricoes] = await ctx.db
              .select({ count: sql<number>`count(*)` })
              .from(inscricaoTable)
              .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
              .where(and(eq(projetoTable.ano, periodo.ano), eq(projetoTable.semestre, periodo.semestre)))

            // Contar projetos do período
            const [totalProjetos] = await ctx.db
              .select({ count: sql<number>`count(*)` })
              .from(projetoTable)
              .where(
                and(
                  eq(projetoTable.ano, periodo.ano),
                  eq(projetoTable.semestre, periodo.semestre),
                  eq(projetoTable.status, 'APPROVED')
                )
              )

            // Determinar status atual
            const agora = new Date()
            let statusAtual: 'FUTURO' | 'ATIVO' | 'ENCERRADO'

            if (agora < periodo.dataInicio) {
              statusAtual = 'FUTURO'
            } else if (agora >= periodo.dataInicio && agora <= periodo.dataFim) {
              statusAtual = 'ATIVO'
            } else {
              statusAtual = 'ENCERRADO'
            }

            return {
              ...periodo,
              totalInscricoes: Number(totalInscricoes.count),
              totalProjetos: Number(totalProjetos.count),
              statusAtual,
            }
          })
        )

        log.info('Períodos de inscrição recuperados com sucesso')
        return periodosComEstatisticas
      } catch (error) {
        log.error(error, 'Erro ao recuperar períodos de inscrição')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao recuperar períodos de inscrição',
        })
      }
    }),

  getPeriodo: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/periodos-inscricao/{id}',
        tags: ['periodos-inscricao'],
        summary: 'Get registration period',
        description: 'Get a specific registration period',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(periodoComEstatisticasSchema)
    .query(async ({ input, ctx }) => {
      const periodo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: eq(periodoInscricaoTable.id, input.id),
      })

      if (!periodo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Período de inscrição não encontrado',
        })
      }

      // Contar inscrições do período
      const [totalInscricoes] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, periodo.ano), eq(projetoTable.semestre, periodo.semestre)))

      // Contar projetos do período
      const [totalProjetos] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(projetoTable)
        .where(
          and(
            eq(projetoTable.ano, periodo.ano),
            eq(projetoTable.semestre, periodo.semestre),
            eq(projetoTable.status, 'APPROVED')
          )
        )

      // Determinar status atual
      const agora = new Date()
      let statusAtual: 'FUTURO' | 'ATIVO' | 'ENCERRADO'

      if (agora < periodo.dataInicio) {
        statusAtual = 'FUTURO'
      } else if (agora >= periodo.dataInicio && agora <= periodo.dataFim) {
        statusAtual = 'ATIVO'
      } else {
        statusAtual = 'ENCERRADO'
      }

      return {
        ...periodo,
        totalInscricoes: Number(totalInscricoes.count),
        totalProjetos: Number(totalProjetos.count),
        statusAtual,
      }
    }),

  getPeriodoAtivo: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/periodos-inscricao/ativo',
        tags: ['periodos-inscricao'],
        summary: 'Get active registration period',
        description: 'Get the currently active registration period',
      },
    })
    .input(z.void())
    .output(periodoComEstatisticasSchema.nullable())
    .query(async ({ ctx }) => {
      try {
        const agora = new Date()

        const periodoAtivo = await ctx.db.query.periodoInscricaoTable.findFirst({
          where: and(lte(periodoInscricaoTable.dataInicio, agora), gte(periodoInscricaoTable.dataFim, agora)),
        })

        if (!periodoAtivo) {
          return null
        }

        // Contar inscrições do período
        const [totalInscricoes] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(inscricaoTable)
          .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
          .where(and(eq(projetoTable.ano, periodoAtivo.ano), eq(projetoTable.semestre, periodoAtivo.semestre)))

        // Contar projetos do período
        const [totalProjetos] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(projetoTable)
          .where(
            and(
              eq(projetoTable.ano, periodoAtivo.ano),
              eq(projetoTable.semestre, periodoAtivo.semestre),
              eq(projetoTable.status, 'APPROVED')
            )
          )

        return {
          ...periodoAtivo,
          totalInscricoes: Number(totalInscricoes.count),
          totalProjetos: Number(totalProjetos.count),
          statusAtual: 'ATIVO' as const,
        }
      } catch (error) {
        log.error(error, 'Erro ao recuperar período ativo')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao recuperar período ativo',
        })
      }
    }),

  criarPeriodo: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/periodos-inscricao',
        tags: ['periodos-inscricao'],
        summary: 'Create registration period',
        description: 'Create a new registration period',
      },
    })
    .input(criarPeriodoInscricaoSchema)
    .output(periodoInscricaoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Verificar se não há sobreposição de períodos
        const periodoSobreposicao = await ctx.db.query.periodoInscricaoTable.findFirst({
          where: and(
            eq(periodoInscricaoTable.ano, input.ano),
            eq(periodoInscricaoTable.semestre, input.semestre),
            or(
              and(
                lte(periodoInscricaoTable.dataInicio, input.dataInicio),
                gte(periodoInscricaoTable.dataFim, input.dataInicio)
              ),
              and(
                lte(periodoInscricaoTable.dataInicio, input.dataFim),
                gte(periodoInscricaoTable.dataFim, input.dataFim)
              ),
              and(
                gte(periodoInscricaoTable.dataInicio, input.dataInicio),
                lte(periodoInscricaoTable.dataFim, input.dataFim)
              )
            )
          ),
        })

        if (periodoSobreposicao) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Já existe um período de inscrição que sobrepõe às datas informadas',
          })
        }

        const [novoPeriodo] = await ctx.db
          .insert(periodoInscricaoTable)
          .values({
            ano: input.ano,
            semestre: input.semestre,
            dataInicio: input.dataInicio,
            dataFim: input.dataFim,
          })
          .returning()

        log.info(
          { periodoId: novoPeriodo.id, ano: input.ano, semestre: input.semestre },
          'Período de inscrição criado com sucesso'
        )

        return novoPeriodo
      } catch (error) {
        log.error(error, 'Erro ao criar período de inscrição')
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar período de inscrição',
        })
      }
    }),

  atualizarPeriodo: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/periodos-inscricao/{id}',
        tags: ['periodos-inscricao'],
        summary: 'Update registration period',
        description: 'Update an existing registration period',
      },
    })
    .input(atualizarPeriodoInscricaoSchema)
    .output(periodoInscricaoSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input

      const periodo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: eq(periodoInscricaoTable.id, id),
      })

      if (!periodo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Período de inscrição não encontrado',
        })
      }

      // Se alterando datas, verificar sobreposição
      if (updateData.dataInicio || updateData.dataFim || updateData.ano || updateData.semestre) {
        const novoAno = updateData.ano || periodo.ano
        const novoSemestre = updateData.semestre || periodo.semestre
        const novaDataInicio = updateData.dataInicio || periodo.dataInicio
        const novaDataFim = updateData.dataFim || periodo.dataFim

        const periodoSobreposicao = await ctx.db.query.periodoInscricaoTable.findFirst({
          where: and(
            eq(periodoInscricaoTable.ano, novoAno),
            eq(periodoInscricaoTable.semestre, novoSemestre),
            // Excluir o próprio período da verificação
            sql`${periodoInscricaoTable.id} != ${id}`,
            or(
              and(
                lte(periodoInscricaoTable.dataInicio, novaDataInicio),
                gte(periodoInscricaoTable.dataFim, novaDataInicio)
              ),
              and(lte(periodoInscricaoTable.dataInicio, novaDataFim), gte(periodoInscricaoTable.dataFim, novaDataFim)),
              and(
                gte(periodoInscricaoTable.dataInicio, novaDataInicio),
                lte(periodoInscricaoTable.dataFim, novaDataFim)
              )
            )
          ),
        })

        if (periodoSobreposicao) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'As novas datas sobrepõem a um período existente',
          })
        }
      }

      const [periodoAtualizado] = await ctx.db
        .update(periodoInscricaoTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(periodoInscricaoTable.id, id))
        .returning()

      log.info({ periodoId: id }, 'Período de inscrição atualizado com sucesso')
      return periodoAtualizado
    }),

  deletarPeriodo: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/periodos-inscricao/{id}',
        tags: ['periodos-inscricao'],
        summary: 'Delete registration period',
        description: 'Delete a registration period',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const periodo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: eq(periodoInscricaoTable.id, input.id),
      })

      if (!periodo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Período de inscrição não encontrado',
        })
      }

      // Verificar se há inscrições associadas
      const [inscricoesAssociadas] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, periodo.ano), eq(projetoTable.semestre, periodo.semestre)))

      if (Number(inscricoesAssociadas.count) > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível excluir o período, pois há inscrições associadas',
        })
      }

      await ctx.db.delete(periodoInscricaoTable).where(eq(periodoInscricaoTable.id, input.id))

      log.info({ periodoId: input.id }, 'Período de inscrição excluído com sucesso')
      return { success: true }
    }),
})
