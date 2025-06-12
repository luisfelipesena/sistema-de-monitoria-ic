import { createTRPCRouter, protectedProcedure, adminProtectedProcedure } from '@/server/api/trpc'
import { editalTable, periodoInscricaoTable, projetoTable } from '@/server/db/schema'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { eq, and, or, lte, gte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { renderToBuffer } from '@react-pdf/renderer'
import { EditalInternoTemplate, type EditalInternoData } from '@/server/lib/pdfTemplates/edital-interno'
import minioClient, { bucketName } from '@/server/lib/minio'

const log = logger.child({ context: 'EditalRouter' })

// Schemas
export const editalSchema = z.object({
  id: z.number(),
  periodoInscricaoId: z.number(),
  numeroEdital: z.string(),
  titulo: z.string().default('Edital Interno de Seleção de Monitores'),
  descricaoHtml: z.string().nullable(),
  fileIdAssinado: z.string().nullable(),
  dataPublicacao: z.date().nullable(),
  publicado: z.boolean(),
  criadoPorUserId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
})

export const newEditalSchema = z
  .object({
    numeroEdital: z.string().min(1, 'Número do edital é obrigatório'),
    titulo: z.string().min(1, 'Título é obrigatório'),
    descricaoHtml: z.string().optional(),
    ano: z.number().min(2000).max(2050),
    semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
    dataInicio: z.date(),
    dataFim: z.date(),
  })
  .refine((data) => data.dataFim > data.dataInicio, {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['dataFim'],
  })

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
        const { ano, semestre, dataInicio, dataFim, numeroEdital, titulo, descricaoHtml } = input

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
            numeroEdital,
            titulo,
            descricaoHtml: descricaoHtml || null,
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
      const { id, ano, semestre, dataInicio, dataFim, ...editalUpdateData } = input

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

      if (!edital.fileIdAssinado) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O edital precisa estar assinado antes de ser publicado.',
        })
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
          formularioInscricaoUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/inscricao-monitoria`,
          chefeResponsavel: {
            nome: 'Prof. Dr. [Nome do Chefe]',
            cargo: 'Chefe do Departamento de Ciência da Computação',
          },
          disciplinas: projetos.map((projeto) => ({
            codigo: projeto.disciplinas[0]?.disciplina.codigo || 'MON',
            nome: projeto.titulo,
            professor: {
              nome: projeto.professorResponsavel.user.username,
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
})
