import {
  Controller,
  Post,
  UseGuards,
  Body,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Req,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

// Interfaz para el request con usuario autenticado
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    username: string;
    roles: any[];
  };
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Throttling avanzado con guard personalizado
  @UseGuards(LoginThrottlerGuard)
  // Rate limiting básico de respaldo: 10 intentos por minuto
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autenticar usuario con email y contraseña. Retorna access token (15 min) y refresh token (7 días). ' +
      'Sistema de throttling avanzado: máximo 5 intentos por IP y 3 por usuario en 15 minutos. ' +
      'Bloqueos progresivos: 5min, 15min, 30min, 1h, 24h.',
  })
  @ApiHeader({
    name: 'user-agent',
    required: true,
    description: 'User agent del navegador (requerido para identificar el dispositivo)',
    schema: {
      example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        message: 'Login exitoso',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@cuidamet.com',
          roles: ['admin'],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos - IP o usuario bloqueado temporalmente',
    schema: {
      example: {
        statusCode: 429,
        message:
          'Demasiados intentos de login desde esta IP. Bloqueado por 5 minutos.',
        blockedUntil: '2026-01-19T10:35:00.000Z',
        remainingTime: '5 minutos',
      },
    },
  })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ) {
    if (!userAgent) {
      throw new BadRequestException(
        'Header user-agent es requerido. Ejemplos de valores válidos: SwaggerUI/1.0, PostmanRuntime/7.39.0, Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0, MyApp/1.0 (Linux)',
      );
    }
    return this.authService.login(loginDto, userAgent, ipAddress);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  // Rate limiting para registro: 3 intentos por minuto
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description:
      'Crear una nueva cuenta de usuario. El email y username deben ser únicos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    schema: {
      example: {
        message: 'Usuario registrado exitosamente',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 2,
          username: 'johndoe',
          email: 'johndoe@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email o username ya registrado',
  })
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ) {
    return this.authService.register(registerDto, userAgent, ipAddress);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  // Rate limiting para refresh token: 10 intentos por minuto
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Renovar access token',
    description:
      'Obtener un nuevo access token usando el refresh token. El refresh token se rota automáticamente por seguridad.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado exitosamente',
    schema: {
      example: {
        message: 'Token renovado exitosamente',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  async refresh(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    return {
      message: 'Token renovado exitosamente',
      ...(await this.authService.refreshAccessToken(refreshTokenDto)),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Cerrar sesión del dispositivo actual revocando el refresh token específico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout exitoso',
    schema: {
      example: {
        message: 'Logout exitoso',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido',
  })
  async logout(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return {
      message: 'Logout exitoso',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar todas las sesiones',
    description:
      'Cerrar sesión en todos los dispositivos revocando todos los refresh tokens del usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout masivo exitoso',
    schema: {
      example: {
        message: 'Logout de todos los dispositivos exitoso',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async logoutAll(@Req() req: AuthenticatedRequest) {
    await this.authService.logoutAll(req.user.id);
    return {
      message: 'Logout de todos los dispositivos exitoso',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: 'Obtener información del usuario autenticado actualmente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
    schema: {
      example: {
        message: 'Perfil obtenido exitosamente',
        user: {
          id: 1,
          email: 'admin@socgerfleet.com',
          username: 'admin',
          roles: ['admin'],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    // Obtener el usuario completo con todos sus perfiles y relaciones
    const userWithProfiles = await this.usersService.findOneWithProfiles(
      req.user.id,
    );

    return {
      message: 'Perfil obtenido exitosamente',
      user: userWithProfiles,
    };
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  // Rate limiting para solicitud de reset: 3 intentos por 15 minutos
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description:
      'Envía un email con un token para resetear la contraseña. Por seguridad, siempre retorna éxito aunque el email no exista.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperación enviado (si el usuario existe)',
    schema: {
      example: {
        message:
          'Si el email existe, recibirás un enlace de recuperación en breve',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Email inválido' })
  async requestPasswordReset(
    @Body(ValidationPipe) dto: RequestPasswordResetDto,
  ) {
    await this.authService.requestPasswordReset(dto.email);
    return {
      message:
        'Si el email existe, recibirás un enlace de recuperación en breve',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  // Rate limiting para resetear contraseña: 3 intentos por 15 minutos
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @ApiOperation({
    summary: 'Resetear contraseña con token',
    description:
      'Establece una nueva contraseña usando el token recibido por email. La contraseña no puede ser una de las últimas 5 utilizadas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña reseteada exitosamente',
    schema: {
      example: {
        message: 'Contraseña reseteada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido, expirado o contraseña en el historial',
  })
  async resetPassword(@Body(ValidationPipe) dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return {
      message: 'Contraseña reseteada exitosamente',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cambiar contraseña (usuario autenticado)',
    description:
      'Permite al usuario cambiar su contraseña proporcionando la actual. La nueva contraseña no puede ser igual a la actual ni estar en el historial de las últimas 5.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    schema: {
      example: {
        message: 'Contraseña cambiada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Contraseña actual incorrecta o nueva contraseña inválida',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body(ValidationPipe) dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return {
      message: 'Contraseña cambiada exitosamente',
    };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar email del usuario',
    description:
      'Verifica la dirección de email del usuario usando el token recibido por email tras el registro.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verificado exitosamente',
    schema: {
      example: {
        message: 'Email verificado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido, expirado o ya utilizado',
  })
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      return {
        message: 'Token es requerido',
        status: 400,
      };
    }
    await this.authService.verifyEmail(token);
    return {
      message: 'Email verificado exitosamente',
    };
  }
}
