# Changelog

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- **Endpoint de Cambio de Rol Activo** - Nuevo endpoint para alternar entre perfiles cliente y proveedor
  - **Endpoint**: `PATCH /v1/users/:userId/active-role`
  - **Body**: `{ "roleName": "client" | "provider" }`
  - **Respuesta**: Devuelve el perfil correspondiente si existe, o `null` si debe crearse
  - **Funcionalidad**:
    - Asigna automáticamente el rol si el usuario no lo tiene
    - Mantiene múltiples roles (un usuario puede tener ambos)
    - Devuelve `profileType` para indicar si debe cargar o crear el perfil
  - **Servicio**: Nuevo método `switchActiveRole()` en UsersService
  - **Test**: Archivo `switch-profile-tests.http` con casos de prueba
  - **Documentación**: Guía completa en `resources/docs/IA chats/019-1`
  - **Beneficio**: Permite cambiar de perfil sin perder datos ni crear duplicados

- **Auto-creación de Perfiles al Registrarse** - Los datos del usuario se copian automáticamente a su perfil
  - **Feature**: Al registrarse, se crea automáticamente un `ClientProfile` con los datos del usuario
  - **Nombre completo**: Combina `firstName` + `lastName` en el campo `name` del perfil
  - **Estado inicial**: Perfil creado con `profileStatus: 'draft'` y `location: 'Por configurar'`
  - **No bloqueante**: Si falla la creación del perfil, el registro continúa normalmente
  - **Beneficio**: Usuario no necesita rellenar nombre/email nuevamente al completar su perfil
  - **Logging**: Logs estructurados con `Logger` para debugging
  - **Archivos modificados**:
    - `src/auth/auth.module.ts` - Imports de `ClientProfilesModule` y `ProviderProfilesModule`
    - `src/auth/auth.service.ts` - Lógica de creación automática de perfil en método `register()`
  - **Documentación**: [006-2 - AUTO-CREATE-PROFILE-ON-REGISTER.md](resources/documents/AI%20conversations/AI%20conversations%20-%20cuidamet-api/006%20-%20Error%20de%20registro%20al%20crear%20perfil%20familiar/006-2 - AUTO-CREATE-PROFILE-ON-REGISTER.md)

### Fixed
- **Email Service Error on Register** - Error "Internal server error" al registrar usuarios aunque se guardaban correctamente en BD
  - **Problema**: El registro fallaba con error 500 aunque el usuario se creaba en la base de datos
  - **Causa**: El envío de email de verificación lanzaba excepción cuando no había servidor SMTP configurado (entorno desarrollo)
  - **Impacto**: Usuarios no podían completar el registro en desarrollo/QA, aunque estaban en la BD
  - **Solución**: Hacer el envío de email NO bloqueante con try-catch en `auth.service.ts`
  - **Archivos modificados**:
    - `src/auth/auth.service.ts` - Agregado try-catch en `sendVerificationEmail()`
    - `src/auth/services/email.service.ts` - Cambiado de `logger.error()` a `logger.warn()` y eliminado `throw`
  - **Resultado**: El registro se completa exitosamente aunque falle el email, con logging apropiado
  - **Documentación**: [006-1 - FIX-EMAIL-SERVICE-ERROR-ON-REGISTER.md](resources/docs/IA chats/006 - Error de registro al crear perfil familiar/006-1 - FIX-EMAIL-SERVICE-ERROR-ON-REGISTER.md)

