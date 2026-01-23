import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ===================================
  // Configuración de CORS
  // ===================================
  // CORS (Cross-Origin Resource Sharing) controla qué dominios pueden acceder a la API
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000'];

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (como herramientas de testing, Postman, etc.)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*')
      ) {
        callback(null, true);
      } else {
        // Rechazar origen no permitido (devuelve 403 en lugar de 500)
        callback(null, false);
      }
    },
    methods:
      process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Permitir cookies y cabeceras de autenticación
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Authorization'], // Cabeceras que el cliente puede leer
    maxAge: 3600, // Tiempo en segundos que el navegador cachea las respuestas preflight
    preflightContinue: false,
    optionsSuccessStatus: 204, // Algunos navegadores legacy (IE11) tienen problemas con 204
  };

  app.enableCors(corsOptions);

  // ===================================
  // Configuración de seguridad con Helmet
  // ===================================
  // Helmet ayuda a proteger la aplicación configurando cabeceras HTTP de seguridad
  app.use(
    helmet({
      // Configuración personalizada para permitir que Swagger funcione correctamente
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
          imgSrc: [`'self'`, 'data:', 'https:'],
        },
      },
      // Desactivar X-Download-Options para compatibilidad con Swagger
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Habilitar versionado de API (URI Versioning)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('SocgerFleet API')
    .setDescription(
      'Sistema avanzado de gestión de usuarios con autenticación JWT y refresh tokens. ' +
        'API REST moderna con control de acceso basado en roles (RBAC) y funcionalidades de búsqueda y filtrado. ' +
        '\n\n**Versionado:** Esta API utiliza versionado URI. Todas las rutas están prefijadas con /v1/ (ejemplo: /v1/users, /v1/auth/login).',
    )
    .setVersion('1.0.0')
    .addTag('auth', 'Endpoints de autenticación y gestión de sesiones')
    .addTag('users', 'Gestión de usuarios con filtros avanzados')
    .addTag('roles', 'Gestión de roles y permisos')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .setContact('Socger', 'https://github.com/socger', 'socger@gmail.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SocgerFleet API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();
