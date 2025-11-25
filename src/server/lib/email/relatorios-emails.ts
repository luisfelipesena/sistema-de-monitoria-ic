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
  /**
   * Notifica professores para gerar relatórios finais
   */
  async sendProfessorRelatorioNotification(data: NotifyProfessorRelatorioData): Promise<void> {
    const semestreDisplay = SEMESTRE_LABELS[data.semestre]
    const prazoText = data.prazoFinal
      ? `até <strong>${data.prazoFinal.toLocaleDateString('pt-BR')}</strong>`
      : 'o mais breve possível'

    const projetosHtml = data.projetos
      .map(
        (p) => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${p.disciplinaNome}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${p.titulo}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${p.qtdMonitores}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
            <a href="${clientUrl}/home/professor/relatorios-finais?projetoId=${p.id}"
               style="color: #0066cc; text-decoration: underline;">
              Acessar
            </a>
          </td>
        </tr>
      `
      )
      .join('')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0b5394; border-bottom: 2px solid #0b5394; padding-bottom: 10px;">
          Solicitação de Relatórios Finais - ${semestreDisplay}/${data.ano}
        </h2>

        <p>Prezado(a) Prof(a). <strong>${data.professorNome}</strong>,</p>

        <p>
          O período de <strong>${semestreDisplay}/${data.ano}</strong> está finalizando.
          Solicitamos a geração dos relatórios finais de monitoria ${prazoText}.
        </p>

        <h3 style="color: #333; margin-top: 25px;">Projetos Pendentes de Relatório</h3>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background-color: #0b5394; color: white;">
              <th style="padding: 12px; text-align: left;">Disciplina</th>
              <th style="padding: 12px; text-align: left;">Projeto</th>
              <th style="padding: 12px; text-align: center;">Monitores</th>
              <th style="padding: 12px; text-align: center;">Ação</th>
            </tr>
          </thead>
          <tbody>
            ${projetosHtml}
          </tbody>
        </table>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Importante:</strong></p>
          <ul style="margin: 10px 0 0 0;">
            <li>Gerar relatório final da disciplina</li>
            <li>Gerar relatório individual para cada monitor</li>
            <li>Assinar todos os relatórios digitalmente</li>
            <li>Os monitores também precisarão assinar seus relatórios</li>
          </ul>
        </div>

        <p style="margin-top: 25px;">
          <a href="${clientUrl}/home/professor/relatorios-finais"
             style="background-color: #0b5394; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Acessar Relatórios Finais
          </a>
        </p>

        <p style="margin-top: 30px; color: #666;">
          Atenciosamente,<br/>
          <strong>Sistema de Monitoria IC - UFBA</strong>
        </p>
      </div>
    `

    await emailSender.send({
      to: data.professorEmail,
      subject: `[Monitoria IC] Solicitação de Relatórios Finais - ${semestreDisplay}/${data.ano}`,
      html,
      tipoNotificacao: 'SOLICITACAO_RELATORIO_PROFESSOR',
      remetenteUserId: data.remetenteUserId,
    })
  },

  /**
   * Notifica aluno que há um relatório pendente de assinatura
   */
  async sendStudentRelatorioNotification(data: NotifyStudentRelatorioData): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4caf50; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">
          Relatório de Monitoria Aguardando Assinatura
        </h2>

        <p>Prezado(a) <strong>${data.alunoNome}</strong>,</p>

        <p>
          Seu relatório final de monitoria foi gerado pelo Prof(a). <strong>${data.professorNome}</strong>
          e está aguardando sua assinatura.
        </p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Disciplina:</strong> ${data.disciplinaNome}</p>
          <p style="margin: 5px 0;"><strong>Projeto:</strong> ${data.projetoTitulo}</p>
          <p style="margin: 5px 0;"><strong>Professor:</strong> ${data.professorNome}</p>
        </div>

        <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;">
            <strong>Importante:</strong> Por favor, revise e assine seu relatório para que o certificado
            de monitoria possa ser emitido.
          </p>
        </div>

        <p style="margin-top: 25px;">
          <a href="${data.linkRelatorio}"
             style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Revisar e Assinar Relatório
          </a>
        </p>

        <p style="margin-top: 30px; color: #666;">
          Atenciosamente,<br/>
          <strong>Sistema de Monitoria IC - UFBA</strong>
        </p>
      </div>
    `

    await emailSender.send({
      to: data.alunoEmail,
      subject: `[Monitoria IC] Relatório Aguardando Assinatura - ${data.disciplinaNome}`,
      html,
      tipoNotificacao: 'RELATORIO_PENDENTE_ASSINATURA_ALUNO',
      remetenteUserId: data.remetenteUserId,
    })
  },

  /**
   * Envia planilhas de certificados para o departamento/NUMOP
   */
  async sendCertificadosParaDepartamento(data: SendRelatoriosCertificadosData): Promise<void> {
    const semestreDisplay = SEMESTRE_LABELS[data.semestre]

    const anexosHtml = data.anexos.map((a) => `<li>${a.filename}</li>`).join('')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0b5394; border-bottom: 2px solid #0b5394; padding-bottom: 10px;">
          Planilhas de Certificados - ${semestreDisplay}/${data.ano}
        </h2>

        <p>Prezados,</p>

        <p>
          Seguem em anexo as planilhas de certificados de monitoria referentes ao período
          <strong>${semestreDisplay}/${data.ano}</strong> para encaminhamento ao NUMOP.
        </p>

        <div style="background-color: #e6f3ff; border-left: 4px solid #0b5394; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Anexos incluídos:</strong></p>
          <ul style="margin: 10px 0 0 0;">
            ${anexosHtml}
          </ul>
        </div>

        <p>
          Cada planilha contém os dados necessários para emissão dos certificados,
          incluindo links para os relatórios finais em PDF.
        </p>

        <p style="margin-top: 30px; color: #666;">
          Atenciosamente,<br/>
          <strong>Sistema de Monitoria IC - UFBA</strong><br/>
          Instituto de Computação
        </p>
      </div>
    `

    await emailSender.send({
      to: data.to,
      subject: `[Monitoria IC] Certificados para NUMOP - ${semestreDisplay}/${data.ano}`,
      html,
      attachments: data.anexos.map((anexo) => ({
        filename: anexo.filename,
        content: anexo.buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })),
      tipoNotificacao: 'CERTIFICADOS_ENVIADOS_NUMOP',
      remetenteUserId: data.remetenteUserId,
    })
  },
}
