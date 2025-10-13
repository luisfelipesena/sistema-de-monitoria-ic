import { adminProtectedProcedure, protectedProcedure } from '@/server/api/trpc'
import { editalTable, professorTable, projetoTable } from '@/server/db/schema'
import getMinioClient, { bucketName } from '@/server/lib/minio'
import { EditalInternoTemplate, type EditalInternoData } from '@/server/lib/pdfTemplates/edital-interno'
import { logger } from '@/utils/logger'
import { renderToBuffer } from '@react-pdf/renderer'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { signEditalSchema } from '../schemas'

const log = logger.child({ context: 'EditalRouter.Publication' })

export const publishEditalHandler = adminProtectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/editais/{id}/publicar',
      tags: ['editais'],
      summary: 'Publish edital',
      description: 'Publish an edital and notify relevant users',
    },
  })
  .input(
    z.object({
      id: z.number(),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    try {
      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
        with: { periodoInscricao: true },
      })

      if (!edital) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Edital não encontrado' })
      }

      if (edital.publicado) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Edital já foi publicado' })
      }

      // Para editais DCC, verifica se foi assinado
      if (edital.tipo === 'DCC' && !edital.chefeAssinatura) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Edital interno DCC precisa ser assinado pelo chefe do departamento antes de ser publicado',
        })
      }

      // Para editais PROGRAD, verifica se tem o arquivo original
      if (edital.tipo === 'PROGRAD' && !edital.fileIdProgradOriginal) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Edital PROGRAD precisa ter o PDF original anexado antes de ser publicado',
        })
      }

      await ctx.db
        .update(editalTable)
        .set({
          publicado: true,
          dataPublicacao: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(editalTable.id, input.id))

      // Send email notification to professors
      try {
        const professors = await ctx.db.query.professorTable.findMany({
          with: {
            user: true,
          },
        })

        const _professorEmails = professors.filter((prof) => prof.user?.email).map((prof) => prof.user?.email)

        // TODO: Fix email notification with correct parameters
        // if (professorEmails.length > 0 && edital.periodoInscricao) {
        //   await sendEditalPublishedNotification(
        //     {
        //       editalNumero: edital.numeroEdital,
        //       editalTitulo: edital.titulo,
        //       semestreFormatado: edital.periodoInscricao.semestre === 'SEMESTRE_1' ? '1' : '2',
        //       ano: edital.periodoInscricao.ano,
        //       linkPDF: '', // TODO: Generate PDF link
        //     },
        //     professorEmails
        //   )
        //   log.info({ editalId: edital.id, emailCount: professorEmails.length }, 'Notificações de publicação enviadas')
        // }
      } catch (emailError) {
        log.error(emailError, 'Erro ao enviar notificações por email, mas edital foi publicado')
      }

      log.info({ editalId: input.id }, 'Edital publicado com sucesso')
      return { success: true }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      log.error(error, 'Erro ao publicar edital')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao publicar edital',
      })
    }
  })

export const signEditalHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/editais/{editalId}/assinar',
      tags: ['editais'],
      summary: 'Sign edital',
      description: 'Add department chief signature to internal edital',
    },
  })
  .input(signEditalSchema)
  .output(z.object({ success: z.boolean(), fileUrl: z.string().optional() }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Verificar se o usuário é admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem assinar editais',
        })
      }

      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.editalId),
        with: {
          periodoInscricao: true,
        },
      })

      if (!edital) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Edital não encontrado',
        })
      }

      if (edital.tipo !== 'DCC') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Apenas editais internos do DCC podem ser assinados',
        })
      }

      if (edital.publicado) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível assinar um edital já publicado',
        })
      }

      // Buscar projetos do período para incluir no PDF
      const projetos = await ctx.db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          professorResponsavelNome: professorTable.nomeCompleto,
          bolsasSolicitadas: projetoTable.bolsasSolicitadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
        })
        .from(projetoTable)
        .leftJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(
          and(
            eq(projetoTable.ano, edital.periodoInscricao?.ano),
            eq(projetoTable.semestre, edital.periodoInscricao?.semestre),
            eq(projetoTable.status, 'APPROVED'),
            isNull(projetoTable.deletedAt)
          )
        )

      // Preparar dados para o template PDF
      const _datasProvas = edital.datasProvasDisponiveis ? JSON.parse(edital.datasProvasDisponiveis) : []

      const pdfData: EditalInternoData = {
        numeroEdital: edital.numeroEdital,
        titulo: edital.titulo,
        ano: edital.periodoInscricao?.ano || new Date().getFullYear(),
        semestre: edital.periodoInscricao?.semestre === 'SEMESTRE_1' ? '1' : '2',
        periodoInscricao: {
          dataInicio: edital.periodoInscricao?.dataInicio?.toLocaleDateString('pt-BR') || '',
          dataFim: edital.periodoInscricao?.dataFim?.toLocaleDateString('pt-BR') || '',
        },
        disciplinas: projetos.map((p) => ({
          codigo: `PROJ${p.id}`, // Usando ID como código temporário
          nome: p.titulo,
          professor: {
            nome: p.professorResponsavelNome || 'N/A',
          },
          tipoMonitoria: 'INDIVIDUAL' as const,
          numBolsistas: p.bolsasSolicitadas || 0,
          numVoluntarios: p.voluntariosSolicitados || 0,
        })),
      }

      // Gerar PDF com assinatura
      const pdfBuffer = await renderToBuffer(EditalInternoTemplate({ data: pdfData }))

      // Salvar PDF no MinIO
      const fileName = `edital-${edital.numeroEdital.replace('/', '-')}-assinado.pdf`
      const objectName = `editais/${fileName}`

      await getMinioClient().putObject(bucketName, objectName, pdfBuffer, pdfBuffer.length, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
      })

      // Atualizar edital com assinatura e referência ao arquivo
      await ctx.db
        .update(editalTable)
        .set({
          chefeAssinatura: input.signatureImage,
          chefeAssinouEm: new Date(),
          chefeDepartamentoId: ctx.user.id,
          fileIdAssinado: objectName,
          updatedAt: new Date(),
        })
        .where(eq(editalTable.id, input.editalId))

      // Gerar URL pré-assinada para download
      const fileUrl = await getMinioClient().presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60) // 7 dias

      log.info({ editalId: input.editalId, fileName }, 'Edital assinado e PDF gerado com sucesso')

      return { success: true, fileUrl }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      log.error(error, 'Erro ao assinar edital')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao assinar edital',
      })
    }
  })

export const unpublishEditalHandler = adminProtectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/editais/{id}/despublicar',
      tags: ['editais'],
      summary: 'Unpublish edital',
      description: 'Unpublish a previously published edital',
    },
  })
  .input(
    z.object({
      id: z.number(),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    try {
      const edital = await ctx.db.query.editalTable.findFirst({
        where: eq(editalTable.id, input.id),
      })

      if (!edital) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      if (!edital.publicado) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Edital não está publicado' })
      }

      await ctx.db
        .update(editalTable)
        .set({
          publicado: false,
          updatedAt: new Date(),
        })
        .where(eq(editalTable.id, input.id))

      log.info({ editalId: input.id }, 'Edital despublicado com sucesso')
      return { success: true }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      log.error(error, 'Erro ao despublicar edital')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao despublicar edital',
      })
    }
  })
