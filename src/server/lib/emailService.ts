import { env } from '@/utils/env';
import nodemailer from 'nodemailer';
import { db } from '@/server/database';
import { notificacaoHistoricoTable, statusEnvioEnum } from '@/server/database/schema';
import { logger } from '@/utils/logger';
import { getProfessorInvitationEmailHTML } from './email-templates/email/professor-invitation';

const log = logger.child({ context: 'EmailService' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

interface BaseEmailParams {
  to: string;
  subject: string;
  html: string;
  tipoNotificacao: string;
  remetenteUserId?: number;
  projetoId?: number;
  alunoId?: number;
}

async function sendGenericEmail({ 
  to, 
  subject, 
  html, 
  tipoNotificacao,
  remetenteUserId,
  projetoId,
  alunoId 
}: BaseEmailParams) {
  try {
    await transporter.sendMail({
      from: `"Sistema de Monitoria IC - UFBA" <${env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    await db.insert(notificacaoHistoricoTable).values({
      destinatarioEmail: to,
      assunto: subject,
      tipoNotificacao,
      statusEnvio: statusEnvioEnum.enumValues[0],
      remetenteUserId,
      projetoId,
      alunoId,
    });
    log.info({ to, subject, tipoNotificacao }, 'Email enviado e registrado com sucesso.');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar email';
    log.error({ to, subject, tipoNotificacao, error: errorMessage }, 'Falha ao enviar email ou registrar histórico.');
    
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
      });
    } catch (dbError) {
      log.error({ dbError, to, subject, tipoNotificacao }, 'Falha CRÍTICA ao registrar falha de envio de email.');
    }
    throw error;
  }
}

interface ProjetoContextData {
  projetoId?: number;
  alunoId?: number;
  remetenteUserId?: number;
}

interface ProjetoStatusChangeData extends ProjetoContextData {
  professorNome: string;
  professorEmail: string;
  projetoTitulo: string;
  statusAnterior?: string;
  novoStatus: string;
  feedback?: string;
  bolsasDisponibilizadas?: number;
  linkProjeto?: string;
}

interface NotificacaoGeralData {
  nomeDestinatario: string;
  tituloMensagem: string;
  corpoMensagemHtml: string;
  textoLink?: string;
  urlLink?: string;
}

interface LembreteSubmissaoData extends ProjetoContextData {
  professorEmail: string;
  professorNome: string;
  periodoFormatado: string;
  customMessage?: string;
  linkPlataforma: string;
}

interface LembreteSelecaoData extends ProjetoContextData {
  professorEmail: string;
  professorNome: string;
  projetoTitulo: string;
  customMessage?: string;
  linkPlataforma: string;
}

interface ProfessorInvitationEmailServiceData extends ProjetoContextData {
  professorEmail: string;
  invitationLink: string;
  adminName?: string;
}

const emailTemplates = {
  baseLayout: (title: string, content: string, color: string = '#1976d2') => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333; }
            .container { max-width: 600px; margin: 20px auto; background: white; padding: 25px; border-radius: 8px; border-top: 5px solid ${color}; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding-bottom: 15px; margin-bottom: 25px; border-bottom: 1px solid #eee; }
            .logo { color: ${color}; font-size: 22px; font-weight: bold; }
            .content { line-height: 1.65; font-size: 15px; }
            .content h2 { color: ${color}; margin-top:0; }
            .content p { margin-bottom: 15px; }
            .project-info, .info-box { background: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .project-info p, .info-box p { margin-bottom: 8px; }
            .project-info strong, .info-box strong { color: #555; }
            .action-button { display: inline-block; background-color: ${color}; color: white !important; padding: 12px 22px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 13px; color: #777; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓 Sistema de Monitoria IC - UFBA</div>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>Esta é uma mensagem automática. Por favor, não responda diretamente a este email.</p>
                <p>Instituto de Computação - Universidade Federal da Bahia</p>
            </div>
        </div>
    </body>
    </html>
  `,

  projetoStatusChange: (data: ProjetoStatusChangeData) => {
    let title = '';
    let message = '';
    let color = '#1976d2';

    switch (data.novoStatus) {
      case 'SUBMITTED':
        title = '📄 Projeto Submetido para Análise';
        message = `<p>Seu projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi submetido com sucesso e agora aguarda análise da coordenação.</p>`;
        color = '#2196f3';
        break;
      case 'PENDING_PROFESSOR_SIGNATURE':
        title = '✍️ Assinatura Pendente no Projeto';
        message = `<p>O projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi gerado ou precisa de sua atenção para assinatura.</p>
                   <p>Por favor, acesse o sistema para revisar os detalhes, baixar o documento para assinatura e realizar o upload do documento assinado.</p>`;
        color = '#ff9800';
        break;
      case 'PENDING_ADMIN_SIGNATURE':
        title = '✍️ Projeto Aguardando Assinatura do Administrador';
        message = `<p>O projeto de monitoria "<strong>${data.projetoTitulo}</strong>", submetido pelo Prof(a). ${data.professorNome}, foi aprovado preliminarmente e agora aguarda a assinatura do administrador.</p>
                   <p>Acesse o sistema para revisar e assinar a proposta.</p>`;
        color = '#ff9800';
        break;
      case 'APPROVED':
        title = '✅ Projeto Aprovado!';
        message = `<p>Parabéns! Seu projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi <strong>APROVADO</strong>.</p>`;
        if (data.bolsasDisponibilizadas !== undefined) {
          message += `<p><strong>Bolsas disponibilizadas:</strong> ${data.bolsasDisponibilizadas}</p>`;
        }
        if (data.feedback) {
          message += `<div class="info-box"><p><strong>Observações da Coordenação:</strong><br>${data.feedback}</p></div>`;
        }
        message += `<p>O próximo passo é aguardar o período de inscrições dos estudantes. Você será notificado.</p>`;
        color = '#4caf50';
        break;
      case 'REJECTED':
        title = '❌ Projeto Rejeitado';
        message = `<p>Informamos que seu projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi <strong>REJEITADO</strong>.</p>`;
        if (data.feedback) {
          message += `<div class="info-box"><p><strong>Motivo/Observações da Coordenação:</strong><br>${data.feedback}</p></div>`;
        }
        message += `<p>Por favor, revise as observações e, se desejar, realize as correções e submeta o projeto novamente.</p>`;
        color = '#f44336';
        break;
      default:
        title = 'ℹ️ Atualização de Status do Projeto';
        message = `<p>O status do seu projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi atualizado para: <strong>${data.novoStatus}</strong>.</p>`;
    }

    const projectDetails = data.projetoId ? `
      <div class="project-info">
          <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
          <p><strong>Título:</strong> ${data.projetoTitulo}</p>
      </div>
    ` : '';

    const linkHtml = data.linkProjeto ? `<a href="${data.linkProjeto}" class="action-button">Acessar Projeto no Sistema</a>` : '';

    const content = `
        <h2>${title}</h2>
        <p>Prezado(a) Professor(a) ${data.professorNome},</p>
        ${message}
        ${projectDetails}
        ${linkHtml}
    `;
    return emailTemplates.baseLayout(title, content, color);
  },
  
  notificacaoGeralAdmins: (subjectTitle: string, htmlMessage: string, link?: {text: string, url: string}) => {
    const ctaButton = link ? `<a href="${link.url}" class="action-button">${link.text}</a>` : '';
    const content = `
        <h2>${subjectTitle}</h2>
        <p>Prezada Coordenação/Administração,</p>
        ${htmlMessage}
        ${ctaButton}
    `;
    return emailTemplates.baseLayout(subjectTitle, content, '#673ab7');
  },

  lembreteSubmissaoProjeto: (data: LembreteSubmissaoData) => {
    const title = 'Lembrete: Submissão de Projeto de Monitoria';
    let message = `
      <p>Este é um lembrete sobre a submissão do seu projeto de monitoria para o período <strong>${data.periodoFormatado}</strong>.</p>
      <p>Nossos registros indicam que você ainda não submeteu um projeto para este período. Se você planeja oferecer monitoria, por favor:</p>
      <ol>
        <li>Acesse a plataforma de monitoria (${data.linkPlataforma})</li>
        <li>Crie seu projeto de monitoria</li>
        <li>Submeta o projeto para aprovação</li>
      </ol>
    `;
    if (data.customMessage) {
      message += `<div class="info-box"><p><strong>Mensagem adicional da coordenação:</strong><br>${data.customMessage}</p></div>`;
    }
    message += `<p>Se você não planeja oferecer monitoria neste período, ou já submeteu seu projeto, pode desconsiderar este email.</p>
               <p>Em caso de dúvidas, entre em contato com a coordenação do programa de monitoria.</p>`;
    
    const content = `
        <h2>${title}</h2>
        <p>Prezado(a) Professor(a) ${data.professorNome},</p>
        ${message}
        <a href="${data.linkPlataforma}" class="action-button">Acessar Plataforma</a>
    `;
    return emailTemplates.baseLayout(title, content, '#ffc107');
  },

  lembreteSelecaoMonitores: (data: LembreteSelecaoData) => {
    const title = 'Lembrete: Seleção de Monitores Pendente';
    let message = `
      <p>Este é um lembrete sobre a seleção de monitores para o projeto "<strong>${data.projetoTitulo}</strong>".</p>
      <p>Favor verificar se há candidatos inscritos e proceder com a seleção através da plataforma (${data.linkPlataforma}).</p>
    `;
    if (data.customMessage) {
      message += `<div class="info-box"><p><strong>Mensagem adicional da coordenação:</strong><br>${data.customMessage}</p></div>`;
    }
    const projectDetails = data.projetoId ? `
      <div class="project-info">
          <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
          <p><strong>Título:</strong> ${data.projetoTitulo}</p>
      </div>
    ` : '';
    const content = `
        <h2>${title}</h2>
        <p>Prezado(a) Professor(a) ${data.professorNome},</p>
        ${message}
        ${projectDetails}
        <a href="${data.linkPlataforma}" class="action-button">Acessar Projeto na Plataforma</a>
    `;
    return emailTemplates.baseLayout(title, content, '#ff9800');
  },
};

export async function sendProjetoStatusChangeNotification(data: ProjetoStatusChangeData, remetenteUserId?: number) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
  data.linkProjeto = `${clientUrl}/home/professor/project/${data.projetoId}`;

  const html = emailTemplates.projetoStatusChange(data);
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Projeto ${data.novoStatus}: ${data.projetoTitulo}`,
    html,
    tipoNotificacao: `PROJETO_${data.novoStatus.toUpperCase()}`,
    projetoId: data.projetoId,
    remetenteUserId: remetenteUserId ?? data.remetenteUserId,
  });
}

export async function sendProjetoSubmetidoParaAdminsNotification(
  data: {
    professorNome: string;
    projetoTitulo: string;
    projetoId: number;
    departamento?: string;
    semestre?: string;
    ano?: number;
    remetenteUserId?: number;
  },
  adminEmails: string[],
) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
  const linkProjeto = `${clientUrl}/home/admin/project/${data.projetoId}`;

  const htmlMessage = `
    <p>O projeto de monitoria "<strong>${data.projetoTitulo}</strong>" foi submetido pelo Prof(a). ${data.professorNome} e aguarda análise.</p>
    <div class="project-info">
        <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
        <p><strong>Título:</strong> ${data.projetoTitulo}</p>
        ${data.departamento ? `<p><strong>Departamento:</strong> ${data.departamento}</p>` : ''}
        ${data.ano && data.semestre ? `<p><strong>Período:</strong> ${data.ano}.${data.semestre === 'SEMESTRE_1' ? '1' : '2'}</p>` : ''}
    </div>
  `;
  
  const html = emailTemplates.notificacaoGeralAdmins(
    'Novo Projeto Submetido para Análise',
    htmlMessage,
    { text: 'Revisar Projeto', url: linkProjeto }
  );

  for (const adminEmail of adminEmails) {
    await sendGenericEmail({
      to: adminEmail,
      subject: `[Monitoria IC] Novo Projeto Submetido: ${data.projetoTitulo}`,
      html,
      tipoNotificacao: 'PROJETO_SUBMETIDO_ADMIN',
      projetoId: data.projetoId,
      remetenteUserId: data.remetenteUserId,
    });
  }
}

export async function sendProfessorAssinouPropostaNotification(
  data: {
    professorNome: string;
    projetoTitulo: string;
    projetoId: number;
    novoStatusProjeto: string;
    remetenteUserId?: number;
  },
  adminEmails: string[],
) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
  const linkProjeto = `${clientUrl}/home/admin/project/${data.projetoId}`;

  const htmlMessage = `
    <p>O Prof(a). ${data.professorNome} assinou e enviou a proposta para o projeto "<strong>${data.projetoTitulo}</strong>".</p>
    <p>O projeto está agora com status "<strong>${data.novoStatusProjeto}</strong>" e pode requerer sua revisão e/ou assinatura como administrador.</p>
    <div class="project-info">
        <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
        <p><strong>Título:</strong> ${data.projetoTitulo}</p>
    </div>
  `;
  const html = emailTemplates.notificacaoGeralAdmins(
    'Proposta Assinada pelo Professor',
    htmlMessage,
    { text: 'Revisar Proposta', url: linkProjeto }
  );

  for (const adminEmail of adminEmails) {
    await sendGenericEmail({
      to: adminEmail,
      subject: `[Monitoria IC] Proposta Assinada: ${data.projetoTitulo}`,
      html,
      tipoNotificacao: 'PROPOSTA_PROFESSOR_ASSINADA_ADMIN',
      projetoId: data.projetoId,
      remetenteUserId: data.remetenteUserId,
    });
  }
}

export async function sendProjetoGeradoParaAssinaturaNotification(
  data: {
    professorEmail: string,
    professorNome: string,
    projetoId: number,
    projetoTitulo: string,
    remetenteUserId?: number;
  }
) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
  const emailPayload: ProjetoStatusChangeData = {
    professorEmail: data.professorEmail,
    professorNome: data.professorNome,
    projetoTitulo: data.projetoTitulo,
    projetoId: data.projetoId,
    novoStatus: 'PENDING_PROFESSOR_SIGNATURE',
    linkProjeto: `${clientUrl}/home/professor/project/${data.projetoId}`,
    remetenteUserId: data.remetenteUserId,
  };
  const html = emailTemplates.projetoStatusChange(emailPayload);
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Projeto Gerado: ${data.projetoTitulo} - Assinatura Necessária`,
    html,
    tipoNotificacao: 'PROJETO_GERADO_ASSINATURA_PROFESSOR',
    projetoId: data.projetoId,
    remetenteUserId: data.remetenteUserId,
  });
}

export async function sendAdminAssinouPropostaNotification(
  data: {
    professorEmail: string;
    professorNome: string;
    projetoTitulo: string;
    projetoId: number;
    novoStatusProjeto: string;
    remetenteUserId?: number;
  }
) {
  const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
  const emailData: ProjetoStatusChangeData = {
    professorEmail: data.professorEmail,
    professorNome: data.professorNome,
    projetoTitulo: data.projetoTitulo,
    projetoId: data.projetoId,
    novoStatus: data.novoStatusProjeto,
    linkProjeto: `${clientUrl}/home/professor/project/${data.projetoId}`,
    feedback: "A proposta foi assinada pelo administrador e o projeto está aprovado.",
    remetenteUserId: data.remetenteUserId,
  };

  const html = emailTemplates.projetoStatusChange(emailData);
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Projeto Aprovado e Assinado: ${data.projetoTitulo}`,
    html,
    tipoNotificacao: 'PROJETO_ADMIN_ASSINOU_PROFESSOR',
    projetoId: data.projetoId,
    remetenteUserId: data.remetenteUserId,
  });
}

export interface StudentSelectionNotificationData extends ProjetoContextData {
  studentName: string;
  studentEmail: string;
  projectTitle: string;
  professorName: string;
  status: 'SELECTED_BOLSISTA' | 'SELECTED_VOLUNTARIO' | 'REJECTED_BY_PROFESSOR';
  linkConfirmacao?: string;
  feedbackProfessor?: string;
}

export async function sendStudentSelectionResultNotification(data: StudentSelectionNotificationData, remetenteUserId?: number) {
  let title = '';
  let message = '';
  let color = '#1976d2';
  let ctaButton = '';

  if (data.status === 'SELECTED_BOLSISTA' || data.status === 'SELECTED_VOLUNTARIO') {
    const tipoVaga = data.status === 'SELECTED_BOLSISTA' ? 'Bolsista' : 'Voluntário';
    title = `🎉 Parabéns! Você foi selecionado(a) para Monitoria (${tipoVaga})`;
    message = `<p>Você foi <strong>SELECIONADO(A)</strong> como <strong>${tipoVaga}</strong> para a monitoria do projeto "<strong>${data.projectTitle}</strong>" com o Prof(a). ${data.professorName}.</p>`;
    message += `<p>Por favor, acesse o sistema para confirmar ou recusar sua participação até [PRAZO_CONFIRMACAO].</p>`;
    if(data.linkConfirmacao) {
      ctaButton = `<a href="${data.linkConfirmacao}" class="action-button">Confirmar/Recusar Vaga</a>`;
    }
    color = '#4caf50';
  } else if (data.status === 'REJECTED_BY_PROFESSOR') {
    title = 'Resultado da Seleção de Monitoria';
    message = `<p>Agradecemos seu interesse na monitoria do projeto "<strong>${data.projectTitle}</strong>".</p>
               <p>Neste momento, você não foi selecionado(a) para esta vaga.</p>`;
    if (data.feedbackProfessor) {
      message += `<div class="info-box"><p><strong>Feedback:</strong><br>${data.feedbackProfessor}</p></div>`;
    }
    message += `<p>Encorajamos você a se candidatar para outras oportunidades.</p>`;
    color = '#f44336';
  }

  const content = `
    <h2>${title}</h2>
    <p>Prezado(a) ${data.studentName},</p>
    ${message}
    ${ctaButton}
  `;

  const html = emailTemplates.baseLayout(title, content, color);
  await sendGenericEmail({
    to: data.studentEmail,
    subject: `[Monitoria IC] Resultado da Seleção: ${data.projectTitle}`,
    html,
    tipoNotificacao: 'RESULTADO_SELECAO_ALUNO',
    projetoId: data.projetoId,
    alunoId: data.alunoId,
    remetenteUserId: remetenteUserId ?? data.remetenteUserId,
  });
}

export async function sendLembreteSubmissaoProjetoPendente(data: LembreteSubmissaoData) {
  const html = emailTemplates.lembreteSubmissaoProjeto(data);
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Lembrete: Submissão de Projeto Pendente - Período ${data.periodoFormatado}`,
    html,
    tipoNotificacao: 'LEMBRETE_SUBMISSAO_PROJETO',
    remetenteUserId: data.remetenteUserId,
  });
}

export async function sendLembreteSelecaoMonitoresPendente(data: LembreteSelecaoData) {
  const html = emailTemplates.lembreteSelecaoMonitores(data);
  await sendGenericEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Lembrete: Seleção de Monitores Pendente - ${data.projetoTitulo}`,
    html,
    tipoNotificacao: 'LEMBRETE_SELECAO_MONITORES',
    projetoId: data.projetoId,
    remetenteUserId: data.remetenteUserId,
  });
}

export async function sendProfessorInvitationEmail(data: ProfessorInvitationEmailServiceData) {
  const clientName = 'Sistema de Monitoria IC';
  const subject = `[${clientName}] Convite para se juntar à plataforma como Professor`;
  const html = getProfessorInvitationEmailHTML({
    professorEmail: data.professorEmail,
    invitationLink: data.invitationLink,
    adminName: data.adminName,
  });

  await sendGenericEmail({
    to: data.professorEmail,
    subject,
    html,
    tipoNotificacao: 'CONVITE_PROFESSOR',
    remetenteUserId: data.remetenteUserId,
  });
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
};
