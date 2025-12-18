import { SelectionResult } from '@/server/emails/templates/student'
import { SelectionReminder } from '@/server/emails/templates/professor'
import { renderEmail } from '@/server/emails/render'
import { env } from '@/utils/env'
import { emailSender } from './email-sender'
import { REJECTED_BY_PROFESSOR, SELECTED_BOLSISTA, SELECTED_VOLUNTARIO } from '@/types'

const clientUrl = env.CLIENT_URL || 'http://localhost:3000'

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

export interface LembreteSelecaoData {
  professorEmail: string
  professorNome: string
  projetoTitulo: string
  customMessage?: string
  linkPlataforma: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export const studentEmailService = {
  async sendSelectionResult(
    data: StudentSelectionData,
    remetenteUserId?: number
  ): Promise<void> {
    const html = await renderEmail(
      <SelectionResult
        studentName={data.studentName}
        projectTitle={data.projectTitle}
        professorName={data.professorName}
        status={data.status}
        linkConfirmacao={data.linkConfirmacao}
        feedbackProfessor={data.feedbackProfessor}
      />
    )

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
    const html = await renderEmail(
      <SelectionReminder
        professorNome={data.professorNome}
        projetoTitulo={data.projetoTitulo}
        projetoId={data.projetoId}
        customMessage={data.customMessage}
        linkPlataforma={data.linkPlataforma}
      />
    )

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
