import { env } from '@/utils/env'
import nodemailer from 'nodemailer'

import { db } from '@/server/db'
import { notificacaoHistoricoTable, statusEnvioEnum } from '@/server/db/schema'
import { getNotificacaoGeralAdminsHTML } from '@/server/email-templates/admin-notifications'
import { getProfessorInvitationEmailHTML } from '@/server/email-templates/professor-invitation'
import {
  getProjetoStatusChangeHTML,
  type ProjetoStatusChangeData,
} from '@/server/email-templates/project-status-change'
import {
  getLembreteSelecaoMonitoresHTML,
  getLembreteSubmissaoProjetoHTML,
  type LembreteSelecaoData,
  type LembreteSubmissaoData,
} from '@/server/email-templates/reminder-templates'
import { REJECTED_BY_PROFESSOR, SELECTED_BOLSISTA, SELECTED_VOLUNTARIO } from '@/types'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'EmailService' })

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
})

interface BaseEmailParams {
  to: string
  subject: string
  html: string
  tipoNotificacao: string
  remetenteUserId?: number
  projetoId?: number
  alunoId?: number
}

async function sendGenericEmail({
  to,
  subject,
  html,
  tipoNotificacao,
  remetenteUserId,
  projetoId,
  alunoId,
}: BaseEmailParams) {
  try {
    await transporter.sendMail({
      from: `"Sistema de Monitoria IC - UFBA" <${env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })

    await db.insert(notificacaoHistoricoTable).values({
      destinatarioEmail: to,
      assunto: subject,
      tipoNotificacao,
      statusEnvio: statusEnvioEnum.enumValues[0],
      remetenteUserId,
      projetoId,
      alunoId,
    })
    log.info({ to, subject, tipoNotificacao }, 'Email enviado e registrado com sucesso.')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar email'
    log.error({ to, subject, tipoNotificacao, error: errorMessage }, 'Falha ao enviar email ou registrar histórico.')

    try {
      await db.insert(notificacaoHistoricoTable).values({
        destinatarioEmail: to,
        assunto: subject,
        tipoNotificacao,
        statusEnvio: statusEnvioEnum.enumValues[1],
        mensagemErro: errorMessage,
        remetenteUserId,
        projetoId,
        alunoId,
      })
    } catch (dbError) {
      log.error({ dbError, to, subject, tipoNotificacao }, 'Falha CRÍTICA ao registrar falha de envio de email.')
    }
    throw error
  }
}

interface ProjetoContextData {
  projetoId?: number
  alunoId?: number
  remetenteUserId?: number
}

interface ProfessorInvitationEmailServiceData extends ProjetoContextData {
  professorEmail: string
  invitationLink: string
  adminName?: string
}

export async function sendProjetoStatusChangeNotification(data: ProjetoStatusChangeData, remetenteUserId?: number) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000'
  data.linkProjeto = `${clientUrl}/home/professor/project/${data.projetoId}`

  const html = getProjetoStatusChangeHTML(data)
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Projeto ${data.novoStatus}: ${data.projetoTitulo}`,
    html,
    tipoNotificacao: `PROJETO_${data.novoStatus.toUpperCase()}`,
    projetoId: data.projetoId,
    remetenteUserId: remetenteUserId ?? data.remetenteUserId,
  })
}

export async function sendProjetoSubmetidoParaAdminsNotification(
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
) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000'
  const linkProjeto = `${clientUrl}/home/admin/project/${data.projetoId}`

  const htmlMessage = `
    <p>O projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi submetido pelo Prof(a). ${data.professorNome} e aguarda análise.</p>
    <div class="project-info">
        <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
        <p><strong>Título:</strong> ${data.projetoTitulo}</p>
        ${data.departamento ? `<p><strong>Departamento:</strong> ${data.departamento}</p>` : ''}
        ${data.ano && data.semestre ? `<p><strong>Período:</strong> ${data.ano}.${data.semestre === 'SEMESTRE_1' ? '1' : '2'}</p>` : ''}
    </div>
  `

  const html = getNotificacaoGeralAdminsHTML('Novo Projeto Submetido para Análise', htmlMessage, {
    text: 'Revisar Projeto',
    url: linkProjeto,
  })

  for (const adminEmail of adminEmails) {
    await sendGenericEmail({
      to: adminEmail,
      subject: `[Monitoria IC] Novo Projeto Submetido: ${data.projetoTitulo}`,
      html,
      tipoNotificacao: 'PROJETO_SUBMETIDO_ADMIN',
      projetoId: data.projetoId,
      remetenteUserId: data.remetenteUserId,
    })
  }
}

