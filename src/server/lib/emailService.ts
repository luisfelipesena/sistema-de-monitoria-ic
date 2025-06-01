import { env } from '@/utils/env';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

export interface ProjetoEmailData {
  professorNome: string;
  projetoTitulo: string;
  projetoId: number;
  departamento: string;
  semestre: string;
  baseUrl: string;
}

export interface NotificationEmailData {
  studentName: string;
  projectTitle: string;
  professorName: string;
  status: 'approved' | 'rejected';
  department: string;
}

export interface ProjetoSubmissionEmailData {
  professorNome: string;
  projetoTitulo: string;
  projetoId: number;
  departamento: string;
  semestre: string;
  ano: number;
}

export interface ProjetoApprovalStatusEmailData {
  professorNome: string;
  professorEmail: string;
  projetoTitulo: string;
  projetoId: number;
  status: 'APPROVED' | 'REJECTED';
  bolsasDisponibilizadas?: number;
  feedbackAdmin?: string;
}


export async function sendProjetoApprovalNotification(data: ProjetoEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { color: #22c55e; font-size: 24px; font-weight: bold; }
            .content { line-height: 1.6; color: #333; }
            .success-box { background: #dcfce7; border: 1px solid #22c55e; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .project-info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓 Sistema de Monitoria IC - UFBA</div>
            </div>
            
            <div class="content">
                <div class="success-box">
                    <h2>✅ Projeto Aprovado!</h2>
                </div>
                
                <p>Olá, <strong>${data.professorNome}</strong>,</p>
                
                <p>Temos o prazer de informar que seu projeto de monitoria foi <strong>aprovado</strong>!</p>
                
                <div class="project-info">
                    <h3>📋 Projeto Aprovado</h3>
                    <p><strong>Título:</strong> ${data.projetoTitulo}</p>
                    <p><strong>Departamento:</strong> ${data.departamento}</p>
                    <p><strong>Semestre:</strong> ${data.semestre}</p>
                    <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
                </div>
                
                <p>O próximo passo é aguardar a abertura do edital de seleção de monitores. Você será notificado quando isso acontecer.</p>
                
                <p>Parabéns pelo projeto aprovado!</p>
                
                <p>Atenciosamente,<br>
                <strong>Coordenação de Monitoria IC - UFBA</strong></p>
            </div>
            
            <div class="footer">
                <p>Este é um email automático. Por favor, não responda diretamente a este email.</p>
                <p>Instituto de Computação - Universidade Federal da Bahia</p>
            </div>
        </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.professorNome.includes('@')
      ? data.professorNome
      : `${data.professorNome}@ufba.br`,
    subject: `[Monitoria IC] ✅ Projeto Aprovado - ${data.projetoTitulo}`,
    html,
  });
}

export async function sendStudentSelectionNotification(
  data: NotificationEmailData,
) {
  const isApproved = data.status === 'approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusIcon = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'SELECIONADO' : 'NÃO SELECIONADO';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid ${statusColor}; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { color: ${statusColor}; font-size: 24px; font-weight: bold; }
            .content { line-height: 1.6; color: #333; }
            .status-box { background: ${isApproved ? '#dcfce7' : '#fef2f2'}; border: 1px solid ${statusColor}; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }
            .project-info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓 Sistema de Monitoria IC - UFBA</div>
            </div>
            
            <div class="content">
                <div class="status-box">
                    <h2>${statusIcon} ${statusText}</h2>
                </div>
                
                <p>Olá, <strong>${data.studentName}</strong>,</p>
                
                <p>Informamos o resultado da sua inscrição no processo seletivo de monitoria:</p>
                
                <div class="project-info">
                    <h3>📋 Informações da Monitoria</h3>
                    <p><strong>Projeto:</strong> ${data.projectTitle}</p>
                    <p><strong>Professor:</strong> ${data.professorName}</p>
                    <p><strong>Departamento:</strong> ${data.department}</p>
                </div>
                
                ${
                  isApproved
                    ? `<p><strong>Parabéns!</strong> Você foi selecionado(a) para a monitoria. Aguarde contato do professor responsável com as próximas instruções.</p>`
                    : `<p>Infelizmente, você não foi selecionado(a) para esta monitoria. Continue se candidatando a outras oportunidades!</p>`
                }
                
                <p>Atenciosamente,<br>
                <strong>Coordenação de Monitoria IC - UFBA</strong></p>
            </div>
            
            <div class="footer">
                <p>Este é um email automático. Por favor, não responda diretamente a este email.</p>
                <p>Instituto de Computação - Universidade Federal da Bahia</p>
            </div>
        </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.studentName.includes('@')
      ? data.studentName
      : `${data.studentName}@ufba.br`,
    subject: `[Monitoria IC] ${statusText} - ${data.projectTitle}`,
    html,
  });
}

