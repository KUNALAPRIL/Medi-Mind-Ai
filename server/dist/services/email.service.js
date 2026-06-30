"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const environment_1 = __importDefault(require("../config/environment"));
const logger_1 = __importDefault(require("../config/logger"));
class EmailService {
    transporter = null;
    constructor() {
        if (environment_1.default.SMTP_HOST && environment_1.default.SMTP_USER && environment_1.default.SMTP_PASS) {
            this.transporter = nodemailer_1.default.createTransport({
                host: environment_1.default.SMTP_HOST,
                port: environment_1.default.SMTP_PORT || 587,
                secure: environment_1.default.SMTP_PORT === 465,
                auth: {
                    user: environment_1.default.SMTP_USER,
                    pass: environment_1.default.SMTP_PASS,
                },
            });
        }
    }
    async sendVerificationEmail(email, token) {
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
        }
        else {
            logger_1.default.info(`[MOCK EMAIL] To: ${email} | Subject: ${subject} | Token: ${token} | Url: ${verificationUrl}`);
        }
    }
    async sendPasswordResetEmail(email, token) {
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
        }
        else {
            logger_1.default.info(`[MOCK EMAIL] To: ${email} | Subject: ${subject} | Token: ${token} | Url: ${resetUrl}`);
        }
    }
}
exports.emailService = new EmailService();
exports.default = exports.emailService;