export async function sendProfessorAssinouPropostaNotification(
  data: {
    professorNome: string
    projetoTitulo: string
    projetoId: number
    novoStatusProjeto: string
    remetenteUserId?: number
  },
  adminEmails: string[]
) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000'
  const linkProjeto = `${clientUrl}/home/admin/dashboard`

  const htmlMessage = `
    <p>O Prof(a). ${data.professorNome} assinou e enviou a proposta para o projeto "<strong>${data.projetoTitulo}</strong>".</p>
    <p>O projeto está agora com status "<strong>${data.novoStatusProjeto}</strong>" e pode requerer sua revisão e/ou assinatura como administrador.</p>
    <div class="project-info">
        <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
        <p><strong>Título:</strong> ${data.projetoTitulo}</p>
    </div>
  `
  const html = getNotificacaoGeralAdminsHTML('Proposta Assinada pelo Professor', htmlMessage, {
    text: 'Revisar Proposta',
    url: linkProjeto,
  })

  for (const adminEmail of adminEmails) {
    await sendGenericEmail({
      to: adminEmail,
      subject: `[Monitoria IC] Proposta Assinada: ${data.projetoTitulo}`,
      html,
      tipoNotificacao: 'PROPOSTA_PROFESSOR_ASSINADA_ADMIN',
      projetoId: data.projetoId,
      remetenteUserId: data.remetenteUserId,
    })
  }
}

export async function sendProjetoGeradoParaAssinaturaNotification(data: {
  professorEmail: string
  professorNome: string
  projetoId: number
  projetoTitulo: string
  remetenteUserId?: number
}) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000'
  const emailPayload: ProjetoStatusChangeData = {
    professorEmail: data.professorEmail,
    professorNome: data.professorNome,
    projetoTitulo: data.projetoTitulo,
    projetoId: data.projetoId,
    novoStatus: 'PENDING_PROFESSOR_SIGNATURE',
    linkProjeto: `${clientUrl}/home/professor/project/${data.projetoId}`,
    remetenteUserId: data.remetenteUserId,
  }
  const html = getProjetoStatusChangeHTML(emailPayload)
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Projeto Gerado: ${data.projetoTitulo} - Assinatura Necessária`,
    html,
    tipoNotificacao: 'PROJETO_GERADO_ASSINATURA_PROFESSOR',
    projetoId: data.projetoId,
    remetenteUserId: data.remetenteUserId,
  })
}

export async function sendAdminAssinouPropostaNotification(data: {
  professorEmail: string
  professorNome: string
  projetoTitulo: string
  projetoId: number
  novoStatusProjeto: string
  remetenteUserId?: number
}) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000'
  const emailData: ProjetoStatusChangeData = {
    professorEmail: data.professorEmail,
    professorNome: data.professorNome,
    projetoTitulo: data.projetoTitulo,
    projetoId: data.projetoId,
    novoStatus: data.novoStatusProjeto,
    linkProjeto: `${clientUrl}/home/professor/project/${data.projetoId}`,
    feedback: 'A proposta foi assinada pelo administrador e o projeto está aprovado.',
    remetenteUserId: data.remetenteUserId,
  }

  const html = getProjetoStatusChangeHTML(emailData)
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Projeto Aprovado e Assinado: ${data.projetoTitulo}`,
    html,
    tipoNotificacao: 'PROJETO_ADMIN_ASSINOU_PROFESSOR',
    projetoId: data.projetoId,
    remetenteUserId: data.remetenteUserId,
  })
}

export interface StudentSelectionNotificationData extends ProjetoContextData {
  studentName: string
  studentEmail: string
  projectTitle: string
  professorName: string
  status: typeof SELECTED_BOLSISTA | typeof SELECTED_VOLUNTARIO | typeof REJECTED_BY_PROFESSOR
  linkConfirmacao?: string
  feedbackProfessor?: string
}

export async function sendStudentSelectionResultNotification(
  data: StudentSelectionNotificationData,
  remetenteUserId?: number
) {
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
  await sendGenericEmail({
    to: data.studentEmail,
    subject: `[Monitoria IC] Resultado da Seleção: ${data.projectTitle}`,
    html,
    tipoNotificacao: 'RESULTADO_SELECAO_ALUNO',
    projetoId: data.projetoId,
    alunoId: data.alunoId,
    remetenteUserId: remetenteUserId ?? data.remetenteUserId,
  })
}

export async function sendLembreteSubmissaoProjetoPendente(data: LembreteSubmissaoData) {
  const html = getLembreteSubmissaoProjetoHTML(data)
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Lembrete: Submissão de Projeto Pendente - Período ${data.periodoFormatado}`,
    html,
    tipoNotificacao: 'LEMBRETE_SUBMISSAO_PROJETO',
    remetenteUserId: data.remetenteUserId,
  })
}

export async function sendLembreteSelecaoMonitoresPendente(data: LembreteSelecaoData) {
  const html = getLembreteSelecaoMonitoresHTML(data)
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Lembrete: Seleção de Monitores Pendente - ${data.projetoTitulo}`,
    html,
    tipoNotificacao: 'LEMBRETE_SELECAO_MONITORES',
    projetoId: data.projetoId,
    remetenteUserId: data.remetenteUserId,
  })
}