### Added
- **Endpoint de Perfiles de Usuario** - Nuevo endpoint público para acceder a los perfiles de cliente y proveedor desde el usuario
  - **Endpoint**: `GET /v1/users/:id/profiles`
  - **Respuesta**: Incluye `clientProfile`, `providerProfile`, `hasProfiles` y `profileType`
  - **Tipos de perfil**: 'none', 'client', 'provider', 'both'
  - **Relaciones bidireccionales**: Implementadas en User entity (`user.clientProfile`, `user.providerProfile`)
  - **Documentación Swagger**: Completamente documentado con ejemplos y casos de uso
  - **Servicio**: Nuevo método `getUserProfiles()` en UsersService
  - **DTO**: `UserProfilesResponseDto` con metadata útil para frontend
  - **Tests**: Archivo actualizado `user-profiles-relations-tests.http` con casos de prueba
  - **Beneficio**: Una sola llamada API en lugar de múltiples queries para obtener perfiles
  - **Documentación**: [Feature 001 - Perfiles de Usuario](resources/documents/AI%20conversations/AI%20conversations%20-%20cuidamet-api/001%20-%20Creación%20de%20los%20perfiles%20de%20usuario%20profesionales%20y%20familiares/)

### Changed
- **Organización de Documentación** - Reestructuración de carpetas para mejor mantenibilidad
  - Documentación del proyecto actual en: `resources/docs/IA chats/`
  - Documentación del template base en: `resources/documents/AI conversations/AI conversations - socgerFleet/` (NO modificar)
  - Organización por features con numeración: `001 - Feature/`, `002 - Feature/`
  - Archivos numerados secuencialmente dentro de cada feature

### Fixed
- **Boolean Filters Fix** - Corrección crítica en filtros con campos booleanos en query parameters
  - **Problema**: Los filtros `?isActive=false` no devolvían resultados, `?isActive=true` era inconsistente
  - **Causa**: Conversión incorrecta de string a booleano (`Boolean("false")` = `true`)
  - **Solución**: Usar `@Transform` en DTOs de filtros + conversión a 0/1 en queries SQL
  - **Archivos afectados**: `src/users/dto/user-filters.dto.ts`, `src/users/users.service.ts`
  - **Documentación**: [BOOLEAN-FILTERS-FIX.md](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/035%20-%20BOOLEAN-FILTERS-FIX%20-%20Cambios%20necesarios%20para%20poder%20filtrar%20booleanos%20en%20las%20sql%20con%20type%20ORM.md)
  - **Patrón implementado**: Template reutilizable para futuros campos booleanos en filtros

### Planeado
- Endpoint GraphQL para consultas flexibles
- Sistema de webhooks para integraciones
- Migración a v2 de la API con mejoras de paginación
- Rate limiting con Redis para entornos multi-servidor

---

## [1.1.3] - 2026-01-19

### Security
- **Login Throttling Avanzado** - Sistema inteligente de protección contra ataques de fuerza bruta en el endpoint de login
  - **Límites por IP**: Máximo 5 intentos fallidos en 15 minutos desde la misma dirección IP
  - **Límites por usuario**: Máximo 3 intentos fallidos en 15 minutos para el mismo email/identificador
  - **Bloqueos progresivos**: Duración de bloqueo aumenta con cada violación
    - 1ª violación: 5 minutos
    - 2ª violación: 15 minutos
    - 3ª violación: 30 minutos
    - 4ª violación: 1 hora
    - 5ª+ violación: 24 horas
  - **Respuesta HTTP 429**: Informa tiempo restante de bloqueo y cuándo expira
  - **Tracking completo**: Todos los intentos (exitosos y fallidos) se registran en base de datos
  - **Limpieza automática**: Registros antiguos se eliminan automáticamente después de 30 días
  - **Entidad LoginAttempt**: Nueva tabla con campos: identifier, ipAddress, userAgent, isSuccessful, failureReason, createdAt, blockedUntil
  - **Guard personalizado**: LoginThrottlerGuard ejecuta antes de validar credenciales
  - **Configuración timezone UTC**: TypeORM configurado con `timezone: 'Z'` para correcta gestión de timestamps

### Added
- Nueva entidad `LoginAttempt` para rastrear intentos de login
- Guard `LoginThrottlerGuard` con lógica de throttling avanzado
- Migración `AddLoginAttempts` para crear tabla login_attempts con índices optimizados
- Métodos en AuthService: `recordLoginAttempt()`, `cleanOldLoginAttempts()`
- Archivo de pruebas REST CLIENT: `throttling-tests.http` con 12 casos de prueba
- Documentación técnica: [Implementación de Throttling Avanzado en Login](resources/documents/AI%20conversations/Implementación%20de%20Throttling%20Avanzado%20en%20Login.md)

