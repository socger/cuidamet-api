import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../../entities/user.entity';
import { PasswordHistory } from '../../entities/password-history.entity';
import {
  VerificationToken,
  TokenType,
} from '../../entities/verification-token.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { EmailService } from './email.service';

@Injectable()
export class PasswordManagementService {
  private readonly PASSWORD_HISTORY_LIMIT = 5; // Número de contraseñas anteriores a validar
  private readonly VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas
  private readonly RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hora

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PasswordHistory)
    private passwordHistoryRepository: Repository<PasswordHistory>,
    @InjectRepository(VerificationToken)
    private tokenRepository: Repository<VerificationToken>,
    private emailService: EmailService,
  ) {}

  /**
   * Genera un token aleatorio seguro
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Crea un token de verificación
   */
  private async createToken(
    userId: number,
    type: TokenType,
    expiryMs: number,
  ): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + expiryMs);

    // Invalidar tokens anteriores del mismo tipo
    await this.tokenRepository.update(
      { userId, type, isUsed: false },
      { isUsed: true },
    );

    // Crear nuevo token
    const verificationToken = this.tokenRepository.create({
      userId,
      token,
      type,
      expiresAt,
    });

    await this.tokenRepository.save(verificationToken);
    return token;
  }

  /**
   * Valida un token
   */
  private async validateToken(
    token: string,
    type: TokenType,
  ): Promise<VerificationToken> {
    const verificationToken = await this.tokenRepository.findOne({
      where: { token, type },
      relations: ['user'],
    });

    if (!verificationToken) {
      throw new BadRequestException('Token inválido');
    }

    if (verificationToken.isUsed) {
      throw new BadRequestException('El token ya ha sido utilizado');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('El token ha expirado');
    }

    return verificationToken;
  }

  /**
   * Valida que la contraseña no esté en el historial
   */
  private async validatePasswordHistory(
    userId: number,
    newPassword: string,
  ): Promise<void> {
    const history = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: this.PASSWORD_HISTORY_LIMIT,
    });

    for (const entry of history) {
      const isSame = await bcrypt.compare(newPassword, entry.password);
      if (isSame) {
        throw new BadRequestException(
          `No puedes usar una de tus últimas ${this.PASSWORD_HISTORY_LIMIT} contraseñas`,
        );
      }
    }
  }

  /**
   * Guarda la contraseña en el historial
   */
  private async savePasswordHistory(
    userId: number,
    password: string,
  ): Promise<void> {
    const passwordHistory = this.passwordHistoryRepository.create({
      userId,
      password,
    });
    await this.passwordHistoryRepository.save(passwordHistory);

    // Mantener solo las últimas N contraseñas
    const allHistory = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (allHistory.length > this.PASSWORD_HISTORY_LIMIT) {
      const toDelete = allHistory.slice(this.PASSWORD_HISTORY_LIMIT);
      await this.passwordHistoryRepository.remove(toDelete);
    }
  }

  /**
   * Envía email de verificación al registrarse
   */
  async sendVerificationEmail(user: User): Promise<void> {
    const token = await this.createToken(
      user.id,
      TokenType.EMAIL_VERIFICATION,
      this.VERIFICATION_TOKEN_EXPIRY,
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      token,
      user.username,
    );
  }

  /**
   * Verifica el email del usuario
   */
  async verifyEmail(token: string): Promise<void> {
    const verificationToken = await this.validateToken(
      token,
      TokenType.EMAIL_VERIFICATION,
    );

    // Marcar email como verificado
    await this.userRepository.update(
      { id: verificationToken.userId },
      { emailVerified: true },
    );

    // Marcar token como usado
    verificationToken.isUsed = true;
    await this.tokenRepository.save(verificationToken);
  }

  /**
   * Solicita resetear contraseña (envía email)
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Por seguridad, no revelamos si el email existe o no
    if (!user) {
      return;
    }

    if (!user.isActive) {
      return;
    }

    const token = await this.createToken(
      user.id,
      TokenType.PASSWORD_RESET,
      this.RESET_TOKEN_EXPIRY,
    );

    await this.emailService.sendPasswordResetEmail(
      user.email,
      token,
      user.username,
    );
  }

  /**
   * Resetea la contraseña usando el token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const verificationToken = await this.validateToken(
      token,
      TokenType.PASSWORD_RESET,
    );

    // Validar historial de contraseñas
    await this.validatePasswordHistory(verificationToken.userId, newPassword);

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Guardar en historial
    await this.savePasswordHistory(verificationToken.userId, hashedPassword);

    // Actualizar contraseña
    await this.userRepository.update(
      { id: verificationToken.userId },
      { password: hashedPassword },
    );

    // Marcar token como usado
    verificationToken.isUsed = true;
    await this.tokenRepository.save(verificationToken);

    // Invalidar todos los refresh tokens (logout de todos los dispositivos)
    // Esto se hace en el servicio de refresh tokens

    // Enviar email de confirmación
    await this.emailService.sendPasswordChangedEmail(
      verificationToken.user.email,
      verificationToken.user.username,
    );
  }

  /**
   * Cambia la contraseña (usuario autenticado)
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Validar que no sea la misma contraseña
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'La nueva contraseña no puede ser igual a la actual',
      );
    }

    // Validar historial de contraseñas
    await this.validatePasswordHistory(userId, newPassword);

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Guardar en historial
    await this.savePasswordHistory(userId, hashedPassword);

    // Actualizar contraseña
    await this.userRepository.update(
      { id: userId },
      { password: hashedPassword },
    );

    // Enviar email de confirmación
    await this.emailService.sendPasswordChangedEmail(user.email, user.username);
  }

  /**
   * Limpia tokens expirados (puede ejecutarse como un cron job)
   */
  async cleanExpiredTokens(): Promise<void> {
    await this.tokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
