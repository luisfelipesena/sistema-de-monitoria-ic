import { protectedProcedure } from '@/server/api/trpc'
import { editalTable, inscricaoTable, periodoInscricaoTable, projetoTable } from '@/server/db/schema'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, count, eq, inArray, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'EditalRouter.List' })

export const listEditaisHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/editais',
      tags: ['editais'],
      summary: 'List editais',
      description: 'List all available editais with their enrollment periods',
    },
  })
  .input(z.void())
  .query(async ({ ctx }) => {
    try {
      const isAdmin = ctx.user.role === 'admin'

      const editaisComPeriodo = await ctx.db.query.editalTable.findMany({
        with: {
          periodoInscricao: true,
          criadoPor: {
            columns: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: (editais, { desc }) => [desc(editais.createdAt)],
      })

      const periodosIds = editaisComPeriodo.map((e) => e.periodoInscricaoId).filter((id) => id !== null) as number[]

      let projetosPorPeriodo: { periodoInscricaoId: number; count: number }[] = []
      let inscricoesPorPeriodo: { periodoInscricaoId: number; count: number }[] = []

      if (periodosIds.length > 0) {
        projetosPorPeriodo = await ctx.db
          .select({
            periodoInscricaoId: periodoInscricaoTable.id,
            count: count(projetoTable.id),
          })
          .from(periodoInscricaoTable)
          .leftJoin(
            projetoTable,
            and(
              eq(projetoTable.ano, periodoInscricaoTable.ano),
              eq(projetoTable.semestre, periodoInscricaoTable.semestre),
              eq(projetoTable.status, 'APPROVED'),
              isNull(projetoTable.deletedAt)
            )
          )
          .where(inArray(periodoInscricaoTable.id, periodosIds))
          .groupBy(periodoInscricaoTable.id)

        inscricoesPorPeriodo = await ctx.db
          .select({
            periodoInscricaoId: inscricaoTable.periodoInscricaoId,
            count: count(inscricaoTable.id),
          })
          .from(inscricaoTable)
          .where(inArray(inscricaoTable.periodoInscricaoId, periodosIds))
          .groupBy(inscricaoTable.periodoInscricaoId)
      }

      const projetosMap = new Map(projetosPorPeriodo.map((p) => [p.periodoInscricaoId, p.count]))
      const inscricoesMap = new Map(inscricoesPorPeriodo.map((i) => [i.periodoInscricaoId, i.count]))

      const now = new Date()
      return editaisComPeriodo
        .filter((edital) => {
          return isAdmin || edital.publicado
        })
        .map((edital) => {
          let statusPeriodo: 'ATIVO' | 'FUTURO' | 'FINALIZADO' = 'FINALIZADO'
          if (edital.periodoInscricao) {
            const inicio = new Date(edital.periodoInscricao.dataInicio)
            const fim = new Date(edital.periodoInscricao.dataFim)

            if (now >= inicio && now <= fim) {
              statusPeriodo = 'ATIVO'
            } else if (now < inicio) {
              statusPeriodo = 'FUTURO'
            }
          }

          const totalProjetos = edital.periodoInscricaoId ? projetosMap.get(edital.periodoInscricaoId) || 0 : 0
          const totalInscricoes = edital.periodoInscricaoId ? inscricoesMap.get(edital.periodoInscricaoId) || 0 : 0

          return {
            ...edital,
            periodoInscricao: edital.periodoInscricao
              ? {
                  ...edital.periodoInscricao,
                  editalId: edital.id,
                  status: statusPeriodo,
                  totalProjetos,
                  totalInscricoes,
                }
              : null,
          }
        })
    } catch (error) {
      log.error(error, 'Erro ao listar editais')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar editais',
      })
    }
  })

export const getEditalByIdHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/editais/{id}',
      tags: ['editais'],
      summary: 'Get edital',
      description: 'Get a specific edital by ID',
    },
  })
  .input(
    z.object({
      id: z.number(),
    })
  )
  .query(async ({ input, ctx }) => {
    const edital = await ctx.db.query.editalTable.findFirst({
      where: eq(editalTable.id, input.id),
      with: {
        periodoInscricao: true,
        criadoPor: {
          columns: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    if (!edital) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    const now = new Date()
    let statusPeriodo: 'ATIVO' | 'FUTURO' | 'FINALIZADO' = 'FINALIZADO'
    if (edital.periodoInscricao) {
      const inicio = new Date(edital.periodoInscricao.dataInicio)
      const fim = new Date(edital.periodoInscricao.dataFim)

      if (now >= inicio && now <= fim) {
        statusPeriodo = 'ATIVO'
      } else if (now < inicio) {
        statusPeriodo = 'FUTURO'
      }
    }

    return {
      ...edital,
      periodoInscricao: edital.periodoInscricao
        ? {
            ...edital.periodoInscricao,
            editalId: edital.id,
            status: statusPeriodo,
            totalProjetos: 0,
            totalInscricoes: 0,
          }
        : null,
    }
  })

export const getCurrentPeriodoHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/editais/periodo-atual',
      tags: ['editais'],
      summary: 'Get current enrollment period',
      description: 'Get the current active enrollment period with edital details',
    },
  })
  .input(z.void())
  .query(async ({ ctx }) => {
    try {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      const currentSemester = currentMonth <= 6 ? 'SEMESTRE_1' : 'SEMESTRE_2'

      // Procura período ativo no semestre atual
      const periodoAtual = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(
          eq(periodoInscricaoTable.ano, currentYear),
          eq(periodoInscricaoTable.semestre, currentSemester),
          sql`${periodoInscricaoTable.dataInicio} <= ${now}`,
          sql`${periodoInscricaoTable.dataFim} >= ${now}`
        ),
        with: {
          edital: true,
        },
      })

      if (!periodoAtual) {
        return null
      }

      // Contar projetos aprovados no período
      const [projetosCount] = await ctx.db
        .select({ count: count(projetoTable.id) })
        .from(projetoTable)
        .where(
          and(
            eq(projetoTable.ano, periodoAtual.ano),
            eq(projetoTable.semestre, periodoAtual.semestre),
            eq(projetoTable.status, 'APPROVED'),
            isNull(projetoTable.deletedAt)
          )
        )

      // Contar inscrições no período
      const [inscricoesCount] = await ctx.db
        .select({ count: count(inscricaoTable.id) })
        .from(inscricaoTable)
        .where(eq(inscricaoTable.periodoInscricaoId, periodoAtual.id))

      return {
        ...periodoAtual,
        editalId: periodoAtual.edital?.id || 0,
        status: 'ATIVO' as const,
        totalProjetosAprovados: projetosCount?.count || 0,
        totalInscricoes: inscricoesCount?.count || 0,
      }
    } catch (error) {
      log.error(error, 'Erro ao buscar período atual')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar período de inscrição atual',
      })
    }
  })
