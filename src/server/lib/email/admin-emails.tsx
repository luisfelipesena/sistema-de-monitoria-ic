import {
  ChefeSignatureRequest,
  DepartmentConsolidation,
  EditalPublished,
  PlanilhaPrograd,
} from '@/server/emails/templates/admin'
import { renderEmail } from '@/server/emails/render'
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
    isCSV?: boolean
    projectPdfAttachments?: Array<{
      filename: string
      content: Buffer
      contentType: string
    }>
  }): Promise<void> {
    const semestreDisplay = SEMESTRE_LABELS[data.semestre as Semestre]

    let fileExtension = 'pdf'
    let contentType = 'application/pdf'
    let formatoTexto = 'PDF'

    if (data.isExcel) {
      fileExtension = 'xlsx'
      contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      formatoTexto = 'Excel'
    } else if (
      data.isCSV ||
      (!data.isExcel && data.planilhaPDFBuffer.toString().startsWith('Unidade'))
    ) {
      fileExtension = 'csv'
      contentType = 'text/csv'
      formatoTexto = 'CSV'
    }

    const filename = `Planilha_PROGRAD_${data.ano}_${semestreDisplay}.${fileExtension}`
    const totalPdfAttachments = data.projectPdfAttachments?.length || 0

    const html = await renderEmail(
      <PlanilhaPrograd
        semestreDisplay={semestreDisplay}
        ano={data.ano}
        formatoTexto={formatoTexto}
        totalPdfAttachments={totalPdfAttachments}
      />
    )

    const attachments = [
      {
        filename,
        content: data.planilhaPDFBuffer,
        contentType,
      },
      ...(data.projectPdfAttachments || []),
    ]

    await emailSender.send({
      to: data.progradEmail,
      subject: `[Monitoria IC] Consolidação para Instituto - ${data.ano}.${semestreDisplay}`,
      html,
      attachments,
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

    const html = await renderEmail(
      <DepartmentConsolidation
        semestreDisplay={semestreDisplay}
        ano={data.ano}
        anexos={data.anexos}
      />
    )

    await emailSender.send({
      to: data.to,
      subject: `[Monitoria IC] Consolidação final ${semestreDisplay}/${data.ano}`,
      html,
      attachments: data.anexos.map((anexo) => ({
        filename: anexo.filename,
        content: anexo.buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    const html = await renderEmail(
      <EditalPublished
        editalNumero={data.editalNumero}
        editalTitulo={data.editalTitulo}
        semestreFormatado={data.semestreFormatado}
        ano={data.ano}
        linkPDF={data.linkPDF}
      />
    )

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

    const html = await renderEmail(
      <ChefeSignatureRequest
        chefeNome={data.chefeNome}
        editalNumero={data.editalNumero}
        editalTitulo={data.editalTitulo}
        semestreFormatado={data.semestreFormatado}
        ano={data.ano}
        signatureUrl={signatureUrl}
        expiresAtFormatted={expiresAtFormatted}
      />
    )

    await emailSender.send({
      to: data.chefeEmail,
      subject: `[Monitoria IC] Solicitação de Assinatura - ${data.editalTitulo}`,
      html,
      tipoNotificacao: 'CHEFE_SIGNATURE_REQUEST',
      remetenteUserId: data.remetenteUserId,
    })
  },
}
