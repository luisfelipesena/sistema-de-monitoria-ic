import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { editalTable, periodoInscricaoTable, professorTable, projetoTable } from '@/server/db/schema'
import { sendEditalPublishedNotification } from '@/server/lib/email-service'
import minioClient, { bucketName } from '@/server/lib/minio'
import { EditalInternoTemplate, type EditalInternoData } from '@/server/lib/pdfTemplates/edital-interno'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { renderToBuffer } from '@react-pdf/renderer'
import { TRPCError } from '@trpc/server'
import { and, eq, gte, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'EditalRouter' })

// Schemas
export const editalSchema = z.object({
  id: z.number(),
  periodoInscricaoId: z.number(),
  tipo: z.enum(['DCC', 'PROGRAD']).default('DCC'),
  numeroEdital: z.string(),
  titulo: z.string().default('Edital Interno de Seleção de Monitores'),
  descricaoHtml: z.string().nullable(),
  fileIdAssinado: z.string().nullable(),
  fileIdProgradOriginal: z.string().nullable(),
  dataPublicacao: z.date().nullable(),
  publicado: z.boolean(),
  valorBolsa: z.string().default('400.00'),
  // Campos específicos para edital interno DCC
  datasProvasDisponiveis: z.string().nullable(), // JSON array de datas
  dataDivulgacaoResultado: z.date().nullable(),
  // Campos de assinatura do chefe
  chefeAssinouEm: z.date().nullable(),
  chefeAssinatura: z.string().nullable(),
  chefeDepartamentoId: z.number().nullable(),
  criadoPorUserId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
})

export const newEditalSchema = z
  .object({
    tipo: z.enum(['DCC', 'PROGRAD']).default('DCC'),
    numeroEdital: z.string().min(1, 'Número do edital é obrigatório'),
    titulo: z.string().min(1, 'Título é obrigatório'),
    descricaoHtml: z.string().optional(),
    valorBolsa: z.string().default('400.00'),
    ano: z.number().min(2000).max(2050),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    dataInicio: z.date(),
    dataFim: z.date(),
    fileIdProgradOriginal: z.string().optional(), // Para editais PROGRAD
    // Campos específicos para edital interno DCC
    datasProvasDisponiveis: z.array(z.string()).optional(), // Array de datas em formato ISO
    dataDivulgacaoResultado: z.date().optional(),
  })
  .refine((data) => data.dataFim > data.dataInicio, {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['dataFim'],
  })
  .refine(
    (data) => {
      if (data.tipo === 'PROGRAD' && !data.fileIdProgradOriginal) {
        return false
      }
      return true
    },
    {
      message: 'PDF da PROGRAD é obrigatório para editais do tipo PROGRAD',
      path: ['fileIdProgradOriginal'],
    }
  )