### Changed
- Configuración TypeORM: Añadido `timezone: 'Z'` en `database.config.ts` y `data-source.ts` para forzar UTC
- AuthController: Integrado `LoginThrottlerGuard` en endpoint de login
- AuthService: Método `login()` ahora registra todos los intentos en base de datos

### Fixed
- Problema de zona horaria en TypeORM que causaba que las consultas de fecha con `MoreThan()` no funcionaran correctamente
- Cambio de `MoreThan()` a `createQueryBuilder()` para queries de fecha más confiables

### Technical
- Implementación de query builder para consultas de conteo en lugar de `repository.count()` con operadores de fecha
- Índices compuestos en tabla login_attempts para optimizar búsquedas: (ip_address, created_at) y (identifier, created_at)

---

## [1.1.2] - 2026-01-19

### Security
- **Rate Limiting** - Implementación de protección contra ataques de fuerza bruta y abuso de endpoints
  - Límite global: 100 peticiones por minuto para toda la API
  - Límites específicos por endpoint crítico:
    - Login: 5 intentos por minuto
    - Register: 3 intentos por minuto
    - Refresh token: 10 intentos por minuto
    - Request password reset: 3 intentos por 15 minutos
    - Reset password: 3 intentos por 15 minutos
  - Respuesta HTTP 429 al exceder límites
  - Headers informativos: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  - Identificación por IP del cliente
  - Paquete oficial @nestjs/throttler integrado
  - Script de verificación automática (test-rate-limiting.sh)
  - Documentación completa de configuración y testing

### Added
- Script `test-rate-limiting.sh` para verificar automáticamente el funcionamiento del rate limiting en todos los endpoints
- Documentación técnica: [Implementación de Rate Limiting](resources/documents/AI%20conversations/Implementación%20de%20Rate%20Limiting.md)

---

## [1.1.1] - 2026-01-19

### Security
- **CORS** - Implementación de Cross-Origin Resource Sharing
  - Control de orígenes permitidos mediante lista blanca configurable
  - Soporte para credenciales (cookies, tokens JWT)
  - Configuración de métodos HTTP permitidos
  - Cabeceras personalizadas permitidas y expuestas
  - Preflight caching optimizado (1 hora)
  - Variables de entorno: `CORS_ORIGIN`, `CORS_METHODS`
  - Script de verificación CORS (`test-cors.sh`)
  - Documentación completa de configuración y uso

- **Helmet** - Implementación de cabeceras de seguridad HTTP
  - Protección contra ataques XSS mediante Content-Security-Policy
  - Prevención de clickjacking con X-Frame-Options
  - Protección contra MIME type sniffing
  - Configuración de HSTS (Strict-Transport-Security)
  - Control de referrer policy
  - Configuración personalizada compatible con Swagger UI
  - Script de verificación de cabeceras (`test-helmet-headers.sh`)

---

## [1.1.0] - 2026-01-19

### Added
- **Versionado de API (URI Versioning)**
  - Implementación de versionado URI en todos los endpoints
  - Rutas versionadas: `/v1/users`, `/v1/auth/*`, `/v1/roles`
  - Configuración de versión por defecto v1
  - Documentación actualizada en Swagger con información de versionado
  - Preparación para futuras versiones de API sin romper compatibilidad

### Changed
- Actualizada documentación de Swagger para reflejar versionado URI
- Versión de la API actualizada a 1.0.0 en Swagger

---

## [1.0.0] - 2026-01-19

### Added
- **Sistema de Autenticación Completo**
  - Registro de usuarios con validación
  - Login con JWT (Access Token + Refresh Token)
  - Logout con invalidación de tokens
  - Estrategia Local y JWT para autenticación

- **Gestión Avanzada de Contraseñas**
  - Historial de contraseñas (últimas 5 contraseñas)
  - Validación de contraseñas previas al cambiar
  - Reseteo de contraseña mediante email
  - Cambio de contraseña para usuarios autenticados
  - Tokens de verificación con expiración

