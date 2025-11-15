import type { db } from '@/server/db'
import { emailService } from '@/server/lib/email'
import { createNotificacoesRepository } from './notificacoes-repository'

type Database = typeof db

export function createReminderService(db: Database) {
  const repo = createNotificacoesRepository(db)

  return {
    async sendProjectSignatureReminders(diasLimite: number, userId: number) {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - diasLimite)

      const projetosPendentes = await repo.findPendingProjectsByDate(dataLimite)
      let count = 0

      for (const proj of projetosPendentes) {
        const admins = await repo.findAllAdmins()

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
            remetenteUserId: userId,
            projetoId: proj.id,
          })

          count++
        }
      }

      return count
    },

    async sendTermSignatureReminders(diasLimite: number, userId: number) {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - diasLimite)

      const vagasComTermoPendente = await repo.findPendingTermsByDate(dataLimite)
      let count = 0

      for (const vagaItem of vagasComTermoPendente) {
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
          remetenteUserId: userId,
          projetoId: vagaItem.projetoId,
          alunoId: vagaItem.alunoId,
        })
        count++

        await emailService.sendGenericEmail({
          to: vagaItem.projeto.professorResponsavel.user.email,
          subject: `Lembrete: Assine termo de compromisso - ${vagaItem.aluno.user.username}`,
          html: `
Olá ${vagaItem.projeto.professorResponsavel.nomeCompleto},<br><br>

O termo de compromisso do monitor ${vagaItem.aluno.user.username} está pendente de sua assinatura há ${diasLimite} dias.<br><br>

Por favor, acesse o sistema para assinar digitalmente o termo.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'ASSINATURA_TERMO_PENDENTE',
          remetenteUserId: userId,
          projetoId: vagaItem.projetoId,
          alunoId: vagaItem.alunoId,
        })
        count++
      }

      return count
    },

    async sendAcceptanceReminders(diasLimite: number, userId: number) {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - diasLimite)

      const inscricoesPendentes = await repo.findPendingInscriptionsByDate(dataLimite)
      let count = 0

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
          remetenteUserId: userId,
          projetoId: inscr.projetoId,
          alunoId: inscr.alunoId,
        })
        count++
      }

      return count
    },
  }
}

export type ReminderService = ReturnType<typeof createReminderService>
