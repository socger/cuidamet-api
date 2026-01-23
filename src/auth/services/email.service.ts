import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(private configService: ConfigService) {
    // Configuración del transporter
    this.transporter = createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'localhost'),
      port: this.configService.get<number>('MAIL_PORT', 1025),
      secure: this.configService.get<boolean>('MAIL_SECURE', false),
      auth: this.configService.get<string>('MAIL_USER')
        ? {
            user: this.configService.get<string>('MAIL_USER'),
            pass: this.configService.get<string>('MAIL_PASS'),
          }
        : undefined,
    });

    this.from = this.configService.get<string>(
      'MAIL_FROM',
      'SocgerFleet <noreply@socgerfleet.com>',
    );
  }

  /**
   * Envía email de verificación al usuario
   */
  async sendVerificationEmail(email: string, token: string, username: string) {
    const verificationUrl = `${this.configService.get<string>('APP_URL', 'http://localhost:3000')}/auth/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '✉️ Verifica tu cuenta en SocgerFleet',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">¡Bienvenido a SocgerFleet, ${username}!</h2>
            <p>Gracias por registrarte. Por favor verifica tu cuenta haciendo clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Verificar mi cuenta
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Si no solicitaste esta cuenta, puedes ignorar este email.
            </p>
            <p style="color: #666; font-size: 14px;">
              Este enlace expirará en 24 horas.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              SocgerFleet - Sistema de Gestión de Flotas
            </p>
          </div>
        `,
      });

      this.logger.log(`Email de verificación enviado a ${email}`);
    } catch (error) {
      this.logger.error(
        `Error enviando email de verificación a ${email}:`,
        error,
      );
      throw new Error('No se pudo enviar el email de verificación');
    }
  }

  /**
   * Envía email para resetear contraseña
   */
  async sendPasswordResetEmail(email: string, token: string, username: string) {
    const resetUrl = `${this.configService.get<string>('APP_URL', 'http://localhost:3000')}/auth/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '🔐 Recuperación de contraseña - SocgerFleet',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Recuperación de contraseña</h2>
            <p>Hola ${username},</p>
            <p>Recibimos una solicitud para resetear tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #2196F3; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Resetear mi contraseña
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Si no solicitaste este cambio, puedes ignorar este email de forma segura.
            </p>
            <p style="color: #666; font-size: 14px;">
              Este enlace expirará en 1 hora por seguridad.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              SocgerFleet - Sistema de Gestión de Flotas
            </p>
          </div>
        `,
      });

      this.logger.log(`Email de reset de contraseña enviado a ${email}`);
    } catch (error) {
      this.logger.error(
        `Error enviando email de reset de contraseña a ${email}:`,
        error,
      );
      throw new Error('No se pudo enviar el email de recuperación');
    }
  }

  /**
   * Envía email de confirmación de cambio de contraseña
   */
  async sendPasswordChangedEmail(email: string, username: string) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '🔒 Tu contraseña ha sido cambiada - SocgerFleet',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Contraseña actualizada</h2>
            <p>Hola ${username},</p>
            <p>Te confirmamos que tu contraseña ha sido cambiada exitosamente.</p>
            <p style="color: #666; font-size: 14px;">
              Si no realizaste este cambio, por favor contacta con el soporte inmediatamente.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              SocgerFleet - Sistema de Gestión de Flotas
            </p>
          </div>
        `,
      });

      this.logger.log(
        `Email de confirmación de cambio de contraseña enviado a ${email}`,
      );
    } catch (error) {
      this.logger.error(
        `Error enviando email de confirmación a ${email}:`,
        error,
      );
      // No lanzamos error aquí porque es un email informativo
    }
  }
}
