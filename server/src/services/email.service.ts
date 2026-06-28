import nodemailer from 'nodemailer';
import env from '../config/environment';
import logger from '../config/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  public async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `http://localhost:5173/verify-email?token=${token}`;
    const subject = 'Verify your MediMind AI Account';
    const text = `Please verify your account by clicking this link: ${verificationUrl}`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: '"MediMind AI" <noreply@medimind.ai>',
        to: email,
        subject,
        text,
      });
    } else {
      logger.info(`[MOCK EMAIL] To: ${email} | Subject: ${subject} | Token: ${token} | Url: ${verificationUrl}`);
    }
  }

  public async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
    const subject = 'Reset your MediMind AI Password';
    const text = `Reset your password by clicking this link: ${resetUrl}`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: '"MediMind AI" <noreply@medimind.ai>',
        to: email,
        subject,
        text,
      });
    } else {
      logger.info(`[MOCK EMAIL] To: ${email} | Subject: ${subject} | Token: ${token} | Url: ${resetUrl}`);
    }
  }
}

export const emailService = new EmailService();
export default emailService;
