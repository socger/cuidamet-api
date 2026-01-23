import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from '../../entities/refresh-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createRefreshToken(
    userId: number,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    // Generar token único
    const token = crypto.randomBytes(64).toString('hex');

    // Calcular fecha de expiración
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresAt = new Date();

    // Convertir tiempo de expiración a milisegundos
    const timeMatch = expiresIn.match(/^(\d+)([dhm])$/);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2];

      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
      }
    } else {
      // Por defecto 7 días
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    // Limpiar tokens expirados del usuario
    await this.cleanExpiredTokens(userId);

    // Crear nuevo refresh token
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      deviceInfo,
      ipAddress,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return token;
  }

  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: {
        token,
        isRevoked: false,
      },
      relations: ['user', 'user.roles'],
    });

    if (!refreshToken) {
      return null;
    }

    // Verificar si no ha expirado
    if (refreshToken.expiresAt < new Date()) {
      await this.revokeToken(token);
      return null;
    }

    return refreshToken;
  }

  async revokeToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update({ token }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async cleanExpiredTokens(userId?: number): Promise<void> {
    const whereCondition: any = {
      expiresAt: LessThan(new Date()),
    };

    if (userId) {
      whereCondition.userId = userId;
    }

    await this.refreshTokenRepository.delete(whereCondition);
  }

  async getUserActiveTokens(userId: number): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
        expiresAt: LessThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
