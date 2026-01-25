/**
 * ⚠️ INSTRUCCIÓN CRÍTICA PARA ASISTENTES DE IA
 * 
 * DOCUMENTACIÓN OBLIGATORIA A LEER ANTES DE CUALQUIER CAMBIO:
 * 
 * 📋 RAÍZ DEL PROYECTO (*.md):
 *    - AGENTS.md (documentación principal)
 *    - DEVELOPMENT-NOTES.md (recordatorios de desarrollo)
 *    - CHANGELOG.md (historial de cambios)
 *    - README.md (especialmente "🤖 Guía para IA")
 * 
 * 📚 DOCUMENTACIÓN EN resources/documents/AI conversations/:
 *    - Todas las carpetas y subcarpetas contienen guías importantes
 *    - Especialmente: 035-BOOLEAN-FILTERS-FIX...md
 *    - Buscar: PASO-A-PASO, GUIA-, o archivos relevantes al cambio
 * 
 * 🔴 PROBLEMA CRÍTICO A RECORDAR:
 *    Filtros booleanos en query parameters NO funcionan sin @Transform
 *    Esto causa: ?isActive=false devuelve 0 resultados
 *    Solución: Ver AGENTS.md o DEVELOPMENT-NOTES.md
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './database/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ClientProfilesModule } from './client-profiles/client-profiles.module';
import { ProviderProfilesModule } from './provider-profiles/provider-profiles.module';
import { ServiceConfigsModule } from './service-configs/service-configs.module';
import { CertificatesModule } from './certificates/certificates.module';
import { ServiceVariationsModule } from './service-variations/service-variations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Configuración global de Rate Limiting
    // 100 peticiones por cada 1 minuto (60 segundos)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos (1 minuto)
        limit: 100, // 100 peticiones
      },
    ]),
    TypeOrmModule.forRoot(databaseConfig()),
    AuthModule,
    UsersModule,
    RolesModule,
    ClientProfilesModule,
    ProviderProfilesModule,
    ServiceConfigsModule,
    CertificatesModule,
    ServiceVariationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplicar ThrottlerGuard globalmente a toda la aplicación
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