export async function sendProfessorInvitationEmail(data: ProfessorInvitationEmailServiceData) {
  const clientName = 'Sistema de Monitoria IC'
  const subject = `[${clientName}] Convite para se juntar à plataforma como Professor`
  const html = getProfessorInvitationEmailHTML({
    professorEmail: data.professorEmail,
    invitationLink: data.invitationLink,
    adminName: data.adminName,
  })

  await sendGenericEmail({
    to: data.professorEmail,
    subject,
    html,
    tipoNotificacao: 'CONVITE_PROFESSOR',
    remetenteUserId: data.remetenteUserId,
  })
}

export async function sendPlanilhaPROGRADEmail(data: {
  progradEmail: string
  planilhaPDFBuffer: Buffer
  semestre: string
  ano: number
  remetenteUserId?: number
  isExcel?: boolean
}) {
  const semestreDisplay = data.semestre === 'SEMESTRE_1' ? '1' : '2'
  const fileExtension = data.isExcel ? 'xlsx' : 'pdf'
  const filename = `Planilha_PROGRAD_${data.ano}_${semestreDisplay}.${fileExtension}`
  const contentType = data.isExcel
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/pdf'
  const formatoTexto = data.isExcel ? 'Excel' : 'PDF'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2; text-align: center;">Planilha PROGRAD - ${data.ano}.${semestreDisplay}</h2>

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

      <p>Os dados foram validados e estão prontos para processamento pela PROGRAD.</p>

      <p>Para dúvidas ou esclarecimentos, entrar em contato através do Sistema de Monitoria IC.</p>

      <p>Atenciosamente,<br>
      Sistema de Monitoria IC - UFBA<br>
      Instituto de Computação</p>
    </div>
  `

  await transporter.sendMail({
    from: `"Sistema de Monitoria IC - UFBA" <${env.EMAIL_USER}>`,
    to: data.progradEmail,
    subject: `[Monitoria IC] Consolidação PROGRAD - ${data.ano}.${semestreDisplay}`,
    html,
    attachments: [
      {
        filename,
        content: data.planilhaPDFBuffer,
        contentType,
      },
    ],
  })

  await db.insert(notificacaoHistoricoTable).values({
    destinatarioEmail: data.progradEmail,
    assunto: `[Monitoria IC] Consolidação PROGRAD - ${data.ano}.${semestreDisplay}`,
    tipoNotificacao: 'PLANILHA_PROGRAD_ENVIADA',
    statusEnvio: statusEnvioEnum.enumValues[0],
    remetenteUserId: data.remetenteUserId,
  })

  log.info(
    {
      email: data.progradEmail,
      semestre: data.semestre,
      ano: data.ano,
      formato: formatoTexto,
    },
    'Planilha PROGRAD enviada com sucesso.'
  )
}

const sendEmailVerification = async (data: { to: string; verificationLink: string }) => {
  const html = `
    <p>Olá,</p>
    <p>Recebemos uma solicitação de criação de conta no Sistema de Monitoria IC.</p>
    <p>Para confirmar seu e-mail e concluir o cadastro, clique no link abaixo:</p>
    <p><a href="${data.verificationLink}">Confirmar e-mail</a></p>
    <p>Se você não solicitou esta conta, pode ignorar este e-mail.</p>
    <p>Atenciosamente,<br/>Equipe Sistema de Monitoria IC</p>
  `

  await sendGenericEmail({
    to: data.to,
    subject: '[Monitoria IC] Confirme seu e-mail',
    html,
    tipoNotificacao: 'EMAIL_VERIFICATION',
  })
}

const sendPasswordResetEmail = async (data: { to: string; resetLink: string }) => {
  const html = `
    <p>Olá,</p>
    <p>Recebemos uma solicitação para redefinir sua senha no Sistema de Monitoria IC.</p>
    <p>Se você fez essa solicitação, clique no link abaixo para criar uma nova senha:</p>
    <p><a href="${data.resetLink}">Redefinir senha</a></p>
    <p>Este link expira em 1 hora. Caso não tenha solicitado a redefinição, ignore este e-mail.</p>
    <p>Atenciosamente,<br/>Equipe Sistema de Monitoria IC</p>
  `

  await sendGenericEmail({
    to: data.to,
    subject: '[Monitoria IC] Redefinição de senha',
    html,
    tipoNotificacao: 'PASSWORD_RESET',
  })
}

/**
 * Envia notificação para professores após importação de planejamento
 */
export const sendProjectCreationNotification = async (data: {
  to: string
  professorName: string
  ano: number
  semestre: string
}) => {
  const semestreFormatado = data.semestre === 'SEMESTRE_1' ? '1º Semestre' : '2º Semestre'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a365d;">Novos Projetos de Monitoria Criados</h2>
      
      <p>Olá, <strong>${data.professorName}</strong>,</p>
      
      <p>Informamos que o planejamento de monitoria do <strong>${semestreFormatado}/${data.ano}</strong> foi importado e seus projetos foram criados automaticamente no sistema.</p>
      
      <div style="background-color: #e6f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Próximos passos:</strong></p>
        <ol style="margin: 10px 0;">
          <li>Acesse o sistema e revise seus projetos criados</li>
          <li>Verifique se os dados estão corretos (objetivos, atividades, carga horária)</li>
          <li>Assine digitalmente seus projetos para submissão</li>
        </ol>
      </div>
      
      <p>Os projetos foram criados com base nos templates das disciplinas cadastradas. Você pode editar qualquer informação antes de assinar e submeter.</p>
      
      <p style="margin-top: 20px;">
        <a href="${env.CLIENT_URL}/home/professor/dashboard" 
           style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Acessar Meus Projetos
        </a>
      </p>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Importante:</strong> Após assinar seus projetos, eles serão enviados para aprovação da coordenação.
      </p>
      
      <p style="margin-top: 20px;">Atenciosamente,<br/>
      <strong>Sistema de Monitoria IC - UFBA</strong></p>
    </div>
  `

  await sendGenericEmail({
    to: data.to,
    subject: `[Monitoria IC] Projetos criados para ${semestreFormatado}/${data.ano}`,
    html,
    tipoNotificacao: 'PROJECT_CREATION_NOTIFICATION',
  })

  log.info({ to: data.to }, 'Email de criação de projeto enviado')
}

