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

export async function sendProjetoReminderEmail(data: ProjetoEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid #1B2A50; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { color: #1B2A50; font-size: 24px; font-weight: bold; }
            .content { line-height: 1.6; color: #333; }
            .button { display: inline-block; background: #1B2A50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
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
                <h2>Lembrete: Assinatura de Projeto de Monitoria Pendente</h2>
                
                <p>Olá, <strong>${data.professorNome}</strong>,</p>
                
                <p>Este é um lembrete de que o seu projeto de monitoria está aguardando assinatura:</p>
                
                <div class="project-info">
                    <h3>📋 Informações do Projeto</h3>
                    <p><strong>Título:</strong> ${data.projetoTitulo}</p>
                    <p><strong>Departamento:</strong> ${data.departamento}</p>
                    <p><strong>Semestre:</strong> ${data.semestre}</p>
                    <p><strong>ID do Projeto:</strong> #${data.projetoId}</p>
                </div>
                
                <p>Para dar continuidade ao processo, acesse o sistema e complete a assinatura do documento:</p>
                
                <a href="${data.baseUrl}/home/professor/pending-signatures" class="button">
                    ✍️ Acessar Sistema de Assinaturas
                </a>
                
                <p><strong>Importante:</strong> A assinatura é necessária para que o projeto possa ser submetido para aprovação final.</p>
                
                <p>Se você tiver dúvidas, entre em contato com a coordenação.</p>
                
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

  await sendEmail({
    to: data.professorNome.includes('@')
      ? data.professorNome
      : `${data.professorNome}@ufba.br`,
    subject: `[Monitoria IC] Lembrete: Assinatura Pendente - ${data.projetoTitulo}`,
    html,
  });
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
