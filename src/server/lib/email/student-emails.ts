import { env } from '@/utils/env'
import { emailSender } from './email-sender'
import { getLembreteSelecaoMonitoresHTML, type LembreteSelecaoData } from '@/server/email-templates/reminder-templates'
import { REJECTED_BY_PROFESSOR, SELECTED_BOLSISTA, SELECTED_VOLUNTARIO } from '@/types'

const _clientUrl = env.CLIENT_URL || 'http://localhost:3000'

export interface StudentSelectionData {
  studentName: string
  studentEmail: string
  projectTitle: string
  professorName: string
  status: typeof SELECTED_BOLSISTA | typeof SELECTED_VOLUNTARIO | typeof REJECTED_BY_PROFESSOR
  linkConfirmacao?: string
  feedbackProfessor?: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export const studentEmailService = {
  async sendSelectionResult(data: StudentSelectionData, remetenteUserId?: number): Promise<void> {
    let title = ''
    let message = ''
    let color = '#1976d2'
    let ctaButton = ''

    if (data.status === SELECTED_BOLSISTA || data.status === SELECTED_VOLUNTARIO) {
      const tipoVaga = data.status === SELECTED_BOLSISTA ? 'Bolsista' : 'Voluntário'
      title = `🎉 Parabéns! Você foi selecionado(a) para Monitoria (${tipoVaga})`
      message = `<p>Você foi <strong>SELECIONADO(A)</strong> como <strong>${tipoVaga}</strong> para a monitoria do projeto "<strong>${data.projectTitle}</strong>" com o Prof(a). ${data.professorName}.</p>`
      message += `<p>Por favor, acesse o sistema para confirmar ou recusar sua participação até [PRAZO_CONFIRMACAO].</p>`
      if (data.linkConfirmacao) {
        ctaButton = `<a href="${data.linkConfirmacao}" class="action-button">Confirmar/Recusar Vaga</a>`
      }
      color = '#4caf50'
    } else if (data.status === REJECTED_BY_PROFESSOR) {
      title = 'Resultado da Seleção de Monitoria'
      message = `<p>Agradecemos seu interesse na monitoria do projeto "<strong>${data.projectTitle}</strong>".</p>
                 <p>Neste momento, você não foi selecionado(a) para esta vaga.</p>`
      if (data.feedbackProfessor) {
        message += `<div class="info-box"><p><strong>Feedback:</strong><br>${data.feedbackProfessor}</p></div>`
      }
      message += `<p>Encorajamos você a se candidatar para outras oportunidades.</p>`
      color = '#f44336'
    }

    const content = `
      <h2>${title}</h2>
      <p>Prezado(a) ${data.studentName},</p>
      ${message}
      ${ctaButton}
    `

    const { getBaseLayoutHTML } = await import('@/server/email-templates/base-layout')
    const html = getBaseLayoutHTML(title, content, color)

    await emailSender.send({
      to: data.studentEmail,
      subject: `[Monitoria IC] Resultado da Seleção: ${data.projectTitle}`,
      html,
      tipoNotificacao: 'RESULTADO_SELECAO_ALUNO',
      projetoId: data.projetoId,
      alunoId: data.alunoId,
      remetenteUserId: remetenteUserId ?? data.remetenteUserId,
    })
  },

  async sendMonitorSelectionReminder(data: LembreteSelecaoData): Promise<void> {
    const html = getLembreteSelecaoMonitoresHTML(data)
    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Lembrete: Seleção de Monitores Pendente - ${data.projetoTitulo}`,
      html,
      tipoNotificacao: 'LEMBRETE_SELECAO_MONITORES',
      projetoId: data.projetoId,
      remetenteUserId: data.remetenteUserId,
    })
  },
}
