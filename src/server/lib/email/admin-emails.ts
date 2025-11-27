import { SEMESTRE_LABELS, type Semestre } from '@/types'
import { env } from '@/utils/env'
import { emailSender } from './email-sender'

const clientUrl = env.CLIENT_URL || 'http://localhost:3000'

export const adminEmailService = {
  async sendPlanilhaPROGRAD(data: {
    progradEmail: string
    planilhaPDFBuffer: Buffer
    semestre: string
    ano: number
    remetenteUserId?: number
    isExcel?: boolean
  }): Promise<void> {
    const semestreDisplay = SEMESTRE_LABELS[data.semestre as Semestre]
    const fileExtension = data.isExcel ? 'xlsx' : 'pdf'
    const filename = `Planilha_PROGRAD_${data.ano}_${semestreDisplay}.${fileExtension}`
    const contentType = data.isExcel
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf'
    const formatoTexto = data.isExcel ? 'Excel' : 'PDF'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2; text-align: center;">Planilha para Instituto - ${data.ano}.${semestreDisplay}</h2>

        <p>Prezados,</p>

        <p>Segue em anexo a planilha de consolidação dos monitores aprovados no Instituto de Computação para o período ${data.ano}.${semestreDisplay} em formato ${formatoTexto}.</p>

        <p>Esta planilha contém informações completas sobre:</p>
        <ul>
          <li>Monitores bolsistas e voluntários selecionados</li>
          <li>Dados pessoais e acadêmicos dos monitores</li>
          <li>Informações bancárias (quando aplicável)</li>
          <li>Projetos e disciplinas vinculadas</li>
          <li>Professores responsáveis e carga horária</li>
          <li>Departamentos e códigos das disciplinas</li>
        </ul>

        <p>Esta planilha será encaminhada pelo Instituto de Computação à PROGRAD para processamento.</p>

        <p>Para dúvidas ou esclarecimentos, entrar em contato através do Sistema de Monitoria IC.</p>

        <p>Atenciosamente,<br>
        Sistema de Monitoria IC - UFBA<br>
        Instituto de Computação</p>
      </div>
    `

    await emailSender.send({
      to: data.progradEmail,
      subject: `[Monitoria IC] Consolidação para Instituto - ${data.ano}.${semestreDisplay}`,
      html,
      attachments: [
        {
          filename,
          content: data.planilhaPDFBuffer,
          contentType,
        },
      ],
      tipoNotificacao: 'PLANILHA_PROGRAD_ENVIADA',
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendDepartmentConsolidation(data: {
    to: string
    ano: number
    semestre: Semestre
    anexos: { filename: string; buffer: Buffer }[]
    remetenteUserId?: number
  }): Promise<void> {
    const semestreDisplay = SEMESTRE_LABELS[data.semestre]

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0b5394; text-align: center;">Consolidação Final de Monitoria</h2>

        <p>Prezados,</p>

        <p>
          Seguem anexadas as planilhas consolidadas de monitores bolsistas e voluntários referentes ao
          <strong>${semestreDisplay}/${data.ano}</strong>. Após validação departamental, essas planilhas podem ser encaminhadas à PROGRAD.
        </p>

        <div style="background-color: #e6f3ff; border-left: 4px solid #0b5394; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📎 Anexos incluídos:</strong></p>
          <ul style="margin: 10px 0;">
            ${data.anexos.map((anexo) => `<li>${anexo.filename}</li>`).join('')}
          </ul>
        </div>

        <p style="margin-top: 20px;">Atenciosamente,<br/>
        <strong>Sistema de Monitoria IC - UFBA</strong></p>
      </div>
    `

    await emailSender.send({
      to: data.to,
      subject: `[Monitoria IC] Consolidação final ${semestreDisplay}/${data.ano}`,
      html,
      attachments: data.anexos.map((anexo) => ({
        filename: anexo.filename,
        content: anexo.buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })),
      tipoNotificacao: 'PLANILHA_DEPARTAMENTO_ENVIADA',
      remetenteUserId: data.remetenteUserId,
    })
  },

  async sendEditalPublished(data: {
    editalNumero: string
    editalTitulo: string
    semestreFormatado: string
    ano: number
    linkPDF: string
    to: string[]
  }): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
          📢 Edital Publicado - ${data.semestreFormatado}/${data.ano}
        </h2>

        <p>Prezados estudantes e professores,</p>

        <p>Foi publicado o <strong>${data.editalTitulo}</strong> para o período de <strong>${data.semestreFormatado}/${data.ano}</strong>.</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>📋 Edital:</strong> ${data.editalNumero}</p>
          <p><strong>📝 Título:</strong> ${data.editalTitulo}</p>
          <p><strong>📅 Período:</strong> ${data.semestreFormatado}/${data.ano}</p>
        </div>

        <p>Acesse o edital completo através do link abaixo:</p>

        <p style="margin-top: 20px;">
          <a href="${data.linkPDF}"
             style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            📄 Visualizar Edital (PDF)
          </a>
        </p>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          <strong>📌 Para estudantes:</strong> Consulte o edital para informações sobre prazos de inscrição e requisitos.
        </p>

        <p style="color: #666; font-size: 14px;">
          <strong>👨‍🏫 Para professores:</strong> Consulte o edital para informações sobre o processo seletivo de monitores.
        </p>

        <p style="margin-top: 20px;">Atenciosamente,<br/>
        <strong>Sistema de Monitoria IC - UFBA</strong></p>
      </div>
    `

    await emailSender.sendBatch(
      data.to.map((email) => ({
        to: email,
        subject: `[Monitoria IC] ${data.editalTitulo} - ${data.semestreFormatado}/${data.ano}`,
        html,
        tipoNotificacao: 'EDITAL_PUBLISHED_NOTIFICATION',
      }))
    )
  },

  async sendChefeSignatureRequest(data: {
    chefeEmail: string
    chefeNome?: string
    editalNumero: string
    editalTitulo: string
    semestreFormatado: string
    ano: number
    signatureToken: string
    expiresAt: Date
    remetenteUserId?: number
  }): Promise<void> {
    const signatureUrl = `${clientUrl}/assinar-edital?token=${data.signatureToken}`
    const expiresAtFormatted = data.expiresAt.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0b5394; border-bottom: 2px solid #0b5394; padding-bottom: 10px;">
          ✍️ Solicitação de Assinatura de Edital
        </h2>

        <p>Prezado(a) ${data.chefeNome || 'Chefe do Departamento'},</p>

        <p>
          O Coordenador de Monitoria do DCC solicita sua assinatura digital no
          <strong>${data.editalTitulo}</strong> referente ao período
          <strong>${data.semestreFormatado}/${data.ano}</strong>.
        </p>

        <div style="background-color: #e6f3ff; border-left: 4px solid #0b5394; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📋 Edital:</strong> ${data.editalNumero}</p>
          <p style="margin: 5px 0;"><strong>📝 Título:</strong> ${data.editalTitulo}</p>
          <p style="margin: 5px 0;"><strong>📅 Período:</strong> ${data.semestreFormatado}/${data.ano}</p>
        </div>

        <p>
          Clique no botão abaixo para visualizar o edital e realizar a assinatura digital.
          Você poderá revisar todo o conteúdo antes de assinar.
        </p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${signatureUrl}"
             style="background-color: #0b5394; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            ✍️ Assinar Edital
          </a>
        </p>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Atenção:</strong> Este link é válido até <strong>${expiresAtFormatted}</strong>.
            Após este prazo, uma nova solicitação deverá ser feita pelo coordenador.
          </p>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Se você recebeu este email por engano ou não é o Chefe do Departamento responsável,
          por favor desconsidere esta mensagem.
        </p>

        <p style="margin-top: 20px;">Atenciosamente,<br/>
        <strong>Sistema de Monitoria IC - UFBA</strong></p>
      </div>
    `

    await emailSender.send({
      to: data.chefeEmail,
      subject: `[Monitoria IC] Solicitação de Assinatura - ${data.editalTitulo}`,
      html,
      tipoNotificacao: 'CHEFE_SIGNATURE_REQUEST',
      remetenteUserId: data.remetenteUserId,
    })
  },
}
