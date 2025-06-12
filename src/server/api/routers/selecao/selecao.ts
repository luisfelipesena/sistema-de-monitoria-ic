import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { 
  inscricaoTable, 
  projetoTable, 
  disciplinaTable, 
  professorTable, 
  alunoTable, 
  ataSelecaoTable,
  userTable 
} from '@/server/db/schema'
import { z } from 'zod'
import { eq, and, desc, isNotNull } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { emailService } from '@/server/lib/email-service'

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
      
      // Verificar se é professor ou admin
      if (!['professor', 'admin'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores e admins podem gerar atas',
        })
      }

      // Buscar projeto com dados relacionados
      const projetoData = await ctx.db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, parseInt(input.projetoId)),
        with: {
          departamento: true,
          professorResponsavel: {
            with: {
              user: true,
            }
          },
        }
      })

      if (!projetoData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      // Verificar se o professor é dono do projeto (se não for admin)
      if (user.role === 'professor' && projetoData.professorResponsavelId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode gerar atas para seus próprios projetos',
        })
      }

      // Buscar inscrições com notas para o projeto
      const inscricoes = await ctx.db.query.inscricaoTable.findMany({
        where: and(
          eq(inscricaoTable.projetoId, parseInt(input.projetoId)),
          isNotNull(inscricaoTable.notaFinal)
        ),
        with: {
          aluno: {
            with: {
              user: true,
            }
          }
        },
        orderBy: [desc(inscricaoTable.notaFinal)]
      })

      // Separar por tipo de vaga e filtrar aprovados (nota >= 7.0)
      const inscricoesBolsista = inscricoes.filter(
        i => i.tipoVagaPretendida === 'BOLSISTA' && Number(i.notaFinal) >= 7.0
      )
      const inscricoesVoluntario = inscricoes.filter(
        i => i.tipoVagaPretendida === 'VOLUNTARIO' && Number(i.notaFinal) >= 7.0
      )

      // Total de inscritos e compareceram
      const totalInscritos = await ctx.db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.projetoId, parseInt(input.projetoId)),
      })

      return {
        projeto: projetoData,
        totalInscritos: totalInscritos.length,
        totalCompareceram: inscricoes.length,
        inscricoesBolsista,
        inscricoesVoluntario,
        dataGeracao: new Date(),
      }
    }),

  // Publicar resultados e notificar alunos
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
      
      // Verificar permissões
      if (!['professor', 'admin'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores e admins podem publicar resultados',
        })
      }

      // Buscar projeto
      const projetoData = await ctx.db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, parseInt(input.projetoId)),
        with: {
          departamento: true,
          professorResponsavel: {
            with: { user: true }
          }
        }
      })

      if (!projetoData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      // Verificar se o professor é dono do projeto (se não for admin)
      if (user.role === 'professor' && projetoData.professorResponsavelId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode publicar resultados para seus próprios projetos',
        })
      }

      // Buscar todas as inscrições do projeto
      const inscricoes = await ctx.db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.projetoId, parseInt(input.projetoId)),
        with: {
          aluno: {
            with: { user: true }
          }
        }
      })

      // Enviar notificações por email se solicitado
      if (input.notifyStudents && inscricoes.length > 0) {
        const emailPromises = inscricoes.map(async (inscricaoItem) => {
          const aprovado = inscricaoItem.notaFinal && Number(inscricaoItem.notaFinal) >= 7.0
          const situacao = aprovado ? 'APROVADO' : 'REPROVADO'
          
          return emailService.sendGenericEmail({
            to: inscricaoItem.aluno.user.email,
            subject: `Resultado da Seleção - ${projetoData.titulo}`,
            html: `
Olá ${inscricaoItem.aluno.user.username},<br><br>

O resultado da seleção para monitoria do projeto ${projetoData.titulo} foi divulgado.<br><br>

Situação: ${situacao}<br>
${aprovado ? `Nota Final: ${inscricaoItem.notaFinal}<br>` : ''}

${aprovado ? 
  'Parabéns! Você foi aprovado(a) na seleção. Aguarde as próximas instruções sobre o aceite da vaga.' :
  'Infelizmente você não foi aprovado(a) desta vez. Continue se dedicando!'
}<br><br>

${input.mensagemPersonalizada ? `<strong>Mensagem do Professor:</strong><br>${input.mensagemPersonalizada}<br><br>` : ''}

Atenciosamente,<br>
Sistema de Monitoria IC
            `,
            tipoNotificacao: 'RESULTADO_SELECAO',
            remetenteUserId: user.id,
            projetoId: parseInt(input.projetoId),
            alunoId: inscricaoItem.alunoId,
          })
        })

        try {
          await Promise.all(emailPromises)
        } catch (error) {
          console.error('Erro ao enviar notificações:', error)
        }
      }

      // Atualizar status do projeto para "resultados publicados" se necessário
      await ctx.db.update(projetoTable)
        .set({ 
          updatedAt: new Date(),
          // Podemos adicionar um campo específico para controle de publicação
        })
        .where(eq(projetoTable.id, parseInt(input.projetoId)))

      return {
        success: true,
        emailsEnviados: input.notifyStudents ? inscricoes.length : 0,
      }
    }),

  // Buscar dados para publicação de resultados
  getResultsData: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx
      
      // Verificar permissões
      if (!['professor', 'admin'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores e admins podem acessar resultados',
        })
      }

      // Buscar projeto
      const projetoData = await ctx.db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, parseInt(input.projetoId)),
        with: {
          departamento: true,
          professorResponsavel: {
            with: { user: true }
          }
        }
      })

      if (!projetoData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      // Verificar se o professor é dono do projeto (se não for admin)
      if (user.role === 'professor' && projetoData.professorResponsavelId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode acessar resultados de seus próprios projetos',
        })
      }

      // Buscar inscrições aprovadas (nota >= 7.0)
      const aprovados = await ctx.db.query.inscricaoTable.findMany({
        where: and(
          eq(inscricaoTable.projetoId, parseInt(input.projetoId)),
          isNotNull(inscricaoTable.notaFinal)
        ),
        with: {
          aluno: {
            with: { user: true }
          }
        },
        orderBy: [desc(inscricaoTable.notaFinal)]
      })

      // Filtrar e separar por tipo
      const aprovadasFiltradas = aprovados.filter(i => Number(i.notaFinal) >= 7.0)
      const selecionadosBolsista = aprovadasFiltradas.filter(i => i.tipoVagaPretendida === 'BOLSISTA')
      const selecionadosVoluntario = aprovadasFiltradas.filter(i => i.tipoVagaPretendida === 'VOLUNTARIO')
      const rejeitados = aprovados.filter(i => Number(i.notaFinal) < 7.0)

      return {
        projeto: projetoData,
        selecionadosBolsista,
        selecionadosVoluntario,
        rejeitados,
        listaEspera: [], // Implementar lógica de lista de espera se necessário
        totalCandidatos: aprovados.length,
        totalAprovados: aprovadasFiltradas.length,
        dataGeracao: new Date(),
      }
    }),

  // Buscar candidatos para avaliação por projeto (usado na grade-applications)
  getApplicationsForGrading: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx
      
      // Verificar se é professor ou admin
      if (!['professor', 'admin'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores e admins podem avaliar candidatos',
        })
      }

      // Buscar projeto
      const projetoData = await ctx.db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, parseInt(input.projetoId)),
        with: {
          departamento: true,
        }
      })

      if (!projetoData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      // Verificar se o professor é dono do projeto (se não for admin)
      if (user.role === 'professor' && projetoData.professorResponsavelId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode avaliar candidatos de seus próprios projetos',
        })
      }

      // Buscar todas as inscrições do projeto
      const inscricoes = await ctx.db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.projetoId, parseInt(input.projetoId)),
        with: {
          aluno: {
            with: { user: true }
          }
        },
        orderBy: [desc(inscricaoTable.createdAt)]
      })

      return {
        projeto: projetoData,
        inscricoes,
      }
    }),
})