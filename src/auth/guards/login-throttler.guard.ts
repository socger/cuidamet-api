import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { LoginAttempt } from '../../entities/login-attempt.entity';

/**
 * Guard que implementa throttling avanzado para el endpoint de login
 *
 * Reglas implementadas:
 * - Máximo 5 intentos fallidos por IP en 15 minutos
 * - Máximo 3 intentos fallidos por username/email en 15 minutos
 * - Bloqueo progresivo: 5 min, 15 min, 30 min, 1 hora, 24 horas
 * - Después de 3 bloqueos en 24 horas: bloqueo de 24 horas
 */
@Injectable()
export class LoginThrottlerGuard implements CanActivate {
  // Configuración de throttling
  private readonly MAX_ATTEMPTS_BY_IP = 5;
  private readonly MAX_ATTEMPTS_BY_IDENTIFIER = 3;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutos

  // Bloqueos progresivos en minutos
  private readonly BLOCK_DURATIONS = [5, 15, 30, 60, 1440]; // última es 24 horas

  constructor(
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ipAddress = this.getIpAddress(request);
    const identifier = request.body?.email || request.body?.username;

    console.log(`[LoginThrottler] IP: ${ipAddress}, Identifier: ${identifier}`);

    // Verificar si hay bloqueo activo
    const blockInfo = await this.checkIfBlocked(ipAddress, identifier);
    if (blockInfo.isBlocked) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: blockInfo.message,
          blockedUntil: blockInfo.blockedUntil,
          remainingTime: blockInfo.remainingTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verificar intentos recientes por IP
    const recentAttemptsByIp = await this.getRecentFailedAttempts(
      ipAddress,
      null,
    );
    console.log(
      `[LoginThrottler] Intentos por IP: ${recentAttemptsByIp}/${this.MAX_ATTEMPTS_BY_IP}`,
    );

    if (recentAttemptsByIp >= this.MAX_ATTEMPTS_BY_IP) {
      const blockDuration = this.calculateBlockDuration(recentAttemptsByIp);
      await this.createBlock(ipAddress, identifier, blockDuration);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Demasiados intentos de login desde esta IP. Bloqueado por ${blockDuration} minutos.`,
          blockedUntil: new Date(Date.now() + blockDuration * 60 * 1000),
          remainingTime: `${blockDuration} minutos`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verificar intentos recientes por identificador (email/username)
    if (identifier) {
      const recentAttemptsByIdentifier = await this.getRecentFailedAttempts(
        null,
        identifier,
      );
      if (recentAttemptsByIdentifier >= this.MAX_ATTEMPTS_BY_IDENTIFIER) {
        const blockDuration = this.calculateBlockDuration(
          recentAttemptsByIdentifier,
        );
        await this.createBlock(ipAddress, identifier, blockDuration);

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Demasiados intentos fallidos para este usuario. Bloqueado por ${blockDuration} minutos.`,
            blockedUntil: new Date(Date.now() + blockDuration * 60 * 1000),
            remainingTime: `${blockDuration} minutos`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }

  /**
   * Obtiene la dirección IP del request (maneja proxies)
   */
  private getIpAddress(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip
    );
  }

  /**
   * Verifica si hay un bloqueo activo
   */
  private async checkIfBlocked(
    ipAddress: string,
    identifier: string,
  ): Promise<{
    isBlocked: boolean;
    message?: string;
    blockedUntil?: Date;
    remainingTime?: string;
  }> {
    const now = new Date();

    // Buscar bloqueos activos
    const activeBlocks = await this.loginAttemptRepository.find({
      where: [
        { ipAddress, blockedUntil: MoreThan(now) },
        ...(identifier ? [{ identifier, blockedUntil: MoreThan(now) }] : []),
      ],
      order: { blockedUntil: 'DESC' },
      take: 1,
    });

    if (activeBlocks.length > 0) {
      const block = activeBlocks[0];
      const remainingMs = block.blockedUntil.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      return {
        isBlocked: true,
        message: `Tu cuenta o IP está temporalmente bloqueada. Intenta nuevamente en ${remainingMinutes} minutos.`,
        blockedUntil: block.blockedUntil,
        remainingTime: `${remainingMinutes} minutos`,
      };
    }

    return { isBlocked: false };
  }

  /**
   * Obtiene el número de intentos fallidos recientes
   */
  private async getRecentFailedAttempts(
    ipAddress: string | null,
    identifier: string | null,
  ): Promise<number> {
    const windowStart = new Date(Date.now() - this.WINDOW_MS);

    const query = this.loginAttemptRepository
      .createQueryBuilder('attempt')
      .where('attempt.isSuccessful = :isSuccessful', { isSuccessful: 0 })
      .andWhere('attempt.createdAt > :windowStart', { windowStart });

    if (ipAddress) {
      query.andWhere('attempt.ipAddress = :ipAddress', { ipAddress });
    }
    if (identifier) {
      query.andWhere('attempt.identifier = :identifier', { identifier });
    }

    return await query.getCount();
  }

  /**
   * Calcula la duración del bloqueo basándose en intentos previos
   * Bloqueo progresivo: más intentos = más tiempo bloqueado
   */
  private calculateBlockDuration(attemptCount: number): number {
    const index = Math.min(
      Math.floor((attemptCount - this.MAX_ATTEMPTS_BY_IP) / 2),
      this.BLOCK_DURATIONS.length - 1,
    );
    return this.BLOCK_DURATIONS[Math.max(0, index)];
  }

  /**
   * Crea un registro de bloqueo
   */
  private async createBlock(
    ipAddress: string,
    identifier: string,
    durationMinutes: number,
  ): Promise<void> {
    const blockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    await this.loginAttemptRepository.save({
      ipAddress,
      identifier: identifier || 'unknown',
      isSuccessful: false,
      failureReason: `Bloqueado por ${durationMinutes} minutos debido a demasiados intentos fallidos`,
      blockedUntil,
      userAgent: null,
    });
  }
}
