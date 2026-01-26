import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshTokenService } from './services/refresh-token.service';
import { EmailService } from './services/email.service';
import { PasswordManagementService } from './services/password-management.service';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { ClientProfilesModule } from '../client-profiles/client-profiles.module';
import { ProviderProfilesModule } from '../provider-profiles/provider-profiles.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshToken } from '../entities/refresh-token.entity';
import { PasswordHistory } from '../entities/password-history.entity';
import { VerificationToken } from '../entities/verification-token.entity';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RefreshToken,
      PasswordHistory,
      VerificationToken,
      LoginAttempt,
      User,
    ]),
    UsersModule,
    RolesModule,
    forwardRef(() => ClientProfilesModule),
    forwardRef(() => ProviderProfilesModule),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    RefreshTokenService,
    EmailService,
    PasswordManagementService,
    LoginThrottlerGuard,
    LocalStrategy,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, RefreshTokenService, PasswordManagementService],
})
export class AuthModule {}
