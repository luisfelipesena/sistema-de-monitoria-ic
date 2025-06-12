import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { 
  notificacaoHistoricoTable, 
  userTable, 
  projetoTable, 
  inscricaoTable, 
  vagaTable,
  professorTable,
  alunoTable,
  assinaturaDocumentoTable
} from '@/server/db/schema'
import { z } from 'zod'
import { eq, and, desc, isNull, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { emailService } from '@/server/lib/email-service'

export const notificacoesRouter = createTRPCRouter({
  // Enviar lembretes automáticos
  sendReminders: protectedProcedure
    .input(
      z.object({
        tipo: z.enum([
          'assinatura_projeto_pendente',
          'assinatura_termo_pendente', 
          'aceite_vaga_pendente',
          'documentos_incompletos'
        ]),
        filtros: z.object({
          dias: z.number().min(1).max(30).default(7), // Lembretes para itens pendentes há X dias
          departamentoId: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      // Apenas admins podem enviar lembretes em massa
      if (user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem enviar lembretes automáticos',
        })
      }

      const diasLimite = input.filtros?.dias || 7
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - diasLimite)

      let notificacoesEnviadas = 0

      try {
        switch (input.tipo) {
          case 'assinatura_projeto_pendente':
            // Buscar projetos submetidos há mais de X dias sem assinatura admin
            const projetosPendentes = await ctx.db.query.projetoTable.findMany({
              where: and(
                eq(projetoTable.status, 'SUBMITTED'),
                sql`${projetoTable.updatedAt} <= ${dataLimite}`
              ),
              with: {
                departamento: true,
                professorResponsavel: {
                  with: { user: true }
                }
              }
            })

            for (const proj of projetosPendentes) {
              // Buscar todos os admins
              const admins = await ctx.db.query.userTable.findMany({
                where: eq(userTable.role, 'admin')
              })

              for (const admin of admins) {
                await emailService.sendGenericEmail({
                  to: admin.email,
                  subject: `Lembrete: Projeto pendente de assinatura - ${proj.titulo}`,
                  html: `
Olá ${admin.username},<br><br>

O projeto de monitoria "${proj.titulo}" (${proj.departamento.nome}) está pendente de sua assinatura há ${diasLimite} dias.<br><br>

Professor: ${proj.professorResponsavel.nomeCompleto}<br>
Data de submissão: ${proj.updatedAt?.toLocaleDateString('pt-BR')}<br><br>

Por favor, acesse o sistema para revisar e assinar o projeto.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
                  `,
                  tipoNotificacao: 'ASSINATURA_PROJETO_PENDENTE',
                  remetenteUserId: user.id,
                  projetoId: proj.id,
                })

                notificacoesEnviadas++
              }
            }
            break

          case 'assinatura_termo_pendente':
            // Para assinatura de termo, simplificar sem buscar assinaturas por enquanto
            const vagasComTermoPendente = await ctx.db.query.vagaTable.findMany({
              where: sql`${vagaTable.updatedAt} <= ${dataLimite}`,
              with: {
                aluno: {
                  with: { user: true }
                },
                projeto: {
                  with: {
                    professorResponsavel: {
                      with: { user: true }
                    }
                  }
                }
              }
            })

            for (const vagaItem of vagasComTermoPendente) {
              // Enviar lembrete para aluno
              await emailService.sendGenericEmail({
                to: vagaItem.aluno.user.email,
                subject: `Lembrete: Assine seu termo de compromisso`,
                html: `
Olá ${vagaItem.aluno.user.username},<br><br>

Seu termo de compromisso para monitoria está pendente de assinatura há ${diasLimite} dias.<br><br>

Por favor, acesse o sistema para assinar digitalmente seu termo.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
                `,
                tipoNotificacao: 'ASSINATURA_TERMO_PENDENTE',
                remetenteUserId: user.id,
                projetoId: vagaItem.projetoId,
                alunoId: vagaItem.alunoId,
              })
              notificacoesEnviadas++

              // Enviar lembrete para professor
              await emailService.sendGenericEmail({
                to: vagaItem.projeto.professorResponsavel.user.email,
                subject: `Lembrete: Assine termo de compromisso - ${vagaItem.aluno.user.username}`,
                html: `
Olá ${vagaItem.projeto.professorResponsavel.user.username},<br><br>

O termo de compromisso do monitor ${vagaItem.aluno.user.username} está pendente de sua assinatura há ${diasLimite} dias.<br><br>

Por favor, acesse o sistema para assinar digitalmente o termo.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
                `,
                tipoNotificacao: 'ASSINATURA_TERMO_PENDENTE',
                remetenteUserId: user.id,
                projetoId: vagaItem.projetoId,
                alunoId: vagaItem.alunoId,
              })
              notificacoesEnviadas++
            }
            break

          case 'aceite_vaga_pendente':
            // Buscar inscrições aprovadas não aceitas há mais de X dias
            const inscricoesPendentes = await ctx.db.query.inscricaoTable.findMany({
              where: and(
                eq(inscricaoTable.status, 'SUBMITTED'),
                sql`${inscricaoTable.notaFinal} >= 7.0`,
                sql`${inscricaoTable.updatedAt} <= ${dataLimite}`
              ),
              with: {
                aluno: {
                  with: { user: true }
                },
                projeto: true
              }
            })

            for (const inscr of inscricoesPendentes) {
              await emailService.sendGenericEmail({
                to: inscr.aluno.user.email,
                subject: `Lembrete: Confirme seu aceite para monitoria - ${inscr.projeto.titulo}`,
                html: `
Olá ${inscr.aluno.user.username},<br><br>

Você foi aprovado(a) na seleção para monitoria do projeto "${inscr.projeto.titulo}", mas ainda não confirmou seu aceite.<br><br>

Nota final: ${inscr.notaFinal}<br>
Tipo: ${inscr.tipoVagaPretendida}<br><br>

Por favor, acesse o sistema para aceitar ou recusar a vaga.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
                `,
                tipoNotificacao: 'ACEITE_VAGA_PENDENTE',
                remetenteUserId: user.id,
                projetoId: inscr.projetoId,
                alunoId: inscr.alunoId,
              })
              notificacoesEnviadas++
            }
            break

          default:
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Tipo de lembrete não implementado',
            })
        }

        // Registrar envio no histórico
        await ctx.db.insert(notificacaoHistoricoTable).values({
          destinatarioEmail: 'sistema@ufba.br',
          assunto: `Lembretes: ${input.tipo}`,
          tipoNotificacao: 'lembrete_automatico',
          statusEnvio: 'ENVIADO',
          remetenteUserId: user.id,
        })

        return {
          success: true,
          notificacoesEnviadas,
          tipo: input.tipo,
        }

      } catch (error) {
        console.error('Erro ao enviar lembretes:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno ao enviar lembretes',
        })
      }
    }),

  // Buscar histórico de notificações
  getHistory: protectedProcedure
    .input(
      z.object({
        limite: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        userId: z.string().optional(), // Para filtrar por usuário específico
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx

      // Buscar histórico de notificações
      const notificacoes = await ctx.db.query.notificacaoHistoricoTable.findMany({
        where: user.role !== 'admin' && input.userId 
          ? eq(notificacaoHistoricoTable.remetenteUserId, parseInt(input.userId))
          : undefined,
        with: {
          remetente: {
            columns: { id: true, username: true, email: true }
          },
          projeto: true,
          aluno: true
        },
        orderBy: [desc(notificacaoHistoricoTable.dataEnvio)],
        limit: input.limite,
        offset: input.offset,
      })

      return notificacoes.map((notif: any) => ({
        id: notif.id,
        tipo: notif.tipoNotificacao,
        titulo: notif.assunto,
        conteudo: notif.statusEnvio === 'ENVIADO' ? 'Enviado com sucesso' : notif.mensagemErro || 'Falha no envio',
        lida: true, // Histórico sempre considerado como lido
        createdAt: notif.dataEnvio,
        readAt: notif.dataEnvio,
        remetente: notif.remetente,
        destinatario: { email: notif.destinatarioEmail },
        metadata: {
          statusEnvio: notif.statusEnvio,
          projetoId: notif.projetoId,
          alunoId: notif.alunoId
        },
      }))
    }),

  // Marcar notificação como lida (mantendo compatibilidade)
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificacaoId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Como usamos histórico, sempre retorna sucesso
      return { success: true }
    }),

  // Marcar todas as notificações como lidas (mantendo compatibilidade)
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      return { 
        success: true,
        message: 'Todas as notificações foram marcadas como lidas'
      }
    }),

  // Buscar notificações não lidas (retorna vazio pois usamos histórico)
  getUnread: protectedProcedure
    .query(async ({ ctx }) => {
      return []
    }),

  // Criar notificação personalizada (para admins)
  create: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(['info', 'aviso', 'urgente', 'lembrete_automatico']),
        titulo: z.string().min(1).max(200),
        conteudo: z.string().min(1).max(1000),
        destinatarioIds: z.array(z.string()).min(1), // Lista de usuários que receberão
        enviarEmail: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      // Apenas admins podem criar notificações
      if (user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem criar notificações',
        })
      }

      // Verificar se destinatários existem
      const destinatarios = await ctx.db.query.userTable.findMany({
        where: sql`${userTable.id} IN (${input.destinatarioIds.map(id => parseInt(id)).join(',')})`
      })

      if (destinatarios.length !== input.destinatarioIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Alguns destinatários não foram encontrados',
        })
      }

      try {
        let emailsEnviados = 0

        // Enviar emails se solicitado
        if (input.enviarEmail) {
          const emailPromises = destinatarios.map(async (destinatario: any) => {
            await emailService.sendGenericEmail({
              to: destinatario.email,
              subject: `[Sistema de Monitoria] ${input.titulo}`,
              html: `
Olá ${destinatario.username},<br><br>

${input.conteudo}<br><br>

Esta é uma notificação do Sistema de Monitoria IC.<br><br>

Atenciosamente,<br>
${user.username}
              `,
              tipoNotificacao: 'NOTIFICACAO_PERSONALIZADA',
              remetenteUserId: user.id,
            })

            // Registrar no histórico
            await ctx.db.insert(notificacaoHistoricoTable).values({
              destinatarioEmail: destinatario.email,
              assunto: input.titulo,
              tipoNotificacao: input.tipo,
              statusEnvio: 'ENVIADO',
              remetenteUserId: user.id,
            })
          })

          await Promise.all(emailPromises)
          emailsEnviados = destinatarios.length
        }

        return {
          success: true,
          notificacoesCriadas: destinatarios.length,
          emailsEnviados,
        }

      } catch (error) {
        console.error('Erro ao criar notificações:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno ao criar notificações',
        })
      }
    }),

  // Estatísticas de notificações (para dashboard admin)
  getStats: protectedProcedure
    .input(
      z.object({
        periodo: z.enum(['7d', '30d', '90d']).default('30d'),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx

      if (user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem ver estatísticas',
        })
      }

      const dias = input.periodo === '7d' ? 7 : input.periodo === '30d' ? 30 : 90
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - dias)

      const [stats] = await ctx.db
        .select({
          total: sql<number>`COUNT(*)`,
          enviadas: sql<number>`COUNT(CASE WHEN ${notificacaoHistoricoTable.statusEnvio} = 'ENVIADO' THEN 1 END)`,
          falharam: sql<number>`COUNT(CASE WHEN ${notificacaoHistoricoTable.statusEnvio} = 'FALHOU' THEN 1 END)`,
          lembretes: sql<number>`COUNT(CASE WHEN ${notificacaoHistoricoTable.tipoNotificacao} = 'lembrete_automatico' THEN 1 END)`,
          urgentes: sql<number>`COUNT(CASE WHEN ${notificacaoHistoricoTable.tipoNotificacao} = 'urgente' THEN 1 END)`,
        })
        .from(notificacaoHistoricoTable)
        .where(sql`${notificacaoHistoricoTable.dataEnvio} >= ${dataInicio}`)

      return {
        periodo: input.periodo,
        total: Number(stats?.total) || 0,
        enviadas: Number(stats?.enviadas) || 0,
        falharam: Number(stats?.falharam) || 0,
        lembretes: Number(stats?.lembretes) || 0,
        urgentes: Number(stats?.urgentes) || 0,
        taxaEntrega: stats?.total 
          ? Math.round((Number(stats.enviadas) / Number(stats.total)) * 100)
          : 0,
      }
    }),
})