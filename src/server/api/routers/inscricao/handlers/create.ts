import { protectedProcedure } from '@/server/api/trpc'
import {
  alunoTable,
  inscricaoDocumentoTable,
  inscricaoTable,
  periodoInscricaoTable,
  projetoTable,
} from '@/server/db/schema'
import { idSchema, inscriptionFormSchema, tipoVagaSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, gte, isNull, lte } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'InscricaoRouter.Create' })

export const createInscricao = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/inscricao/create',
      tags: ['inscricao'],
      summary: 'Create application',
      description: 'Create new application for monitoring project',
    },
  })
  .input(
    z.object({
      projetoId: idSchema,
      tipo: tipoVagaSchema,
      motivacao: z.string().min(10, 'Motivação deve ter pelo menos 10 caracteres'),
      documentos: z
        .array(
          z.object({
            fileId: z.string(),
            tipoDocumento: z.string(),
          })
        )
        .optional(),
    })
  )
  .output(z.object({ success: z.boolean(), inscricaoId: idSchema }))
  .mutation(async ({ input, ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso permitido apenas para estudantes',
        })
      }

      const aluno = await ctx.db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      })

      if (!aluno) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de estudante não encontrado',
        })
      }

      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
      })

      if (!projeto || projeto.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado ou não aprovado',
        })
      }

      const now = new Date()
      const periodoAtivo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(
          eq(periodoInscricaoTable.ano, projeto.ano),
          eq(periodoInscricaoTable.semestre, projeto.semestre),
          lte(periodoInscricaoTable.dataInicio, now),
          gte(periodoInscricaoTable.dataFim, now)
        ),
      })

      if (!periodoAtivo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Período de inscrições não está ativo',
        })
      }

      const existingInscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: and(
          eq(inscricaoTable.alunoId, aluno.id),
          eq(inscricaoTable.projetoId, input.projetoId),
          eq(inscricaoTable.periodoInscricaoId, periodoAtivo.id)
        ),
      })

      if (existingInscricao) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Você já se inscreveu neste projeto',
        })
      }

      if (!input.tipo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tipo de vaga é obrigatório',
        })
      }

      if (input.tipo === 'BOLSISTA' && (!projeto.bolsasDisponibilizadas || projeto.bolsasDisponibilizadas <= 0)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não há vagas de bolsista disponíveis para este projeto',
        })
      }

      if (input.tipo === 'VOLUNTARIO' && (!projeto.voluntariosSolicitados || projeto.voluntariosSolicitados <= 0)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não há vagas de voluntário disponíveis para este projeto',
        })
      }

      const [novaInscricao] = await ctx.db
        .insert(inscricaoTable)
        .values({
          periodoInscricaoId: periodoAtivo.id,
          projetoId: input.projetoId,
          alunoId: aluno.id,
          tipoVagaPretendida: input.tipo,
          status: 'SUBMITTED',
          coeficienteRendimento: aluno.cr?.toString() || null,
        })
        .returning()

      if (input.documentos && input.documentos.length > 0) {
        const documentosToInsert = input.documentos.map((doc) => ({
          inscricaoId: novaInscricao.id,
          fileId: doc.fileId,
          tipoDocumento: doc.tipoDocumento,
        }))
        await ctx.db.insert(inscricaoDocumentoTable).values(documentosToInsert)
      }

      log.info({ inscricaoId: novaInscricao.id }, 'Nova inscrição criada')

      return {
        success: true,
        inscricaoId: novaInscricao.id,
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Error creating inscription')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao criar inscrição',
      })
    }
  })

export const criarInscricao = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/inscricoes',
      tags: ['inscricoes'],
      summary: 'Create application',
      description: 'Create a new project application',
    },
  })
  .input(inscriptionFormSchema)
  .output(z.object({ id: idSchema, message: z.string() }))
  .mutation(async ({ input, ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas estudantes podem criar inscrições',
        })
      }

      const aluno = await ctx.db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      })

      if (!aluno) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de aluno não encontrado',
        })
      }

      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (projeto.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Projeto não está disponível para inscrições',
        })
      }

      const periodoAtivo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(
          eq(periodoInscricaoTable.ano, projeto.ano),
          eq(periodoInscricaoTable.semestre, projeto.semestre),
          lte(periodoInscricaoTable.dataInicio, new Date()),
          gte(periodoInscricaoTable.dataFim, new Date())
        ),
      })

      if (!periodoAtivo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Período de inscrições não está ativo para este projeto',
        })
      }

      const inscricaoExistente = await ctx.db.query.inscricaoTable.findFirst({
        where: and(eq(inscricaoTable.alunoId, aluno.id), eq(inscricaoTable.projetoId, input.projetoId)),
      })

      if (inscricaoExistente) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Você já possui uma inscrição para este projeto',
        })
      }

      if (!input.tipoVagaPretendida) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tipo de vaga é obrigatório',
        })
      }

      const [novaInscricao] = await ctx.db
        .insert(inscricaoTable)
        .values({
          alunoId: aluno.id,
          projetoId: input.projetoId,
          periodoInscricaoId: periodoAtivo.id,
          tipoVagaPretendida: input.tipoVagaPretendida,
          coeficienteRendimento: aluno.cr?.toString() || null,
          status: 'SUBMITTED',
        })
        .returning()

      if (input.documentos && input.documentos.length > 0) {
        const documentosToInsert = input.documentos.map((doc) => ({
          inscricaoId: novaInscricao.id,
          fileId: doc.fileId,
          tipoDocumento: doc.tipoDocumento,
        }))
        await ctx.db.insert(inscricaoDocumentoTable).values(documentosToInsert)
      }

      log.info(
        { inscricaoId: novaInscricao.id, projetoId: input.projetoId, alunoId: aluno.id },
        'Inscrição criada com sucesso'
      )

      return {
        id: novaInscricao.id,
        message: 'Inscrição realizada com sucesso!',
      }
    } catch (error) {
      log.error(error, 'Erro ao criar inscrição')
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao criar inscrição',
      })
    }
  })