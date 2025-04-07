import { emailService } from '../../lib/email';
import {
  createApplicationResultEmail,
  createProjectNotificationEmail,
  createTestEmail,
} from '../../lib/emailTemplates';

/**
 * Send a test email to verify the email service is working correctly
 */
export const sendTestEmail = async (to: string, name: string) => {
  const html = createTestEmail(name);

  return await emailService.sendEmail({
    to,
    subject: 'Teste do Sistema de Monitoria IC',
    html,
  });
};

/**
 * Send a project notification email to inform about project creation or status change
 */
export const sendProjectNotificationEmail = async (
  to: string,
  options: {
    recipientName: string;
    projectTitle: string;
    professorName: string;
    disciplineName: string;
    actionUrl?: string;
  },
) => {
  const html = createProjectNotificationEmail(options);

  return await emailService.sendEmail({
    to,
    subject: 'Notificação de Projeto de Monitoria',
    html,
  });
};

/**
 * Send an application result email to notify students about selection results
 */
export const sendApplicationResultEmail = async (
  to: string,
  options: {
    recipientName: string;
    projectTitle: string;
    status: 'selected' | 'rejected';
    vacancyType?: 'bolsista' | 'voluntario';
    acceptanceDeadline?: string;
    actionUrl?: string;
  },
) => {
  const html = createApplicationResultEmail(options);
  const subject =
    options.status === 'selected'
      ? 'Seleção para Monitoria - Você foi selecionado(a)!'
      : 'Seleção para Monitoria - Resultado';

  return await emailService.sendEmail({
    to,
    subject,
    html,
  });
};

/**
 * Bulk send application result emails to multiple recipients
 */
export const sendBulkApplicationResultEmails = async (
  applications: Array<{
    email: string;
    name: string;
    projectTitle: string;
    status: 'selected' | 'rejected';
    vacancyType?: 'bolsista' | 'voluntario';
    acceptanceDeadline?: string;
    actionUrl?: string;
  }>,
) => {
  const results = await Promise.all(
    applications.map((app) =>
      sendApplicationResultEmail(app.email, {
        recipientName: app.name,
        projectTitle: app.projectTitle,
        status: app.status,
        vacancyType: app.vacancyType,
        acceptanceDeadline: app.acceptanceDeadline,
        actionUrl: app.actionUrl,
      }),
    ),
  );

  return results;
};