- **Sistema de Verificación de Email**
  - Envío de email de verificación al registro
  - Validación de email mediante token
  - Tokens con expiración de 24 horas
  - Notificación por email de cambios de contraseña

- **Sistema de Roles y Permisos (RBAC)**
  - Entidad de roles con permisos configurables
  - Guard de roles para proteger endpoints
  - Decorador `@Roles()` para control de acceso
  - Roles predefinidos: Admin, User

- **Gestión de Tokens de Refresh**
  - Refresh tokens con expiración configurable
  - Rotación de tokens al refrescar
  - Invalidación de tokens en logout
  - Limpieza automática de tokens expirados

- **CRUD de Usuarios**
  - Crear, leer, actualizar y eliminar usuarios
  - Paginación de listados
  - Filtros y búsqueda
  - Soft delete (desactivación de usuarios)

- **CRUD de Roles**
  - Gestión completa de roles
  - Asignación de permisos a roles
  - Control de acceso basado en roles

- **Documentación API**
  - Integración completa con Swagger/OpenAPI
  - Documentación automática de endpoints
  - Esquemas de DTOs documentados
  - Ejemplos de requests y responses
  - Autenticación Bearer en Swagger UI

- **Base de Datos**
  - Configuración con TypeORM
  - Migraciones automáticas
  - Seeds para datos iniciales
  - Soporte para MySQL
  - Entidades base con timestamps automáticos

- **Infraestructura**
  - Docker Compose para desarrollo
  - Contenedor MySQL con inicialización automática
  - Variables de entorno configurables
  - Scripts de gestión de contraseñas

- **Testing**
  - Suite de pruebas HTTP con REST Client
  - Tests para endpoints de autenticación
  - Tests para refresh tokens
  - Tests E2E configurados

### Security
- Hashing de contraseñas con bcrypt (10 rounds)
- Validación de contraseñas previas (historial de 5)
- Tokens JWT con expiración configurable
- Secrets para firmar tokens
- Validación y sanitización de inputs con class-validator
- Guards para protección de rutas
- CORS configurado
- Helmet para headers de seguridad

### Technical
- NestJS Framework
- TypeORM para ORM
- MySQL como base de datos
- Passport.js para autenticación
- JWT para tokens
- class-validator y class-transformer para validación
- Nodemailer para envío de emails
- bcrypt para hashing de contraseñas
- TypeScript con strict mode

---

## Notas

### Sobre el Versionado Semántico

Este proyecto usa [Versionado Semántico](https://semver.org/lang/es/):
- **MAJOR**: Cambios incompatibles en la API (breaking changes)
- **MINOR**: Nueva funcionalidad compatible con versiones anteriores
- **PATCH**: Correcciones de bugs compatibles con versiones anteriores

### Categorías de Cambios

- **Added**: Nuevas funcionalidades
- **Changed**: Cambios en funcionalidad existente
- **Deprecated**: Funcionalidades que se eliminarán próximamente
- **Removed**: Funcionalidades eliminadas
- **Fixed**: Correcciones de bugs
- **Security**: Mejoras de seguridad relacionadas con vulnerabilidades
- **Technical**: Cambios técnicos, dependencias, refactoring

### Política de Soporte

- Se mantiene soporte para las últimas 2 versiones MAJOR
- Las versiones deprecadas se anuncian con al menos 3 meses de antelación
- Los breaking changes se documentan claramente con la etiqueta **BREAKING**

### Contribuir

Al realizar cambios, actualiza este CHANGELOG siguiendo las pautas:
1. Añade cambios en la sección `[Unreleased]`
2. Sé específico: indica qué se añadió, cambió o corrigió
3. Incluye referencias a issues/PRs cuando sea relevante: `Fixed #123`
4. Marca claramente los breaking changes con **BREAKING**
5. Antes de cada release, mueve los cambios de `[Unreleased]` a una nueva versión con fecha