export const sendScholarshipAllocationNotification = async (data: {
  to: string
  professorName: string
  ano: number
  semestre: string
  projetos: { titulo: string; bolsas: number }[]
}) => {
  const semestreFormatado = data.semestre === 'SEMESTRE_1' ? '1º Semestre' : '2º Semestre'
  const totalBolsas = data.projetos.reduce((sum, p) => sum + p.bolsas, 0)

  const projetosHtml = data.projetos
    .map(
      (p) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.titulo}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><strong>${p.bolsas}</strong></td>
    </tr>
  `
    )
    .join('')

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a365d;">Bolsas de Monitoria Alocadas</h2>

      <p>Olá, <strong>${data.professorName}</strong>,</p>

      <p>Informamos que as bolsas de monitoria para o <strong>${semestreFormatado}/${data.ano}</strong> foram alocadas pela coordenação.</p>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>📊 Resumo de Alocação:</strong></p>
        <p style="margin: 10px 0;">Total de <strong>${totalBolsas}</strong> bolsa(s) alocada(s) para seus projetos:</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Projeto</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Bolsas</th>
          </tr>
        </thead>
        <tbody>
          ${projetosHtml}
        </tbody>
      </table>

      <div style="background-color: #e6f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Próximos passos:</strong></p>
        <ol style="margin: 10px 0;">
          <li>Acesse o sistema e verifique a alocação de bolsas</li>
          <li>Preencha as informações do edital interno DCC (datas de prova, pontos, bibliografia)</li>
          <li>Aguarde a publicação do edital para início das inscrições</li>
        </ol>
      </div>

      <p style="margin-top: 20px;">
        <a href="${env.CLIENT_URL}/home/professor/dashboard"
           style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Acessar Meus Projetos
        </a>
      </p>

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Importante:</strong> O número de bolsas alocadas é definido pela coordenação e não pode ser alterado. 
        Você pode definir vagas voluntárias adicionais se desejar.
      </p>

      <p style="margin-top: 20px;">Atenciosamente,<br/>
      <strong>Sistema de Monitoria IC - UFBA</strong></p>
    </div>
  `

  await sendGenericEmail({
    to: data.to,
    subject: `[Monitoria IC] Bolsas alocadas para ${semestreFormatado}/${data.ano}`,
    html,
    tipoNotificacao: 'SCHOLARSHIP_ALLOCATION_NOTIFICATION',
  })

  log.info({ to: data.to }, 'Email de alocação de bolsas enviado')
}

export const emailService = {
  sendGenericEmail,
  sendProjetoStatusChangeNotification,
  sendProjetoSubmetidoParaAdminsNotification,
  sendProfessorAssinouPropostaNotification,
  sendAdminAssinouPropostaNotification,
  sendProjetoGeradoParaAssinaturaNotification,
  sendStudentSelectionResultNotification,
  sendLembreteSubmissaoProjetoPendente,
  sendLembreteSelecaoMonitoresPendente,
  sendProfessorInvitationEmail,
  sendPlanilhaPROGRADEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendProjectCreationNotification,
  sendScholarshipAllocationNotification,
}
