import { adminProtectedProcedure } from '@/server/api/trpc'
import { editalTable, periodoInscricaoTable } from '@/server/db/schema'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, gte, lte, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { editalSchema, newEditalSchema, updateEditalSchema } from '../schemas'

const log = logger.child({ context: 'EditalRouter.CRUD' })

export const createEditalHandler = adminProtectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/editais',
      tags: ['editais'],
      summary: 'Create edital',
      description: 'Create a new edital with its enrollment period',
    },
  })
  .input(newEditalSchema)
  .mutation(async ({ input, ctx }) => {
    try {
      const adminUserId = ctx.user.id
      const {
        ano,
        semestre,
        dataInicio,
        dataFim,
        numeroEdital,
        titulo,
        descricaoHtml,
        tipo,
        valorBolsa,
        fileIdProgradOriginal,
        datasProvasDisponiveis,
        dataDivulgacaoResultado,
      } = input

      const numeroEditalExistente = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.numeroEdital, numeroEdital),
      })
      if (numeroEditalExistente) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este número de edital já está em uso.',
        })
      }

      const periodoSobreposicao = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(
          eq(periodoInscricaoTable.ano, ano),
          eq(periodoInscricaoTable.semestre, semestre),
          or(
            and(lte(periodoInscricaoTable.dataInicio, dataInicio), gte(periodoInscricaoTable.dataFim, dataInicio)),
            and(lte(periodoInscricaoTable.dataInicio, dataFim), gte(periodoInscricaoTable.dataFim, dataFim)),
            and(gte(periodoInscricaoTable.dataInicio, dataInicio), lte(periodoInscricaoTable.dataFim, dataFim))
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
          ano,
          semestre,
          dataInicio,
          dataFim,
        })
        .returning()

      const [novoEdital] = await ctx.db
        .insert(editalTable)
        .values({
          periodoInscricaoId: novoPeriodo.id,
          tipo,
          numeroEdital,
          titulo,
          descricaoHtml: descricaoHtml || null,
          valorBolsa,
          fileIdProgradOriginal: fileIdProgradOriginal || null,
          datasProvasDisponiveis: datasProvasDisponiveis ? JSON.stringify(datasProvasDisponiveis) : null,
          dataDivulgacaoResultado: dataDivulgacaoResultado || null,
          criadoPorUserId: adminUserId,
          publicado: false,
        })
        .returning()

      const editalCriadoComPeriodo = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, novoEdital.id),
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

      if (!editalCriadoComPeriodo) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }

      const now = new Date()
      let statusPeriodo: 'ATIVO' | 'FUTURO' | 'FINALIZADO' = 'FINALIZADO'
      if (editalCriadoComPeriodo.periodoInscricao) {
        const inicio = new Date(editalCriadoComPeriodo.periodoInscricao.dataInicio)
        const fim = new Date(editalCriadoComPeriodo.periodoInscricao.dataFim)

        if (now >= inicio && now <= fim) {
          statusPeriodo = 'ATIVO'
        } else if (now < inicio) {
          statusPeriodo = 'FUTURO'
        }
      }

      log.info(
        { editalId: editalCriadoComPeriodo.id, periodoId: novoPeriodo.id, adminUserId },
        'Novo edital e período criados com sucesso'
      )

      return {
        ...editalCriadoComPeriodo,
        periodoInscricao: editalCriadoComPeriodo.periodoInscricao
          ? {
              ...editalCriadoComPeriodo.periodoInscricao,
              editalId: editalCriadoComPeriodo.id,
              status: statusPeriodo,
              totalProjetos: 0,
              totalInscricoes: 0,
            }
          : null,
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      log.error(error, 'Erro ao criar novo edital')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao criar edital',
      })
    }
  })

export const updateEditalHandler = adminProtectedProcedure
  .meta({
    openapi: {
      method: 'PUT',
      path: '/editais/{id}',
      tags: ['editais'],
      summary: 'Update edital',
      description: 'Update an existing edital and its enrollment period',
    },
  })
  .input(updateEditalSchema)
  .output(editalSchema)
  .mutation(async ({ input, ctx }) => {
    const {
      id,
      ano,
      semestre,
      dataInicio,
      dataFim,
      datasProvasDisponiveis,
      dataDivulgacaoResultado,
      ...editalUpdateData
    } = input

    const edital = await ctx.db.query.editalTable.findFirst({
      where: eq(editalTable.id, id),
      with: { periodoInscricao: true },
    })

    if (!edital) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    if (ano !== undefined || semestre !== undefined || dataInicio !== undefined || dataFim !== undefined) {
      const novoAno = ano || edital.periodoInscricao?.ano
      const novoSemestre = semestre || edital.periodoInscricao?.semestre
      const novaDataInicio = dataInicio || edital.periodoInscricao?.dataInicio
      const novaDataFim = dataFim || edital.periodoInscricao?.dataFim

      const periodoSobreposicao = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(
          eq(periodoInscricaoTable.ano, novoAno),
          eq(periodoInscricaoTable.semestre, novoSemestre),
          sql`${periodoInscricaoTable.id} != ${edital.periodoInscricaoId}`,
          or(
            and(
              lte(periodoInscricaoTable.dataInicio, novaDataInicio),
              gte(periodoInscricaoTable.dataFim, novaDataInicio)
            ),
            and(lte(periodoInscricaoTable.dataInicio, novaDataFim), gte(periodoInscricaoTable.dataFim, novaDataFim)),
            and(gte(periodoInscricaoTable.dataInicio, novaDataInicio), lte(periodoInscricaoTable.dataFim, novaDataFim))
          )
        ),
      })

      if (periodoSobreposicao) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'As novas datas sobrepõem a um período existente',
        })
      }

      await ctx.db
        .update(periodoInscricaoTable)
        .set({
          ano: novoAno,
          semestre: novoSemestre,
          dataInicio: novaDataInicio,
          dataFim: novaDataFim,
          updatedAt: new Date(),
        })
        .where(eq(periodoInscricaoTable.id, edital.periodoInscricaoId))
    }

    const [updated] = await ctx.db
      .update(editalTable)
      .set({
        ...editalUpdateData,
        datasProvasDisponiveis:
          datasProvasDisponiveis !== undefined
            ? datasProvasDisponiveis
              ? JSON.stringify(datasProvasDisponiveis)
              : null
            : undefined,
        dataDivulgacaoResultado: dataDivulgacaoResultado !== undefined ? dataDivulgacaoResultado || null : undefined,
        updatedAt: new Date(),
      })
      .where(eq(editalTable.id, id))
      .returning()

    if (!updated) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    return updated
  })

export const deleteEditalHandler = adminProtectedProcedure
  .meta({
    openapi: {
      method: 'DELETE',
      path: '/editais/{id}',
      tags: ['editais'],
      summary: 'Delete edital',
      description: 'Delete an edital and its associated enrollment period',
    },
  })
  .input(
    z.object({
      id: z.number(),
    })
  )
  .output(z.void())
  .mutation(async ({ input, ctx }) => {
    const edital = await ctx.db.query.editalTable.findFirst({
      where: eq(editalTable.id, input.id),
    })

    if (!edital) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    if (edital.publicado) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Não é possível excluir um edital publicado',
      })
    }

    await ctx.db.delete(editalTable).where(eq(editalTable.id, input.id))
    await ctx.db.delete(periodoInscricaoTable).where(eq(periodoInscricaoTable.id, edital.periodoInscricaoId))

    log.info({ editalId: input.id }, 'Edital deletado com sucesso')
  })
