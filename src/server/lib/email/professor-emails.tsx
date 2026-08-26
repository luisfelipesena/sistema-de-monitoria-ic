import { renderEmail } from '@/server/emails/render'
import { Invitation, ScholarshipRejected, StudentConfirmedInterest, StudentRejectedInterest } from '@/server/emails/templates/professor'
import { emailSender } from './email-sender'

export interface ScholarshipRejectedData {
  professorEmail: string
  professorName: string
  studentName: string
  studentMatricula: string
  projectTitle: string
  motivo?: string
  linkSelecao: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export const professorEmailService = {
  async sendInvitation(data: {
    professorEmail: string
    invitationLink: string
    adminName?: string
    remetenteUserId?: number
  }): Promise<void> {
    const clientName = 'Sistema de Monitoria IC'
    const subject = `[${clientName}] Convite para se juntar à plataforma como Professor`

    const html = await renderEmail(
      <Invitation
        professorEmail={data.professorEmail}
        invitationLink={data.invitationLink}
        adminName={data.adminName}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject,
      html,
      tipoNotificacao: 'CONVITE_PROFESSOR',
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendScholarshipRejectedNotification(data: ScholarshipRejectedData): Promise<void> {
    const html = await renderEmail(
      <ScholarshipRejected
        professorName={data.professorName}
        studentName={data.studentName}
        studentMatricula={data.studentMatricula}
        projectTitle={data.projectTitle}
        motivo={data.motivo}
        linkSelecao={data.linkSelecao}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Bolsa rejeitada por ${data.studentName} - ${data.projectTitle}`,
      html,
      tipoNotificacao: 'VAGA_RECUSADA',
      projetoId: data.projetoId,
      alunoId: data.alunoId,
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendStudentConfirmedInterestNotification(data: {
    professorEmail: string
    professorName: string
    studentName: string
    studentMatricula: string
    projectTitle: string
    notaFinal: string
    linkSelecao: string
    projetoId?: number
    alunoId?: number
    remetenteUserId?: number
  }): Promise<void> {
    const html = await renderEmail(
      <StudentConfirmedInterest
        professorName={data.professorName}
        studentName={data.studentName}
        studentMatricula={data.studentMatricula}
        projectTitle={data.projectTitle}
        notaFinal={data.notaFinal}
        linkSelecao={data.linkSelecao}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] ${data.studentName} confirmou interesse - ${data.projectTitle}`,
      html,
      tipoNotificacao: 'ALUNO_CONFIRMOU_INTERESSE',
      projetoId: data.projetoId,
      alunoId: data.alunoId,
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendStudentRejectedInterestNotification(data: {
    professorEmail: string
    professorName: string
    studentName: string
    studentMatricula: string
    projectTitle: string
    projetoId?: number
    alunoId?: number
    remetenteUserId?: number
  }): Promise<void> {
    const html = await renderEmail(
      <StudentRejectedInterest
        professorName={data.professorName}
        studentName={data.studentName}
        studentMatricula={data.studentMatricula}
        projectTitle={data.projectTitle}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] ${data.studentName} rejeitou participação - ${data.projectTitle}`,
      html,
      tipoNotificacao: 'ALUNO_REJEITOU_PROCESSO_SELETIVO',
      projetoId: data.projetoId,
      alunoId: data.alunoId,
      remetenteUserId: data.remetenteUserId,
    })
  },
}
