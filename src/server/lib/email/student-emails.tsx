import { renderEmail } from '@/server/emails/render'
import { SelectionReminder } from '@/server/emails/templates/professor'
import { ScholarshipSelected, SelectionResult, SelectionScheduleUpdated } from '@/server/emails/templates/student'
import { REJECTED_BY_PROFESSOR, SELECTED_BOLSISTA, SELECTED_VOLUNTARIO, type SelecaoSchedule } from '@/types'
import { env } from '@/utils/env'
import { emailSender } from './email-sender'

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
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export interface ScholarshipSelectedData {
  studentName: string
  studentEmail: string
  projectTitle: string
  professorName: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export interface StudentSelectionScheduleData {
  studentName: string
  studentEmail: string
  projectTitle: string
  schedule: SelecaoSchedule
  projetoId: number
  alunoId: number
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
      attachments: data.attachments,
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

  async sendScholarshipSelectedNotification(data: ScholarshipSelectedData): Promise<void> {
    const linkAceite = `${clientUrl}/home/student/resultados`

    const html = await renderEmail(
      <ScholarshipSelected
        studentName={data.studentName}
        projectTitle={data.projectTitle}
        professorName={data.professorName}
        linkAceite={linkAceite}
      />
    )

    await emailSender.send({
      to: data.studentEmail,
      subject: `[Monitoria IC] Bolsa de Monitoria - Aceite ou Rejeite: ${data.projectTitle}`,
      html,
      tipoNotificacao: 'BOLSA_SELECIONADO_ACEITE_PENDENTE',
      projetoId: data.projetoId,
      alunoId: data.alunoId,
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendSelectionScheduleUpdated(data: StudentSelectionScheduleData[]) {
    const emails = await Promise.all(
      data.map(async (item) => ({
        to: item.studentEmail,
        subject: `[Monitoria IC] Dados da prova: ${item.projectTitle}`,
        html: await renderEmail(
          <SelectionScheduleUpdated
            studentName={item.studentName}
            projectTitle={item.projectTitle}
            schedule={item.schedule}
            dashboardUrl={`${clientUrl}/home/student/dashboard`}
          />
        ),
        tipoNotificacao: 'DADOS_PROVA_ATUALIZADOS',
        projetoId: item.projetoId,
        alunoId: item.alunoId,
        remetenteUserId: item.remetenteUserId,
      }))
    )

    return emailSender.sendBatch(emails)
  },
}
