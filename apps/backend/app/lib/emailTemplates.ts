/**
 * Email template utilities for the monitoria system
 */

type ProjectNotificationOptions = {
  recipientName: string;
  projectTitle: string;
  professorName: string;
  disciplineName: string;
  actionUrl?: string;
};

type ApplicationResultOptions = {
  recipientName: string;
  projectTitle: string;
  status: 'selected' | 'rejected';
  vacancyType?: 'bolsista' | 'voluntario';
  acceptanceDeadline?: string;
  actionUrl?: string;
};

/**
 * Creates an HTML email with consistent styling
 */
export const createEmailLayout = (content: string, title?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'Monitoria IC - UFBA'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #0f4c81;
            color: white;
            padding: 15px 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .footer {
            font-size: 12px;
            text-align: center;
            color: #666;
            padding: 15px;
            border-top: 1px solid #ddd;
          }
          .button {
            display: inline-block;
            background-color: #0f4c81;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title || 'Monitoria IC - UFBA'}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda diretamente a este email.</p>
            <p>© ${new Date().getFullYear()} Departamento de Ciência da Computação - UFBA</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Creates an email for project status notification
 */
export const createProjectNotificationEmail = ({
  recipientName,
  projectTitle,
  professorName,
  disciplineName,
  actionUrl,
}: ProjectNotificationOptions): string => {
  const content = `
    <h2>Notificação de Projeto de Monitoria</h2>
    <p>Olá, ${recipientName}!</p>
    <p>O projeto de monitoria <strong>${projectTitle}</strong> para a disciplina <strong>${disciplineName}</strong>, 
    sob responsabilidade de <strong>${professorName}</strong>, foi registrado no sistema.</p>
    <p>Você pode acompanhar o status do projeto através do sistema de monitoria.</p>
    ${actionUrl ? `<a href="${actionUrl}" class="button">Acessar o Sistema</a>` : ''}
    <p>Atenciosamente,<br>Coordenação de Monitoria</p>
  `;

  return createEmailLayout(content, 'Notificação de Projeto de Monitoria');
};

/**
 * Creates an email for application results notification
 */
export const createApplicationResultEmail = ({
  recipientName,
  projectTitle,
  status,
  vacancyType,
  acceptanceDeadline,
  actionUrl,
}: ApplicationResultOptions): string => {
  let statusMessage = '';
  let title = '';

  if (status === 'selected') {
    title = 'Seleção para Monitoria - Resultado';
    statusMessage = `
      <p>Parabéns! Você foi <strong>selecionado(a)</strong> para o projeto de monitoria 
      <strong>${projectTitle}</strong> como monitor ${vacancyType === 'bolsista' ? 'bolsista' : 'voluntário'}.</p>
      ${acceptanceDeadline ? `<p>Você tem até <strong>${acceptanceDeadline}</strong> para aceitar ou recusar esta vaga.</p>` : ''}
    `;
  } else {
    title = 'Seleção para Monitoria - Resultado';
    statusMessage = `
      <p>Informamos que, após o processo seletivo, você <strong>não foi selecionado(a)</strong> 
      para o projeto de monitoria <strong>${projectTitle}</strong>.</p>
      <p>Agradecemos seu interesse e incentivamos sua participação em futuras seleções.</p>
    `;
  }

  const content = `
    <h2>${title}</h2>
    <p>Olá, ${recipientName}!</p>
    ${statusMessage}
    ${actionUrl && status === 'selected' ? `<a href="${actionUrl}" class="button">Responder</a>` : ''}
    <p>Atenciosamente,<br>Coordenação de Monitoria</p>
  `;

  return createEmailLayout(content, title);
};

/**
 * Creates a simple text email for testing purposes
 */
export const createTestEmail = (recipientName: string): string => {
  const content = `
    <h2>Email de Teste</h2>
    <p>Olá, ${recipientName}!</p>
    <p>Este é um email de teste do sistema de monitoria.</p>
    <p>Se você está recebendo este email, significa que a configuração do serviço de email está funcionando corretamente.</p>
  `;

  return createEmailLayout(content, 'Teste de Email');
};
