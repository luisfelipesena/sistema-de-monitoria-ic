import { protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  atividadeProjetoTable,
  disciplinaTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import { emailService } from '@/server/lib/email-service'
import { PDFService } from '@/server/lib/pdf-service'
import { idSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'ProjetoRouter.Signature' })

export const signProfessorHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/projetos/{projetoId}/sign-professor',
      tags: ['projetos'],
      summary: 'Sign project as professor',
      description: 'Add professor signature to project',
    },
  })
  .input(
    z.object({
      projetoId: idSchema,
      signatureImage: z.string().min(1, 'Assinatura é obrigatória'),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    const projeto = await ctx.db.query.projetoTable.findFirst({
      where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
      with: {
        departamento: true,
        professorResponsavel: true,
      },
    })

    if (!projeto) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Projeto não encontrado',
      })
    }

    if (ctx.user.role === 'professor') {
      const professor = await ctx.db.query.professorTable.findFirst({
        where: eq(professorTable.userId, ctx.user.id),
      })

      if (!professor || professor.id !== projeto.professorResponsavelId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado a este projeto',
        })
      }
    }

    await ctx.db
      .update(projetoTable)
      .set({
        assinaturaProfessor: input.signatureImage,
        status: 'SUBMITTED',
        updatedAt: new Date(),
      })
      .where(eq(projetoTable.id, input.projetoId))

    try {
      // Prepare PDF data
      const [disciplinas, atividades] = await Promise.all([
        db
          .select({
            id: disciplinaTable.id,
            codigo: disciplinaTable.codigo,
            nome: disciplinaTable.nome,
            turma: disciplinaTable.turma,
          })
          .from(disciplinaTable)
          .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
          .where(eq(projetoDisciplinaTable.projetoId, projeto.id)),

        db.query.atividadeProjetoTable.findMany({
          where: eq(atividadeProjetoTable.projetoId, projeto.id),
        }),
      ])

      // Fetch the edital number for this project's semester
      const edital = await db.query.periodoInscricaoTable.findFirst({
        where: and(eq(periodoInscricaoTable.ano, projeto.ano), eq(periodoInscricaoTable.semestre, projeto.semestre)),
        with: {
          edital: {
            columns: {
              numeroEdital: true,
              publicado: true,
            },
          },
        },
      })

      const numeroEdital = edital?.edital?.numeroEdital

      const pdfData = {
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        departamento: projeto.departamento,
        professorResponsavel: {
          ...projeto.professorResponsavel,
          nomeSocial: projeto.professorResponsavel.nomeSocial || undefined,
          matriculaSiape: projeto.professorResponsavel.matriculaSiape || undefined,
          telefone: projeto.professorResponsavel.telefone || undefined,
          telefoneInstitucional: projeto.professorResponsavel.telefoneInstitucional || undefined,
        },
        ano: projeto.ano,
        semestre: projeto.semestre,
        numeroEdital,
        tipoProposicao: projeto.tipoProposicao,
        bolsasSolicitadas: projeto.bolsasSolicitadas,
        voluntariosSolicitados: projeto.voluntariosSolicitados,
        cargaHorariaSemana: projeto.cargaHorariaSemana,
        numeroSemanas: projeto.numeroSemanas,
        publicoAlvo: projeto.publicoAlvo,
        estimativaPessoasBenificiadas: projeto.estimativaPessoasBenificiadas || undefined,
        disciplinas,
        professoresParticipantes: '', // Campo será preenchido via formulário
        atividades: atividades.map((a) => a.descricao),
        assinaturaProfessor: input.signatureImage,
        dataAssinaturaProfessor: new Date().toLocaleDateString('pt-BR'),
        signingMode: 'professor' as const,
        projetoId: projeto.id,
      }

      // Generate and save the PDF with professor signature
      const objectName = await PDFService.generateAndSaveSignedProjetoPDF(pdfData, input.signatureImage)

      log.info({ projetoId: input.projetoId, objectName }, 'PDF com assinatura do professor salvo no MinIO')

      // Verificar se o PDF foi salvo corretamente
      const savedPdf = await PDFService.getLatestProjetoPDF(projeto.id)
      if (!savedPdf) {
        log.error(
          { projetoId: input.projetoId },
          'PDF não foi encontrado após ser salvo - possível problema de sincronização'
        )
      } else {
        log.info(
          { projetoId: input.projetoId, objectName: savedPdf.objectName },
          'PDF verificado e encontrado após salvamento'
        )
      }
    } catch (error) {
      log.error(
        { projetoId: input.projetoId, error },
        'ERRO CRÍTICO: Falha ao gerar/salvar PDF no MinIO após assinatura do professor'
      )
      // Não falhar silenciosamente - o PDF é importante para visualização
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Falha ao gerar PDF após assinatura. Tente novamente.',
      })
    }

    // Enviar notificação para admins
    try {
      const admins = await ctx.db.query.userTable.findMany({
        where: eq(userTable.role, 'admin'),
      })

      if (admins.length > 0) {
        const adminEmails = admins.map((admin) => admin.email)

        await emailService.sendProfessorAssinouPropostaNotification(
          {
            professorNome: projeto.professorResponsavel.nomeCompleto,
            projetoTitulo: projeto.titulo,
            projetoId: projeto.id,
            novoStatusProjeto: 'SUBMITTED',
            remetenteUserId: ctx.user.id,
          },
          adminEmails
        )
        log.info({ projetoId: input.projetoId, adminCount: adminEmails.length }, 'Notificações enviadas para admins')
      }
    } catch (error) {
      log.error({ error, projetoId: input.projetoId }, 'Erro ao enviar notificações, mas assinatura foi salva')
    }

    log.info({ projetoId: input.projetoId }, 'Assinatura do professor adicionada')
    return { success: true }
  })

export const signDocumentHandler = protectedProcedure
  .input(
    z.object({
      projetoId: idSchema,
      signatureData: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const userRole = ctx.user.role

    if (userRole === 'professor') {
      await ctx.db
        .update(projetoTable)
        .set({
          assinaturaProfessor: input.signatureData,
          status: 'SUBMITTED',
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.projetoId))
    } else {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas professores podem assinar projetos',
      })
    }

    return { success: true }
  })