export const updateEditalSchema = z
  .object({
    id: z.number(),
    numeroEdital: z.string().optional(),
    titulo: z.string().optional(),
    descricaoHtml: z.string().optional(),
    ano: z.number().min(2000).max(2050).optional(),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
    dataInicio: z.date().optional(),
    dataFim: z.date().optional(),
    // Campos específicos para edital interno DCC
    datasProvasDisponiveis: z.array(z.string()).optional(),
    dataDivulgacaoResultado: z.date().optional(),
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

export const periodoInscricaoComStatusSchema = z.object({
  id: z.number(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  ano: z.number(),
  dataInicio: z.date(),
  dataFim: z.date(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  status: z.enum(['ATIVO', 'FUTURO', 'FINALIZADO']),
  totalProjetos: z.number().default(0),
  totalInscricoes: z.number().default(0),
})

export const editalListItemSchema = editalSchema.extend({
  periodoInscricao: periodoInscricaoComStatusSchema.nullable(),
  criadoPor: z
    .object({
      id: z.number(),
      username: z.string(),
      email: z.string(),
    })
    .nullable(),
})

export const editalRouter = createTRPCRouter({
  getActivePeriod: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais/active-period',
        tags: ['editais'],
        summary: 'Get active enrollment period',
        description: 'Get the currently active enrollment period',
      },
    })
    .input(z.void())
    .output(
      z.object({
        periodo: periodoInscricaoComStatusSchema.nullable(),
        edital: editalSchema.nullable(),
      })
    )
    .query(async ({ ctx }) => {
      try {
        const now = new Date()

        // Find active enrollment period
        const activePeriod = await ctx.db
          .select()
          .from(periodoInscricaoTable)
          .where(and(lte(periodoInscricaoTable.dataInicio, now), gte(periodoInscricaoTable.dataFim, now)))
          .limit(1)

        if (activePeriod.length === 0) {
          return { periodo: null, edital: null }
        }

        const period = activePeriod[0]

        // Get associated edital
        const edital = await ctx.db
          .select()
          .from(editalTable)
          .where(eq(editalTable.periodoInscricaoId, period.id))
          .limit(1)

        // Get statistics
        const [projectsCount] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(projetoTable)
          .where(
            and(
              eq(projetoTable.ano, period.ano),
              eq(projetoTable.semestre, period.semestre),
              eq(projetoTable.status, 'APPROVED')
            )
          )

        const periodWithStatus = {
          ...period,
          status: 'ATIVO' as const,
          totalProjetos: projectsCount?.count || 0,
          totalInscricoes: 0, // Could add this if needed
        }

        return {
          periodo: periodWithStatus,
          edital: edital[0] || null,
        }
      } catch (error) {
        log.error(error, 'Erro ao buscar período ativo')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar período ativo',
        })
      }
    }),

  getEditais: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais',
        tags: ['editais'],
        summary: 'List editais',
        description: 'Retrieve all editais with their enrollment periods',
      },
    })
    .input(z.void())
    .output(z.array(editalListItemSchema))
    .query(async ({ ctx }) => {
      try {
        log.info('Iniciando busca de editais')

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
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        })

        log.info({ count: editaisComPeriodo.length }, 'Editais encontrados no banco')

        const now = new Date()
        const resultadoFinal = editaisComPeriodo.map((edital) => {
          let statusPeriodo: 'ATIVO' | 'FUTURO' | 'FINALIZADO' = 'FINALIZADO'
          if (edital.periodoInscricao) {
            try {
              const inicio = new Date(edital.periodoInscricao.dataInicio)
              const fim = new Date(edital.periodoInscricao.dataFim)

              if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
                if (now >= inicio && now <= fim) {
                  statusPeriodo = 'ATIVO'
                } else if (now < inicio) {
                  statusPeriodo = 'FUTURO'
                }
              }
            } catch (error) {
              log.warn({ editalId: edital.id, error }, 'Erro ao calcular status do período')
            }
          }
          return {
            ...edital,
            periodoInscricao: edital.periodoInscricao
              ? {
                  ...edital.periodoInscricao,
                  status: statusPeriodo,
                  totalProjetos: 0,
                  totalInscricoes: 0,
                }
              : null,
          }
        })

        return resultadoFinal
      } catch (error) {
        log.error(error, 'Erro ao listar editais')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar editais',
        })
      }
    }),

  getEdital: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais/{id}',
        tags: ['editais'],
        summary: 'Get edital',
        description: 'Retrieve a specific edital',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(editalListItemSchema)
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
              status: statusPeriodo,
              totalProjetos: 0,
              totalInscricoes: 0,
            }
          : null,
      }
    }),

  createEdital: adminProtectedProcedure
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
    .output(editalListItemSchema)
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
    }),

  updateEdital: adminProtectedProcedure
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
    }),

  deleteEdital: adminProtectedProcedure
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

      await ctx.db.delete(editalTable).where(eq(editalTable.id, input.id))
      await ctx.db.delete(periodoInscricaoTable).where(eq(periodoInscricaoTable.id, edital.periodoInscricaoId))

      log.info({ editalId: input.id, periodoId: edital.periodoInscricaoId }, 'Edital e período excluídos com sucesso')
    }),

  publishEdital: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/publish',
        tags: ['editais'],
        summary: 'Publish edital',
        description: 'Publish an edital making it publicly available',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(editalSchema)
    .mutation(async ({ input, ctx }) => {
      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
      })

      if (!edital) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Validar se o edital está completo antes de publicar
      if (!edital.titulo || edital.titulo.trim() === '') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O edital precisa ter um título antes de ser publicado.',
        })
      }

      if (!edital.descricaoHtml || edital.descricaoHtml.trim() === '') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O edital precisa ter uma descrição antes de ser publicado.',
        })
      }

      if (!edital.fileIdAssinado) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O edital precisa estar assinado antes de ser publicado.',
        })
      }

      // Verificar se existem projetos aprovados para este período
      const editalComPeriodo = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
        with: {
          periodoInscricao: true,
        },
      })

      if (editalComPeriodo?.periodoInscricao) {
        const projetosAprovados = await ctx.db.query.projetoTable.findMany({
          where: and(
            eq(projetoTable.ano, editalComPeriodo.periodoInscricao.ano),
            eq(projetoTable.semestre, editalComPeriodo.periodoInscricao.semestre),
            eq(projetoTable.status, 'APPROVED')
          ),
          limit: 1, // Apenas verificar se existe pelo menos um
        })

        if (projetosAprovados.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível publicar um edital sem projetos aprovados.',
          })
        }
      }

      const [updated] = await ctx.db
        .update(editalTable)
        .set({
          publicado: true,
          dataPublicacao: new Date(),
        })
        .where(eq(editalTable.id, input.id))
        .returning()

      log.info({ editalId: input.id, adminUserId: ctx.user.id }, 'Edital publicado com sucesso')

      return updated
    }),

  publishAndNotify: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/publish-and-notify',
        tags: ['editais'],
        summary: 'Publish edital and send notification emails',
        description: 'Publish an edital and automatically send notification emails to students and professors',
      },
    })
    .input(
      z.object({
        id: z.number(),
        emailLists: z.array(z.string().email()).optional().default([
          'estudantes.ic@ufba.br', // Lista de estudantes
          'professores.ic@ufba.br', // Lista de professores
        ]),
      })
    )
    .output(
      z.object({
        edital: editalSchema,
        emailsSent: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Primeiro publica o edital usando a lógica existente
      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
        with: {
          periodoInscricao: true,
        },
      })

      if (!edital) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Validar se o edital está completo antes de publicar
      if (!edital.titulo || edital.titulo.trim() === '') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O edital precisa ter um título antes de ser publicado.',
        })
      }

      if (!edital.descricaoHtml || edital.descricaoHtml.trim() === '') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O edital precisa ter uma descrição antes de ser publicado.',
        })
      }

      if (!edital.fileIdAssinado) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O edital precisa estar assinado antes de ser publicado.',
        })
      }

      // Verificar se existem projetos aprovados para este período
      if (edital.periodoInscricao) {
        const projetosAprovados = await ctx.db.query.projetoTable.findMany({
          where: and(
            eq(projetoTable.ano, edital.periodoInscricao.ano),
            eq(projetoTable.semestre, edital.periodoInscricao.semestre),
            eq(projetoTable.status, 'APPROVED')
          ),
          limit: 1, // Apenas verificar se existe pelo menos um
        })

        if (projetosAprovados.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível publicar um edital sem projetos aprovados.',
          })
        }
      }

      // Publicar o edital
      const [updatedEdital] = await ctx.db
        .update(editalTable)
        .set({
          publicado: true,
          dataPublicacao: new Date(),
        })
        .where(eq(editalTable.id, input.id))
        .returning()

      // Enviar notificações por email
      const semestreFormatado = edital.periodoInscricao?.semestre === 'SEMESTRE_1' ? '1º Semestre' : '2º Semestre'
      const linkPDF = `${env.CLIENT_URL}/api/editais/${input.id}/pdf`

      try {
        await sendEditalPublishedNotification({
          editalNumero: edital.numeroEdital,
          editalTitulo: edital.titulo,
          semestreFormatado,
          ano: edital.periodoInscricao?.ano || new Date().getFullYear(),
          linkPDF,
          to: input.emailLists,
        })

        log.info(
          {
            editalId: input.id,
            adminUserId: ctx.user.id,
            emailsSent: input.emailLists.length,
          },
          'Edital publicado e emails enviados com sucesso'
        )

        return {
          edital: updatedEdital,
          emailsSent: input.emailLists.length,
        }
      } catch (emailError) {
        log.error({ error: emailError, editalId: input.id }, 'Erro ao enviar emails de notificação')

        // Mesmo com erro nos emails, retorna sucesso da publicação
        return {
          edital: updatedEdital,
          emailsSent: 0,
        }
      }
    }),

  uploadSignedEdital: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/upload-signed',
        tags: ['editais'],
        summary: 'Upload signed edital',
        description: 'Upload a signed version of the edital PDF',
      },
    })
    .input(
      z.object({
        id: z.number(),
        fileId: z.string(),
      })
    )
    .output(editalSchema)
    .mutation(async ({ input, ctx }) => {
      const [updated] = await ctx.db
        .update(editalTable)
        .set({
          fileIdAssinado: input.fileId,
        })
        .where(eq(editalTable.id, input.id))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      log.info(
        {
          editalId: input.id,
          fileId: input.fileId,
          adminUserId: ctx.user.id,
        },
        'Edital assinado enviado com sucesso'
      )

      return updated
    }),

  getPublicEditais: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/public/editais',
        tags: ['editais'],
        summary: 'Get public editais',
        description: 'Retrieve all published editais',
      },
    })
    .input(z.void())
    .output(z.array(editalListItemSchema))
    .query(async ({ ctx }) => {
      const editaisPublicados = await ctx.db.query.editalTable.findMany({
        where: eq(editalTable.publicado, true),
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
        orderBy: (table, { desc }) => [desc(table.dataPublicacao)],
      })

      const now = new Date()
      return editaisPublicados.map((edital) => {
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
                status: statusPeriodo,
                totalProjetos: 0,
                totalInscricoes: 0,
              }
            : null,
        }
      })
    }),

  generateEditalPdf: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/pdf',
        tags: ['editais'],
        summary: 'Generate edital PDF',
        description: 'Generate PDF for edital interno using template',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(z.object({ url: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { id } = input
        const userId = ctx.user.id

        log.info({ editalId: id, userId }, 'Gerando PDF do edital interno')

        const edital = await ctx.db.query.editalTable.findFirst({
          where: eq(editalTable.id, id),
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

        if (!edital || !edital.periodoInscricao) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Edital ou período de inscrição não encontrado',
          })
        }

        const projetos = await ctx.db.query.projetoTable.findMany({
          where: and(
            eq(projetoTable.ano, edital.periodoInscricao.ano),
            eq(projetoTable.semestre, edital.periodoInscricao.semestre),
            eq(projetoTable.status, 'APPROVED')
          ),
          with: {
            departamento: true,
            professorResponsavel: {
              with: {
                user: true,
              },
            },
            disciplinas: {
              with: {
                disciplina: true,
              },
            },
          },
        })

        const editalData: EditalInternoData = {
          numeroEdital: edital.numeroEdital,
          ano: edital.periodoInscricao.ano,
          semestre: edital.periodoInscricao.semestre,
          titulo: edital.titulo,
          descricao: edital.descricaoHtml || undefined,
          periodoInscricao: {
            dataInicio: edital.periodoInscricao.dataInicio.toISOString(),
            dataFim: edital.periodoInscricao.dataFim.toISOString(),
          },
          formularioInscricaoUrl: `${env.NEXT_PUBLIC_APP_URL}/student/inscricao-monitoria`,
          chefeResponsavel: {
            nome: 'Prof. Dr. [Nome do Chefe]',
            cargo: 'Chefe do Departamento de Ciência da Computação',
          },
          disciplinas: projetos.map((projeto) => ({
            codigo: projeto.disciplinas[0]?.disciplina.codigo || 'MON',
            nome: projeto.titulo,
            professor: {
              nome: projeto.professorResponsavel.nomeCompleto,
              email: projeto.professorResponsavel.user.email,
            },
            tipoMonitoria: 'INDIVIDUAL' as const,
            numBolsistas: projeto.bolsasDisponibilizadas || 0,
            numVoluntarios: projeto.voluntariosSolicitados || 0,
            pontosSelecao: ['Conteúdo da disciplina', 'Exercícios práticos', 'Conceitos fundamentais'],
            bibliografia: ['Bibliografia básica da disciplina'],
          })),
        }

        const pdfBuffer = await renderToBuffer(EditalInternoTemplate({ data: editalData }))

        const fileName = `editais/edital-${edital.numeroEdital}-${edital.periodoInscricao.ano}-${edital.periodoInscricao.semestre}.pdf`

        await minioClient.putObject(bucketName, fileName, pdfBuffer, pdfBuffer.length, {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'max-age=3600',
        })

        const presignedUrl = await minioClient.presignedGetObject(bucketName, fileName, 24 * 60 * 60)

        log.info({ editalId: id, fileName }, 'PDF do edital gerado e salvo com sucesso')

        return { url: presignedUrl }
      } catch (error) {
        log.error(error, 'Erro ao gerar PDF do edital')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao gerar PDF do edital',
        })
      }
    }),

  // Get editais by semester and type
  getEditaisBySemestre: protectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        tipo: z.enum(['DCC', 'PROGRAD']).optional(),
        publicadoApenas: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const { ano, semestre, tipo, publicadoApenas } = input

      // First get periodo inscricao for the semester
      const periodos = await ctx.db.query.periodoInscricaoTable.findMany({
        where: and(eq(periodoInscricaoTable.ano, ano), eq(periodoInscricaoTable.semestre, semestre)),
      })

      if (periodos.length === 0) {
        return []
      }

      const periodoIds = periodos.map((p) => p.id)

      // Then get editais for those periods
      const editais = await ctx.db.query.editalTable.findMany({
        where: and(
          inArray(editalTable.periodoInscricaoId, periodoIds),
          tipo ? eq(editalTable.tipo, tipo) : undefined,
          publicadoApenas ? eq(editalTable.publicado, true) : undefined
        ),
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
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      })

      return editais.map((edital) => ({
        ...edital,
        periodoInscricao: edital.periodoInscricao
          ? {
              ...edital.periodoInscricao,
              status: 'ATIVO' as const, // Simplified for now
              totalProjetos: 0,
              totalInscricoes: 0,
            }
          : null,
      }))
    }),

  // Get current active edital for a semester
  getCurrentEditalForSemestre: protectedProcedure
    .input(
      z.object({
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .query(async ({ input, ctx }) => {
      const { ano, semestre } = input

      // First get periodo inscricao for the semester
      const periodo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(eq(periodoInscricaoTable.ano, ano), eq(periodoInscricaoTable.semestre, semestre)),
      })

      if (!periodo) {
        return null
      }

      // Then get the latest published edital for that period
      const edital = await ctx.db.query.editalTable.findFirst({
        where: and(eq(editalTable.periodoInscricaoId, periodo.id), eq(editalTable.publicado, true)),
        with: {
          periodoInscricao: true,
        },
        orderBy: (table, { desc }) => [desc(table.dataPublicacao)],
      })

      return edital || null
    }),

  // Specific endpoints for internal DCC announcement management
  setAvailableExamDates: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/exam-dates',
        tags: ['editais'],
        summary: 'Set available exam dates',
        description: 'Admin defines available exam dates for internal DCC announcement',
      },
    })
    .input(
      z.object({
        id: z.number(),
        datasProvasDisponiveis: z.array(z.string()).min(1, 'Pelo menos uma data deve ser definida'),
        dataDivulgacaoResultado: z.date().optional(),
      })
    )
    .output(editalSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, datasProvasDisponiveis, dataDivulgacaoResultado } = input

      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, id),
      })

      if (!edital) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Edital não encontrado' })
      }

      if (edital.tipo !== 'DCC') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Datas de prova só podem ser definidas para editais internos DCC',
        })
      }

      const [updated] = await ctx.db
        .update(editalTable)
        .set({
          datasProvasDisponiveis: JSON.stringify(datasProvasDisponiveis),
          dataDivulgacaoResultado: dataDivulgacaoResultado || null,
          updatedAt: new Date(),
        })
        .where(eq(editalTable.id, id))
        .returning()

      log.info(
        { editalId: id, datasCount: datasProvasDisponiveis.length, adminUserId: ctx.user.id },
        'Datas de prova definidas para edital interno'
      )

      return updated
    }),

  getAvailableExamDates: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais/{id}/exam-dates',
        tags: ['editais'],
        summary: 'Get available exam dates',
        description: 'Get available exam dates for internal DCC announcement',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(
      z.object({
        datasProvasDisponiveis: z.array(z.string()).nullable(),
        dataDivulgacaoResultado: z.date().nullable(),
      })
    )
    .query(async ({ input, ctx }) => {
      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
        columns: {
          datasProvasDisponiveis: true,
          dataDivulgacaoResultado: true,
        },
      })

      if (!edital) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Edital não encontrado' })
      }

      return {
        datasProvasDisponiveis: edital.datasProvasDisponiveis ? JSON.parse(edital.datasProvasDisponiveis) : null,
        dataDivulgacaoResultado: edital.dataDivulgacaoResultado,
      }
    }),

  requestChefeSignature: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/request-chefe-signature',
        tags: ['editais'],
        summary: 'Request chief signature',
        description: 'Request department chief to sign the edital',
      },
    })
    .input(
      z.object({
        id: z.number(),
        chefeEmail: z.string().email().optional(), // Email do chefe para notificação
      })
    )
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se o edital existe e está pronto para assinatura
      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
        with: { periodoInscricao: true },
      })

      if (!edital) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Edital não encontrado' })
      }

      if (edital.chefeAssinouEm) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este edital já foi assinado pelo chefe do departamento',
        })
      }

      if (!edital.titulo || !edital.descricaoHtml) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O edital precisa estar completo antes de solicitar assinatura',
        })
      }

      // TODO: Enviar notificação por email para o chefe
      // if (input.chefeEmail) {
      //   await sendEmailToChefe(input.chefeEmail, edital)
      // }

      log.info(
        {
          editalId: input.id,
          requestedBy: ctx.user.id,
          chefeEmail: input.chefeEmail,
        },
        'Assinatura do chefe solicitada'
      )

      return {
        success: true,
        message: 'Solicitação de assinatura enviada com sucesso',
      }
    }),

  signAsChefe: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/editais/{id}/sign-as-chefe',
        tags: ['editais'],
        summary: 'Sign as chief',
        description: 'Sign the edital as department chief',
      },
    })
    .input(
      z.object({
        id: z.number(),
        assinatura: z.string(), // Base64 da assinatura ou URL
      })
    )
    .output(editalSchema)
    .mutation(async ({ input, ctx }) => {
      // Verificar se o usuário é chefe do departamento
      const professor = await ctx.db.query.professorTable.findFirst({
        where: eq(professorTable.userId, ctx.user.id),
        with: { departamento: true },
      })

      if (!professor) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores podem assinar como chefe',
        })
      }

      // TODO: Verificar se o professor é realmente o chefe do departamento
      // Por enquanto, vamos permitir que qualquer admin ou professor com permissão especial assine

      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
      })

      if (!edital) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Edital não encontrado' })
      }

      if (edital.chefeAssinouEm) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este edital já foi assinado pelo chefe',
        })
      }

      // Atualizar o edital com a assinatura do chefe
      const [updated] = await ctx.db
        .update(editalTable)
        .set({
          chefeAssinatura: input.assinatura,
          chefeAssinouEm: new Date(),
          chefeDepartamentoId: ctx.user.id,
          updatedAt: new Date(),
        })
        .where(eq(editalTable.id, input.id))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }

      log.info(
        {
          editalId: input.id,
          chefeDepartamentoId: ctx.user.id,
        },
        'Edital assinado pelo chefe do departamento'
      )

      return updated
    }),

  getEditaisParaAssinar: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/editais/para-assinar',
        tags: ['editais'],
        summary: 'Get editais pending signature',
        description: 'Get list of editais pending chief signature',
      },
    })
    .input(z.void())
    .output(z.array(editalListItemSchema))
    .query(async ({ ctx }) => {
      // Buscar editais que ainda não foram assinados pelo chefe
      const editais = await ctx.db.query.editalTable.findMany({
        where: and(isNull(editalTable.chefeAssinouEm), eq(editalTable.tipo, 'DCC'), isNotNull(editalTable.titulo)),
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
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      })

      const now = new Date()
      return editais.map((edital) => {
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
                status: statusPeriodo,
                totalProjetos: 0,
                totalInscricoes: 0,
              }
            : null,
        }
      })
    }),
})
