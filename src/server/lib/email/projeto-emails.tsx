import {
  ProjectCreation,
  ProjectStatusChange,
  ScholarshipAllocation,
  SubmissionReminder,
} from '@/server/emails/templates/professor'
import { ProjectSubmitted, ProfessorSigned } from '@/server/emails/templates/admin'
import { renderEmail } from '@/server/emails/render'
import {
  getSemestreNumero,
  PROJETO_STATUS_PENDING_SIGNATURE,
  SEMESTRE_LABELS,
  type Semestre,
} from '@/types'
import { env } from '@/utils/env'
import { emailSender } from './email-sender'

const clientUrl = env.CLIENT_URL || 'http://localhost:3000'

export interface ProjetoStatusChangeData {
  professorNome: string
  professorEmail: string
  projetoTitulo: string
  statusAnterior?: string
  novoStatus: string
  feedback?: string
  bolsasDisponibilizadas?: number
  linkProjeto?: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export interface LembreteSubmissaoData {
  professorEmail: string
  professorNome: string
  periodoFormatado: string
  customMessage?: string
  linkPlataforma: string
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

export const projetoEmailService = {
  async sendStatusChange(
    data: ProjetoStatusChangeData,
    remetenteUserId?: number
  ): Promise<void> {
    const linkProjeto = `${clientUrl}/home/professor/project/${data.projetoId}`

    const html = await renderEmail(
      <ProjectStatusChange
        professorNome={data.professorNome}
        projetoTitulo={data.projetoTitulo}
        projetoId={data.projetoId}
        novoStatus={data.novoStatus}
        feedback={data.feedback}
        bolsasDisponibilizadas={data.bolsasDisponibilizadas}
        linkProjeto={linkProjeto}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Projeto ${data.novoStatus}: ${data.projetoTitulo}`,
      html,
      tipoNotificacao: `PROJETO_${data.novoStatus.toUpperCase()}`,
      projetoId: data.projetoId,
      remetenteUserId: remetenteUserId ?? data.remetenteUserId,
    })
  },

  async sendSubmittedToAdmins(
    data: {
      professorNome: string
      projetoTitulo: string
      projetoId: number
      departamento?: string
      semestre?: string
      ano?: number
      remetenteUserId?: number
    },
    adminEmails: string[]
  ): Promise<void> {
    const linkProjeto = `${clientUrl}/home/admin/project/${data.projetoId}`
    const periodoFormatado =
      data.ano && data.semestre
        ? `${data.ano}.${getSemestreNumero(data.semestre as Semestre)}`
        : undefined

    const html = await renderEmail(
      <ProjectSubmitted
        professorNome={data.professorNome}
        projetoTitulo={data.projetoTitulo}
        projetoId={data.projetoId}
        departamento={data.departamento}
        periodoFormatado={periodoFormatado}
        linkProjeto={linkProjeto}
      />
    )

    await emailSender.sendBatch(
      adminEmails.map((adminEmail) => ({
        to: adminEmail,
        subject: `[Monitoria IC] Novo Projeto Submetido: ${data.projetoTitulo}`,
        html,
        tipoNotificacao: 'PROJETO_SUBMETIDO_ADMIN',
        projetoId: data.projetoId,
        remetenteUserId: data.remetenteUserId,
      }))
    )
  },

  async sendProfessorSignedNotification(
    data: {
      professorNome: string
      projetoTitulo: string
      projetoId: number
      novoStatusProjeto: string
      remetenteUserId?: number
    },
    adminEmails: string[]
  ): Promise<void> {
    const linkDashboard = `${clientUrl}/home/admin/dashboard`

    const html = await renderEmail(
      <ProfessorSigned
        professorNome={data.professorNome}
        projetoTitulo={data.projetoTitulo}
        projetoId={data.projetoId}
        novoStatusProjeto={data.novoStatusProjeto}
        linkDashboard={linkDashboard}
      />
    )

    await emailSender.sendBatch(
      adminEmails.map((adminEmail) => ({
        to: adminEmail,
        subject: `[Monitoria IC] Proposta Assinada: ${data.projetoTitulo}`,
        html,
        tipoNotificacao: 'PROPOSTA_PROFESSOR_ASSINADA_ADMIN',
        projetoId: data.projetoId,
        remetenteUserId: data.remetenteUserId,
      }))
    )
  },

  async sendPendingSignatureNotification(data: {
    professorEmail: string
    professorNome: string
    projetoId: number
    projetoTitulo: string
    remetenteUserId?: number
  }): Promise<void> {
    const linkProjeto = `${clientUrl}/home/professor/project/${data.projetoId}`

    const html = await renderEmail(
      <ProjectStatusChange
        professorNome={data.professorNome}
        projetoTitulo={data.projetoTitulo}
        projetoId={data.projetoId}
        novoStatus={PROJETO_STATUS_PENDING_SIGNATURE}
        linkProjeto={linkProjeto}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Projeto Gerado: ${data.projetoTitulo} - Assinatura Necessária`,
      html,
      tipoNotificacao: 'PROJETO_GERADO_ASSINATURA_PROFESSOR',
      projetoId: data.projetoId,
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendAdminSignedNotification(data: {
    professorEmail: string
    professorNome: string
    projetoTitulo: string
    projetoId: number
    novoStatusProjeto: string
    remetenteUserId?: number
  }): Promise<void> {
    const linkProjeto = `${clientUrl}/home/professor/project/${data.projetoId}`

    const html = await renderEmail(
      <ProjectStatusChange
        professorNome={data.professorNome}
        projetoTitulo={data.projetoTitulo}
        projetoId={data.projetoId}
        novoStatus={data.novoStatusProjeto}
        feedback="A proposta foi assinada pelo administrador e o projeto está aprovado."
        linkProjeto={linkProjeto}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Projeto Aprovado e Assinado: ${data.projetoTitulo}`,
      html,
      tipoNotificacao: 'PROJETO_ADMIN_ASSINOU_PROFESSOR',
      projetoId: data.projetoId,
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendCreationNotification(data: {
    to: string
    professorName: string
    ano: number
    semestre: Semestre
  }): Promise<void> {
    const semestreFormatado = SEMESTRE_LABELS[data.semestre]
    const linkProjetos = `${clientUrl}/home/professor/dashboard`

    const html = await renderEmail(
      <ProjectCreation
        professorName={data.professorName}
        ano={data.ano}
        semestreFormatado={semestreFormatado}
        linkProjetos={linkProjetos}
      />
    )

    await emailSender.send({
      to: data.to,
      subject: `[Monitoria IC] Projetos criados para ${semestreFormatado}/${data.ano}`,
      html,
      tipoNotificacao: 'PROJECT_CREATION_NOTIFICATION',
    })
  },

  async sendSubmissionReminder(data: LembreteSubmissaoData): Promise<void> {
    const html = await renderEmail(
      <SubmissionReminder
        professorNome={data.professorNome}
        periodoFormatado={data.periodoFormatado}
        customMessage={data.customMessage}
        linkPlataforma={data.linkPlataforma}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Lembrete: Submissão de Projeto Pendente - Período ${data.periodoFormatado}`,
      html,
      tipoNotificacao: 'LEMBRETE_SUBMISSAO_PROJETO',
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendScholarshipAllocation(data: {
    to: string
    professorName: string
    ano: number
    semestre: string
    projetos: { titulo: string; bolsas: number; voluntarios: number }[]
  }): Promise<void> {
    const semestreFormatado =
      data.semestre === 'SEMESTRE_1' ? '1º Semestre' : '2º Semestre'
    const linkProjetos = `${clientUrl}/home/professor/dashboard`

    const html = await renderEmail(
      <ScholarshipAllocation
        professorName={data.professorName}
        ano={data.ano}
        semestreFormatado={semestreFormatado}
        projetos={data.projetos}
        linkProjetos={linkProjetos}
      />
    )

    await emailSender.send({
      to: data.to,
      subject: `[Monitoria IC] Bolsas alocadas para ${semestreFormatado}/${data.ano}`,
      html,
      tipoNotificacao: 'SCHOLARSHIP_ALLOCATION_NOTIFICATION',
    })
  },
}
