import { env } from '@/utils/env';

interface ProfessorInvitationEmailData {
  professorEmail: string;
  invitationLink: string;
  adminName?: string; // Optional: name of the admin sending the invite
}

export function getProfessorInvitationEmailHTML(data: ProfessorInvitationEmailData): string {
  const clientName = 'Sistema de Monitoria IC'; // Using a hardcoded name
  const adminDisplayName = data.adminName || 'a Administração do ' + clientName;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Convite para ${clientName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .header h1 {
          color: #0056b3; /* Azul UFBA */
          margin: 0;
        }
        .content p {
          margin-bottom: 15px;
        }
        .button {
          display: inline-block;
          padding: 12px 25px;
          margin: 20px 0;
          background-color: #007bff; /* Azul Botão */
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          font-size: 16px;
        }
        .footer {
          text-align: center;
          font-size: 0.9em;
          color: #777;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Convite para ${clientName}</h1>
        </div>
        <div class="content">
          <p>Olá,</p>
          <p>
            Você foi convidado por ${adminDisplayName} para se juntar à plataforma ${clientName} como professor.
          </p>
          <p>
            Para aceitar o convite e configurar sua conta, por favor, clique no link abaixo:
          </p>
          <p style="text-align: center;">
            <a href="${data.invitationLink}" class="button">Aceitar Convite</a>
          </p>
          <p>
            Se você não estava esperando este convite, por favor, ignore este email.
          </p>
          <p>O link de convite é válido por 7 dias.</p>
          <p>Atenciosamente,<br>Equipe do ${clientName}</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${clientName}. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 