export async function sendProjetoSubmissionNotification(
  data: ProjetoSubmissionEmailData,
  adminEmails: string[],
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { color: #1976d2; font-size: 24px; font-weight: bold; }
            .content { line-height: 1.6; color: #333; }
            .info-box { background: #e3f2fd; border: 1px solid #1976d2; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .project-info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓 Sistema de Monitoria IC - UFBA</div>
            </div>
            
            <div class="content">
                <div class="info-box">
                    <h2>📋 Novo Projeto Submetido</h2>
                </div>
                
                <p>Prezado(a) Administrador(a),</p>
                
                <p>Um novo projeto de monitoria foi submetido e aguarda sua análise e aprovação.</p>
                
                <div class="project-info">
                    <h3>Detalhes do Projeto</h3>
                    <p><strong>Título:</strong> ${data.projetoTitulo}</p>
                    <p><strong>Professor Responsável:</strong> ${data.professorNome}</p>
                    <p><strong>Departamento:</strong> ${data.departamento}</p>
                    <p><strong>Período:</strong> ${data.ano}.${data.semestre === 'SEMESTRE_1' ? '1' : '2'}</p>
                    <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
                </div>
                
                <p>Por favor, acesse o sistema para revisar e avaliar o projeto.</p>
                
                <p>Atenciosamente,<br>
                <strong>Sistema de Monitoria IC - UFBA</strong></p>
            </div>
            
            <div class="footer">
                <p>Este é um email automático. Por favor, não responda diretamente a este email.</p>
                <p>Instituto de Computação - Universidade Federal da Bahia</p>
            </div>
        </div>
    </body>
    </html>
  `;

  // Send email to all admins
  const emailPromises = adminEmails.map((adminEmail) =>
    sendEmail({
      to: adminEmail,
      subject: `[Monitoria IC] Novo Projeto Submetido - ${data.projetoTitulo}`,
      html,
    }),
  );

  await Promise.all(emailPromises);
}

export async function sendProjetoApprovalStatusNotification(
  data: ProjetoApprovalStatusEmailData,
) {
  const isApproved = data.status === 'APPROVED';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusIcon = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'APROVADO' : 'REJEITADO';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid ${statusColor}; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { color: ${statusColor}; font-size: 24px; font-weight: bold; }
            .content { line-height: 1.6; color: #333; }
            .status-box { background: ${isApproved ? '#dcfce7' : '#fef2f2'}; border: 1px solid ${statusColor}; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }
            .project-info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓 Sistema de Monitoria IC - UFBA</div>
            </div>
            
            <div class="content">
                <div class="status-box">
                    <h2>${statusIcon} Projeto ${statusText}</h2>
                </div>
                
                <p>Caro(a) Professor(a) ${data.professorNome},</p>
                
                <p>Informamos o resultado da análise do seu projeto de monitoria:</p>
                
                <div class="project-info">
                    <h3>📋 Projeto Analisado</h3>
                    <p><strong>Título:</strong> ${data.projetoTitulo}</p>
                    <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
                    ${isApproved && data.bolsasDisponibilizadas !== undefined ? `<p><strong>Bolsas Disponibilizadas:</strong> ${data.bolsasDisponibilizadas}</p>` : ''}
                </div>
                
                ${
                  data.feedbackAdmin
                    ? `<div style="background-color: ${isApproved ? '#e8f5e8' : '#fff3e0'}; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin: 0 0 10px 0;">Observações da Coordenação:</h4>
                        <p style="margin: 0;">${data.feedbackAdmin}</p>
                      </div>`
                    : ''
                }
                
                ${
                  isApproved
                    ? `<p><strong>Parabéns!</strong> Seu projeto foi aprovado. Agora você pode aguardar o período de inscrições dos estudantes e posteriormente realizar o processo de seleção através da plataforma.</p>`
                    : `<p>Infelizmente, seu projeto não foi aprovado neste momento. Por favor, revise as observações acima e, se necessário, você pode submeter uma nova versão do projeto.</p>`
                }
                
                <p>Atenciosamente,<br>
                <strong>Coordenação de Monitoria IC - UFBA</strong></p>
            </div>
            
            <div class="footer">
                <p>Este é um email automático. Por favor, não responda diretamente a este email.</p>
                <p>Instituto de Computação - Universidade Federal da Bahia</p>
            </div>
        </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.professorEmail,
    subject: `[Monitoria IC] Projeto ${statusText} - ${data.projetoTitulo}`,
    html,
  });
}
