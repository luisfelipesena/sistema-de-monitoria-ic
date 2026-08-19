import type { db } from '@/server/db'
import { emailService } from '@/server/lib/email'
import { SEMESTRE_LABELS } from '@/types'
import { createDeadlineReminderRepository } from './deadline-reminder-repository'
import { createNotificacoesRepository } from './notificacoes-repository'

type Database = typeof db

export function createReminderService(db: Database) {
  const repo = createNotificacoesRepository(db)
  const deadlineRepo = createDeadlineReminderRepository(db)

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

O projeto de monitoria "${proj.titulo}" (${proj.departamento?.nome || 'Departamento não informado'}) está pendente de sua assinatura há ${diasLimite} dias.<br><br>

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

    /**
     * Send reminders about inscription periods ending soon.
     * Notifies all students about active periods ending in X days.
     */
    async sendInscriptionDeadlineReminders(diasAntes: number, userId: number) {
      const periodosProximoFim = await deadlineRepo.findPeriodosEndingSoon(diasAntes)
      let count = 0

      for (const periodo of periodosProximoFim) {
        // Get all students who haven't applied to any project in this period
        const alunosSemInscricao = await deadlineRepo.findStudentsWithoutInscription(periodo.id)

        const dataFimFormatada = new Date(periodo.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        const semestreLabel = SEMESTRE_LABELS[periodo.semestre as keyof typeof SEMESTRE_LABELS]

        for (const aluno of alunosSemInscricao) {
          await emailService.sendGenericEmail({
            to: aluno.user.email,
            subject: `⚠️ Faltam ${diasAntes} dias para o fim das inscrições de monitoria!`,
            html: `
Olá ${aluno.nomeCompleto},<br><br>

O período de inscrições para monitoria <strong>${periodo.ano}.${semestreLabel}</strong> termina em <strong>${dataFimFormatada}</strong>.<br><br>

<strong>Faltam apenas ${diasAntes} dias!</strong><br><br>

Não perca a oportunidade de se candidatar a uma vaga de monitoria. Acesse o sistema e confira os projetos disponíveis.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
            `,
            tipoNotificacao: 'PERIODO_INSCRICAO_PROXIMO_FIM',
            remetenteUserId: userId,
            alunoId: aluno.id,
          })
          count++
        }
      }

      return count
    },

    /**
     * Send reminders about pending final reports.
     * Notifies professors who have projects without submitted final reports.
     */
    async sendFinalReportReminders(diasLimite: number, userId: number) {
      const projetosSemRelatorio = await deadlineRepo.findProjectsWithoutFinalReport(diasLimite)
      let count = 0

      for (const projeto of projetosSemRelatorio) {
        await emailService.sendGenericEmail({
          to: projeto.professorResponsavel.user.email,
          subject: `Lembrete: Relatório final pendente - ${projeto.titulo}`,
          html: `
Olá ${projeto.professorResponsavel.nomeCompleto},<br><br>

O relatório final do projeto de monitoria "<strong>${projeto.titulo}</strong>" está pendente há ${diasLimite} dias.<br><br>

Período: ${projeto.ano}.${SEMESTRE_LABELS[projeto.semestre as keyof typeof SEMESTRE_LABELS]}<br>
Departamento: ${projeto.departamento?.nome || 'N/A'}<br><br>

Por favor, acesse o sistema para preencher e submeter o relatório final.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'RELATORIO_FINAL_PENDENTE',
          remetenteUserId: userId,
          projetoId: projeto.id,
        })
        count++
      }

      return count
    },

    /**
     * Send reminders about pending monitor reports.
     * Notifies students (monitors) who haven't submitted their individual reports.
     */
    async sendMonitorReportReminders(diasLimite: number, userId: number) {
      const relatoriosPendentes = await deadlineRepo.findPendingMonitorReports(diasLimite)
      let count = 0

      for (const item of relatoriosPendentes) {
        await emailService.sendGenericEmail({
          to: item.aluno.user.email,
          subject: `Lembrete: Seu relatório de monitoria está pendente`,
          html: `
Olá ${item.aluno.nomeCompleto},<br><br>

O seu relatório individual de monitoria está pendente há ${diasLimite} dias.<br><br>

Projeto: ${item.projeto.titulo}<br>
Professor: ${item.projeto.professorResponsavel.nomeCompleto}<br><br>

Por favor, acesse o sistema para preencher e submeter seu relatório.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'RELATORIO_MONITOR_PENDENTE',
          remetenteUserId: userId,
          projetoId: item.projeto.id,
          alunoId: item.aluno.id,
        })
        count++
      }

      return count
    },

    /**
     * Notify students that their certificates are available.
     * Sent after the semester ends for completed monitorias.
     */
    async sendCertificateAvailableNotifications(ano: number, semestre: string, userId: number) {
      const vagasFinalizadas = await deadlineRepo.findCompletedVagasForPeriod(ano, semestre)
      let count = 0

      for (const vaga of vagasFinalizadas) {
        await emailService.sendGenericEmail({
          to: vaga.aluno.user.email,
          subject: `🎓 Seu certificado de monitoria está disponível!`,
          html: `
Olá ${vaga.aluno.nomeCompleto},<br><br>

Parabéns pela conclusão da sua monitoria!<br><br>

Seu certificado de participação no projeto "<strong>${vaga.projeto.titulo}</strong>" já está disponível para download no sistema.<br><br>

Período: ${ano}.${SEMESTRE_LABELS[semestre as keyof typeof SEMESTRE_LABELS]}<br>
Tipo: ${vaga.tipo === 'BOLSISTA' ? 'Bolsista' : 'Voluntário'}<br><br>

Acesse o sistema para baixar seu certificado.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'CERTIFICADO_DISPONIVEL',
          remetenteUserId: userId,
          projetoId: vaga.projetoId,
          alunoId: vaga.alunoId,
        })
        count++
      }

      return count
    },
  }
}

export type ReminderService = ReturnType<typeof createReminderService>
