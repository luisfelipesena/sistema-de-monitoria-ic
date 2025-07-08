import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import {
  assinaturaDocumentoTable,
  ataSelecaoTable,
  disciplinaTable,
  inscricaoTable,
  projetoDisciplinaTable,
  projetoTable,
} from '@/server/db/schema'
import { sendStudentSelectionResultNotification } from '@/server/lib/email-service'
import { STATUS_INSCRICAO_ENUM } from '@/types'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { z } from 'zod'

export const selecaoRouter = createTRPCRouter({
  // Gerar dados para ata de seleção
  generateAtaData: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx

      if (!['professor', 'admin'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores e admins podem gerar atas',
        })
      }

      const projetoData = await ctx.db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, parseInt(input.projetoId)),
        with: {
          departamento: true,
          professorResponsavel: {
            with: { user: true },
          },
        },
      })

      if (!projetoData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (user.role === 'professor' && projetoData.professorResponsavelId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode gerar atas para seus próprios projetos',
        })
      }

      const inscricoes = await ctx.db.query.inscricaoTable.findMany({
        where: and(eq(inscricaoTable.projetoId, parseInt(input.projetoId)), isNotNull(inscricaoTable.notaFinal)),
        with: {
          aluno: {
            with: { user: true },
          },
        },
        orderBy: [desc(inscricaoTable.notaFinal)],
      })

      const inscricoesBolsista = inscricoes.filter(
        (i) => i.tipoVagaPretendida === 'BOLSISTA' && Number(i.notaFinal) >= 7.0
      )
      const inscricoesVoluntario = inscricoes.filter(
        (i) => i.tipoVagaPretendida === 'VOLUNTARIO' && Number(i.notaFinal) >= 7.0
      )

      const totalInscritos = await ctx.db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.projetoId, parseInt(input.projetoId)),
      })

      const disciplinas = await ctx.db
        .select()
        .from(disciplinaTable)
        .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .where(eq(projetoDisciplinaTable.projetoId, parseInt(input.projetoId)))

      return {
        projeto: {
          ...projetoData,
          disciplinas: disciplinas.map((d) => d.disciplina),
        },
        totalInscritos: totalInscritos.length,
        totalCompareceram: inscricoes.length,
        inscricoesBolsista,
        inscricoesVoluntario,
        dataGeracao: new Date(),
      }
    }),

  // Criar registro de ata (simplificado)
  createAtaRecord: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      if (!['professor', 'admin'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores e admins podem criar atas',
        })
      }

      const projetoData = await ctx.db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, parseInt(input.projetoId)),
      })

      if (!projetoData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      const ataExistente = await ctx.db.query.ataSelecaoTable.findFirst({
        where: eq(ataSelecaoTable.projetoId, parseInt(input.projetoId)),
      })

      if (ataExistente) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ata já existe para este projeto',
        })
      }

      const [ataRecord] = await ctx.db
        .insert(ataSelecaoTable)
        .values({
          projetoId: parseInt(input.projetoId),
          geradoPorUserId: user.id,
        })
        .returning()

      return {
        success: true,
        ataId: ataRecord.id,
        message: 'Registro de ata criado com sucesso',
      }
    }),

  // Assinar ata de seleção
  signAta: protectedProcedure
    .input(
      z.object({
        ataId: z.number(),
        assinaturaBase64: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      if (user.role !== 'professor') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores podem assinar atas',
        })
      }

      const ata = await ctx.db.query.ataSelecaoTable.findFirst({
        where: eq(ataSelecaoTable.id, input.ataId),
        with: {
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
        },
      })

      if (!ata) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ata não encontrada',
        })
      }

      if (ata.projeto.professorResponsavelId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode assinar atas de seus próprios projetos',
        })
      }

      const assinaturaExistente = await ctx.db.query.assinaturaDocumentoTable.findFirst({
        where: and(
          eq(assinaturaDocumentoTable.projetoId, ata.projetoId),
          eq(assinaturaDocumentoTable.userId, user.id),
          eq(assinaturaDocumentoTable.tipoAssinatura, 'ATA_SELECAO_PROFESSOR')
        ),
      })

      if (assinaturaExistente) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ata já foi assinada',
        })
      }

      await ctx.db.transaction(async (tx) => {
        await tx.insert(assinaturaDocumentoTable).values({
          assinaturaData: input.assinaturaBase64,
          tipoAssinatura: 'ATA_SELECAO_PROFESSOR',
          userId: user.id,
          projetoId: ata.projetoId,
        })

        await tx
          .update(ataSelecaoTable)
          .set({
            assinado: true,
            dataAssinatura: new Date(),
          })
          .where(eq(ataSelecaoTable.id, input.ataId))
      })

      return {
        success: true,
        message: 'Ata assinada com sucesso',
      }
    }),

  // Publicar resultados e notificar alunos automaticamente
  publishResults: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
        notifyStudents: z.boolean().default(true),
        mensagemPersonalizada: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      if (!['professor', 'admin'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores e admins podem publicar resultados',
        })
      }

      const projetoData = await ctx.db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, parseInt(input.projetoId)),
        with: {
          departamento: true,
          professorResponsavel: {
            with: { user: true },
          },
        },
      })

      if (!projetoData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (user.role === 'professor' && projetoData.professorResponsavelId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode publicar resultados para seus próprios projetos',
        })
      }

      const inscricoes = await ctx.db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.projetoId, parseInt(input.projetoId)),
        with: {
          aluno: {
            with: { user: true },
          },
        },
      })

      try {
        await ctx.db.transaction(async (tx) => {
          await Promise.all(
            inscricoes.map((inscricao) => {
              const aprovado = inscricao.notaFinal && Number(inscricao.notaFinal) >= 7.0
              const status = aprovado
                ? inscricao.tipoVagaPretendida === 'BOLSISTA'
                  ? STATUS_INSCRICAO_ENUM[1] // 'SELECTED_BOLSISTA'
                  : STATUS_INSCRICAO_ENUM[2] // 'SELECTED_VOLUNTARIO'
                : STATUS_INSCRICAO_ENUM[5] // 'REJECTED_BY_PROFESSOR'
              return tx.update(inscricaoTable).set({ status }).where(eq(inscricaoTable.id, inscricao.id))
            })
          )
        })
      } catch (error) {
        console.error('Erro ao atualizar status de inscrições:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao atualizar o status das inscrições no banco de dados.',
        })
      }

      if (input.notifyStudents && inscricoes.length > 0) {
        const emailPromises = inscricoes.map(async (inscricaoItem) => {
          const aprovado = inscricaoItem.notaFinal && Number(inscricaoItem.notaFinal) >= 7.0
          const status = aprovado
            ? inscricaoItem.tipoVagaPretendida === 'BOLSISTA'
              ? STATUS_INSCRICAO_ENUM[1] // 'SELECTED_BOLSISTA'
              : STATUS_INSCRICAO_ENUM[2] // 'SELECTED_VOLUNTARIO'
            : STATUS_INSCRICAO_ENUM[5] // 'REJECTED_BY_PROFESSOR'

          return sendStudentSelectionResultNotification(
            {
              studentName: inscricaoItem.aluno.user.username,
              studentEmail: inscricaoItem.aluno.user.email,
              projectTitle: projetoData.titulo,
              professorName: projetoData.professorResponsavel.user.username,
              status,
              feedbackProfessor: input.mensagemPersonalizada,
              projetoId: parseInt(input.projetoId),
              alunoId: inscricaoItem.alunoId,
            },
            user.id
          )
        })

        try {
          await Promise.all(emailPromises)
        } catch (error) {
          console.error('Erro ao enviar notificações:', error)
        }
      }

      return {
        success: true,
        notificationsCount: inscricoes.length,
        message: 'Resultados publicados e notificações enviadas',
      }
    }),

  // Listar atas disponíveis para assinatura
  getAtasForSigning: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx

    if (user.role !== 'professor') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas professores podem visualizar atas para assinatura',
      })
    }

    const atas = await ctx.db.query.ataSelecaoTable.findMany({
      with: {
        projeto: {
          with: {
            professorResponsavel: {
              with: { user: true },
            },
            departamento: true,
          },
        },
      },
    })

    const atasFiltradas = atas.filter((ata) => ata.projeto.professorResponsavelId === user.id)

    return atasFiltradas
  }),
})
