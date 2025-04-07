import { Resend } from 'resend';
import { env } from '../config/env';

export type EmailPayload = {
  to: string[] | string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
  cc?: string[] | string;
  bcc?: string[] | string;
  replyTo?: string;
};

export class EmailService {
  private resend: Resend;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.resend = new Resend(apiKey);
    this.defaultFrom = defaultFrom;
  }

  async sendEmail(payload: EmailPayload) {
    try {
      const { from = this.defaultFrom, ...rest } = payload;

      const response = await this.resend.emails.send({
        from,
        ...rest,
      });

      return { success: true, data: response };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }
  }
}

// Factory function to create an email service instance
export const createEmailService = () => {
  const apiKey = env.RESEND_API_KEY ?? '';
  const defaultFrom =
    env.EMAIL_FROM || 'Monitoria IC <noreply@monitoria.ic.ufba.br>';

  return new EmailService(apiKey, defaultFrom);
};

// Singleton instance for use throughout the application
export const emailService = createEmailService();
