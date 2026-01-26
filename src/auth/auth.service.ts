import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { ClientProfilesService } from '../client-profiles/client-profiles.service';
import { ProviderProfilesService } from '../provider-profiles/provider-profiles.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { PasswordManagementService } from './services/password-management.service';
import { LoginAttempt } from '../entities/login-attempt.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: any[];
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    @Inject(forwardRef(() => ClientProfilesService))
    private clientProfilesService: ClientProfilesService,
    @Inject(forwardRef(() => ProviderProfilesService))
    private providerProfilesService: ProviderProfilesService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private refreshTokenService: RefreshTokenService,
    private passwordManagementService: PasswordManagementService,
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  private generateAccessToken(user: any): string {
    const payload = {
      email: user.email,
      sub: user.id,
      username: user.username,
      roles: user.roles,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });
  }

  async login(
    loginDto: LoginDto,
    deviceInfo: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const identifier = loginDto.email;

    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);

      if (!user) {
        // Registrar intento fallido
        await this.recordLoginAttempt(
          identifier,
          ipAddress,
          deviceInfo,
          false,
          'Credenciales inválidas',
        );
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (!user.isActive) {
        // Registrar intento fallido
        await this.recordLoginAttempt(
          identifier,
          ipAddress,
          deviceInfo,
          false,
          'Cuenta desactivada',
        );
        throw new UnauthorizedException('Cuenta desactivada');
      }

      // Generar tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.refreshTokenService.createRefreshToken(
        user.id,
        deviceInfo,
        ipAddress,
      );

      // Registrar intento exitoso
      await this.recordLoginAttempt(
        identifier,
        ipAddress,
        deviceInfo,
        true,
        null,
      );

      return {
        message: 'Login exitoso',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
      };
    } catch (error) {
      // Si no se ha registrado el intento, registrarlo como fallido
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      await this.recordLoginAttempt(
        identifier,
        ipAddress,
        deviceInfo,
        false,
        'Error interno',
      );
      throw error;
    }
  }

  async register(
    registerDto: RegisterDto,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    // Verificar si el usuario ya existe
    const existingUserByEmail = await this.usersService.findByEmail(
      registerDto.email,
    );
    if (existingUserByEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    const existingUserByUsername = await this.usersService.findByUsername(
      registerDto.username,
    );
    if (existingUserByUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // Obtener rol por defecto
    let defaultRole = await this.rolesService.findByName('user');
    if (!defaultRole) {
      defaultRole = await this.rolesService.create({
        name: 'user',
        description: 'Usuario básico del sistema',
      });
    }

    // Crear el usuario CON EL ROL incluido en la creación
    const createUserDto = {
      ...registerDto,
      roleIds: [defaultRole.id], // Incluir rol en la creación inicial
    };

    const user = await this.usersService.create(createUserDto);

    // NO NECESITAMOS assignRole aquí porque ya se asigna en create()
    // Obtener el usuario con roles para estar seguros
    const userWithRoles = await this.usersService.findOne(user.id);

    // Enviar email de verificación (no bloqueante - si falla, no afecta el registro)
    try {
      await this.passwordManagementService.sendVerificationEmail(userWithRoles);
    } catch (error) {
      // Log del error pero no bloquear el registro
      this.logger.warn(`Error al enviar email de verificación: ${error.message}`);
    }

    // Crear perfil básico automáticamente con los datos del usuario
    try {
      const fullName = [registerDto.firstName, registerDto.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || registerDto.username;

      // Por defecto, crear un perfil de cliente (familiar)
      // El usuario puede crear un perfil de proveedor más tarde si lo desea
      await this.clientProfilesService.create({
        userId: userWithRoles.id,
        name: fullName,
        location: 'Por configurar', // Valor temporal hasta que el usuario lo actualice
        profileStatus: 'draft', // Estado borrador hasta que complete su perfil
        // Campos opcionales se pueden agregar después
      }, userWithRoles.id);

      this.logger.log(`Perfil de cliente creado automáticamente para usuario ${userWithRoles.id}`);
    } catch (error) {
      // Log del error pero no bloquear el registro
      // El perfil se puede crear manualmente después si falla
      this.logger.warn(`Error al crear perfil automático: ${error.message}`);
    }

    // Generar tokens
    const accessToken = this.generateAccessToken(userWithRoles);
    const refreshToken = await this.refreshTokenService.createRefreshToken(
      userWithRoles.id,
      deviceInfo,
      ipAddress,
    );

    return {
      message: 'Usuario registrado exitosamente',
      accessToken,
      refreshToken,
      user: {
        id: userWithRoles.id,
        username: userWithRoles.username,
        email: userWithRoles.email,
        firstName: userWithRoles.firstName,
        lastName: userWithRoles.lastName,
        roles: userWithRoles.roles,
      },
    };
  }

  async refreshAccessToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshTokenEntity =
      await this.refreshTokenService.validateRefreshToken(
        refreshTokenDto.refreshToken,
      );

    if (!refreshTokenEntity) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Generar nuevo access token
    const accessToken = this.generateAccessToken(refreshTokenEntity.user);

    // Opcionalmente, generar nuevo refresh token (rotación)
    const newRefreshToken = await this.refreshTokenService.createRefreshToken(
      refreshTokenEntity.userId,
      refreshTokenEntity.deviceInfo,
      refreshTokenEntity.ipAddress,
    );

    // Revocar el refresh token anterior
    await this.refreshTokenService.revokeToken(refreshTokenDto.refreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revokeToken(refreshToken);
  }

  async logoutAll(userId: number): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.passwordManagementService.requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.passwordManagementService.resetPassword(token, newPassword);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.passwordManagementService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
  }

  async verifyEmail(token: string): Promise<void> {
    await this.passwordManagementService.verifyEmail(token);
  }

  /**
   * Registra un intento de login (exitoso o fallido)
   * para el sistema de throttling
   */
  private async recordLoginAttempt(
    identifier: string,
    ipAddress: string,
    userAgent: string,
    isSuccessful: boolean,
    failureReason: string | null,
  ): Promise<void> {
    try {
      await this.loginAttemptRepository.save({
        identifier: identifier || 'unknown',
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || null,
        isSuccessful,
        failureReason,
      });
    } catch (error) {
      // Log error pero no fallar el login si hay problema guardando el intento
      console.error('Error registrando intento de login:', error);
    }
  }

  /**
   * Limpia intentos de login antiguos (útil para mantenimiento)
   * Elimina registros más antiguos de 30 días
   */
  async cleanOldLoginAttempts(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.loginAttemptRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :date', { date: thirtyDaysAgo })
      .execute();

    return result.affected || 0;
  }
}
