import { ProfessorReport, CertificatesDepartment } from '@/server/emails/templates/reports'
import { ReportSignature } from '@/server/emails/templates/student'
import { renderEmail } from '@/server/emails/render'
import { SEMESTRE_LABELS, type Semestre } from '@/types'
import { env } from '@/utils/env'
import { emailSender } from './email-sender'

const clientUrl = env.CLIENT_URL || 'http://localhost:3000'

export interface NotifyProfessorRelatorioData {
  professorEmail: string
  professorNome: string
  projetos: {
    id: number
    titulo: string
    disciplinaNome: string
    qtdMonitores: number
  }[]
  ano: number
  semestre: Semestre
  prazoFinal?: Date
  remetenteUserId?: number
}

export interface NotifyStudentRelatorioData {
  alunoEmail: string
  alunoNome: string
  projetoTitulo: string
  disciplinaNome: string
  professorNome: string
  linkRelatorio: string
  remetenteUserId?: number
}

export interface SendRelatoriosCertificadosData {
  to: string
  ano: number
  semestre: Semestre
  anexos: { filename: string; buffer: Buffer }[]
  remetenteUserId?: number
}

export const relatoriosEmailService = {
  async sendProfessorRelatorioNotification(
    data: NotifyProfessorRelatorioData
  ): Promise<void> {
    const semestreDisplay = SEMESTRE_LABELS[data.semestre]
    const prazoText = data.prazoFinal
      ? `até ${data.prazoFinal.toLocaleDateString('pt-BR')}`
      : 'o mais breve possível'
    const linkRelatorios = `${clientUrl}/home/professor/relatorios-finais`

    const projetos = data.projetos.map((p) => ({
      ...p,
      linkRelatorio: `${clientUrl}/home/professor/relatorios-finais?projetoId=${p.id}`,
    }))

    const html = await renderEmail(
      <ProfessorReport
        professorNome={data.professorNome}
        ano={data.ano}
        semestreDisplay={semestreDisplay}
        projetos={projetos}
        prazoText={prazoText}
        linkRelatorios={linkRelatorios}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Solicitação de Relatórios Finais - ${semestreDisplay}/${data.ano}`,
      html,
      tipoNotificacao: 'SOLICITACAO_RELATORIO_PROFESSOR',
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendStudentRelatorioNotification(
    data: NotifyStudentRelatorioData
  ): Promise<void> {
    const html = await renderEmail(
      <ReportSignature
        alunoNome={data.alunoNome}
        projetoTitulo={data.projetoTitulo}
        disciplinaNome={data.disciplinaNome}
        professorNome={data.professorNome}
        linkRelatorio={data.linkRelatorio}
      />
    )

    await emailSender.send({
      to: data.alunoEmail,
      subject: `[Monitoria IC] Relatório Aguardando Assinatura - ${data.disciplinaNome}`,
      html,
      tipoNotificacao: 'RELATORIO_PENDENTE_ASSINATURA_ALUNO',
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendCertificadosParaDepartamento(
    data: SendRelatoriosCertificadosData
  ): Promise<void> {
    const semestreDisplay = SEMESTRE_LABELS[data.semestre]

    const html = await renderEmail(
      <CertificatesDepartment
        semestreDisplay={semestreDisplay}
        ano={data.ano}
        anexos={data.anexos}
      />
    )

    await emailSender.send({
      to: data.to,
      subject: `[Monitoria IC] Certificados para NUMOP - ${semestreDisplay}/${data.ano}`,
      html,
      attachments: data.anexos.map((anexo) => ({
        filename: anexo.filename,
        content: anexo.buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })),
      tipoNotificacao: 'CERTIFICADOS_ENVIADOS_NUMOP',
      remetenteUserId: data.remetenteUserId,
    })
  },
}
