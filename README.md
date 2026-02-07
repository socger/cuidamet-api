<div align="center">
  <h1>🚀 SocgerFleet API</h1>
  <p>Sistema avanzado de gestión de usuarios con autenticación JWT y refresh tokens</p>
  
  <img src="https://img.shields.io/badge/version-1.1.3-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</div>

---

## ⚡ Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone <tu-repositorio>
cd cuidamet-api

# 2. Instalar dependencias
npm install
# O de forma abreviada: npm i

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de base de datos

# 4. Levantar contenedor Docker con MySQL
docker compose up -d

# 5. Ejecutar migraciones (crea toda la estructura de BD)
npm run migration:run

# 6. (Opcional) Poblar datos de prueba
npm run seed:run

# 7. Iniciar servidor en modo desarrollo
npm run start:dev

# 8. Abrir Swagger (Documentación interactiva)
# http://localhost:3000/api/docs
```

> **💡 Nota**: Las migraciones de TypeORM crean automáticamente todas las tablas, índices, relaciones y datos iniciales (roles y usuario admin). No necesitas scripts SQL manuales.

**Pruebas de Seguridad:**
```bash
./test-helmet-headers.sh  # Verificar cabeceras HTTP
./test-cors.sh            # Verificar CORS
./test-rate-limiting.sh   # Verificar rate limiting global
# Pruebas de login throttling en: test endpoints with REST CLIENT extension/throttling-tests.http
```

---

## 📑 Tabla de Contenidos

- [📋 Descripción](#-descripción)
- [✨ Características Principales](#-características-principales)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [🏗️ Arquitectura](#️-arquitectura)
- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [🗄️ Gestión de Base de Datos](#️-gestión-de-base-de-datos)
- [📡 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [🔒 Seguridad](#-seguridad)
- [🐳 Docker](#-docker)
- [📊 Funcionalidades Destacadas](#-funcionalidades-destacadas)
- [📚 Documentación](#-documentación)
- [🤖 Guía para IA](#-guía-para-ia-crearmodificar-endpoints-y-entidades)
- [🎯 Casos de Uso](#-casos-de-uso)
- [🤝 Contribuir](#-contribuir)
- [📝 Licencia](#-licencia)

> 💡 **Recordatorio para Desarrollo:** Antes de crear nuevos DTOs o filtros, lee [DEVELOPMENT-NOTES.md](DEVELOPMENT-NOTES.md) - especialmente la sección sobre filtros booleanos.

---

## 📋 Descripción

**SocgerFleet** es una API REST moderna desarrollada en NestJS que proporciona un sistema completo de gestión de usuarios con autenticación avanzada, control de acceso basado en roles (RBAC) y funcionalidades de búsqueda y filtrado de nivel empresarial.

## ✨ Características Principales

### 🔐 **Autenticación y Seguridad**
- **JWT con Refresh Tokens** - Sistema de doble token con rotación automática
- **Bcrypt** - Hash seguro de contraseñas
- **Guards** - Protección de rutas con validación de roles
- **Gestión de sesiones** - Control granular por dispositivo
- **Rate Limiting Global** - Protección contra fuerza bruta y abuso de endpoints (100 req/min)
- **Login Throttling Avanzado** - Sistema inteligente de protección en login:
  - Límites por IP (5 intentos/15min) y por usuario (3 intentos/15min)
  - Bloqueos progresivos (5min → 15min → 30min → 1h → 24h)
  - Tracking completo de intentos en base de datos
  - HTTP 429 con información de tiempo restante de bloqueo
- **Helmet** - Cabeceras de seguridad HTTP (CSP, HSTS, XSS protection)
- **CORS** - Control de orígenes permitidos mediante lista blanca configurable

### 👥 **Gestión de Usuarios y Roles**
- **CRUD completo** - Crear, leer, actualizar, eliminar usuarios y roles
- **RBAC** - Control de acceso basado en roles
- **Asignación dinámica** - Asignar/remover roles con validaciones
- **Validaciones robustas** - Prevención de duplicados y datos inválidos

### 🔍 **Sistema Avanzado de Filtros**
- **Búsqueda inteligente** - Búsqueda en múltiples campos simultáneamente
- **Filtros específicos** - Por username, email, roles, fechas, etc.
- **Paginación optimizada** - Con meta información completa
- **Ordenación flexible** - Ascendente/descendente por cualquier campo
- **Combinación de filtros** - Múltiples criterios simultáneos

### 🗄️ **Base de Datos Avanzada**
- **Migraciones TypeORM** - Versionado y control de cambios en el esquema
- **Soft Deletes** - Borrado lógico en lugar de físico (recuperable)
- **Auditoría completa** - Trazabilidad de quién creó, modificó y eliminó registros
- **Seeders** - Datos iniciales automatizados para desarrollo y pruebas

### 🔄 **Versionado de API (URI Versioning)**
- **Múltiples versiones simultáneas** - v1 y v2+ pueden coexistir
- **URLs explícitas** - `/v1/users`, `/v2/users`
- **Backward compatibility** - Clientes no se rompen con nuevas versiones
- **Deprecación controlada** - Período de transición definido
- **Documentación por versión** - Swagger documenta cada versión separadamente

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NestJS** | ^10.0.0 | Framework principal |
| **TypeScript** | ^5.1.3 | Lenguaje de programación |
| **TypeORM** | ^0.3.17 | ORM para base de datos |
| **MySQL** | 8.0 | Base de datos |
| **JWT** | ^10.2.0 | Autenticación |
| **Bcrypt** | ^5.1.1 | Hash de contraseñas |
| **Helmet** | Latest | Cabeceras de seguridad HTTP |
| **Throttler** | Latest | Rate limiting y protección anti-abuso |
| **Class Validator** | ^0.14.0 | Validación de DTOs |
| **Swagger/OpenAPI** | ^7.4.2 | Documentación interactiva de API |
| **Docker** | Latest | Containerización |

## 🏗️ Arquitectura

```
src/
├── auth/                 # Módulo de autenticación
│   ├── controllers/      # Controladores (login, register, refresh)
│   ├── services/         # Lógica de negocio + RefreshTokenService
│   ├── guards/           # Guards de autenticación y autorización
│   ├── strategies/       # Estrategias JWT y Local
│   └── dto/             # DTOs de validación
├── users/               # Módulo de usuarios
│   ├── controllers/     # CRUD + filtros avanzados
│   ├── services/        # Lógica de negocio + búsqueda
│   └── dto/            # DTOs de validación y filtros
├── roles/               # Módulo de roles
├── entities/            # Entidades TypeORM (User, Role, RefreshToken)
├── common/              # DTOs comunes (paginación, etc.)
└── database/            # Configuración de base de datos
```

## 🚀 Instalación y Configuración

### **1. Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd cuidamet-api
```

### **2. Instalar dependencias**

```bash
npm install
# O de forma abreviada: npm i
```

Este comando:
- ✅ Instala todas las dependencias del proyecto
- ✅ Lee versiones desde `package.json`
- ✅ Crea/actualiza `package-lock.json`

#### **Para Producción (opcional)**
```bash
npm install --production
# Solo instala dependencias de producción (omite devDependencies)
```

> **💡 Tip**: Si prefieres instalaciones reproducibles con versiones exactas, usa `npm ci` en lugar de `npm install`. Esto es útil en CI/CD y servidores.

### **3. Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar [`.env`](.env):
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=socger
DB_PASSWORD=tu_password
DB_DATABASE=cuidamet

# JWT
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=tu_refresh_secret_diferente
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development

# CORS (Seguridad)
CORS_ORIGIN=http://localhost:3000,http://localhost:4200,http://localhost:5173
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS

# Email (opcional)
MAIL_HOST=localhost
MAIL_PORT=1025
APP_URL=http://localhost:3000

# File Upload (Subida de archivos)
MAX_CERTIFICATE_SIZE_MB=5            # Tamaño máximo por archivo (MB)
MAX_CERTIFICATES_PER_USER=10         # Límite de certificados por usuario
```

**Importante:**
- Cambia `tu_password`, `tu_jwt_secret`, etc. por valores seguros
- Para CORS en producción, usa solo tus dominios reales: `CORS_ORIGIN=https://tuapp.com`
- **NUNCA** uses `CORS_ORIGIN=*` en producción
- Ajusta `MAX_CERTIFICATES_PER_USER` según tus necesidades de negocio

### **4. Levantar contenedor Docker con MySQL**
```bash
docker compose up -d
```

Este comando:
- ✅ Inicia contenedor MySQL 8.0
- ✅ Inicia phpMyAdmin (interfaz web para BD)
- ✅ Crea la base de datos `cuidamet` (si no existe)

> **💡 Nota**: El contenedor crea una base de datos **vacía**. Las migraciones de TypeORM crearán toda la estructura automáticamente en el siguiente paso.

### **5. Ejecutar migraciones de TypeORM**

⚠️ **IMPORTANTE**: Este proyecto usa migraciones TypeORM (`synchronize: false`).  
Las migraciones son **OBLIGATORIAS** para crear/actualizar el esquema de la base de datos.

```bash
npm run migration:run
```

Esto creará automáticamente:
- ✅ 13 tablas completas con índices y relaciones
- ✅ Campos de auditoría (`created_at`, `updated_at`, `deleted_at`, etc.)
- ✅ Campos para soft delete (borrado lógico recuperable)
- ✅ 5 roles predefinidos (admin, user, moderator, provider, client)
- ✅ Usuario admin inicial (admin@socgerfleet.com / admin123)

📖 **Más información**: Ver [MIGRACIONES-INFO.md](MIGRACIONES-INFO.md) para detalles completos

### **6. (Opcional) Poblar base de datos con datos de prueba**
```bash
npm run seed:run
```

Esto creará usuarios adicionales de prueba:
- **admin@socgerfleet.com** (contraseña: Admin123!)
- **moderator@socgerfleet.com** (contraseña: Moderator123!)
- **user@socgerfleet.com** (contraseña: User123!)

### **7. Ejecutar la aplicación**
```bash
# Modo desarrollo (con auto-reload)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

La aplicación estará disponible en:
- **API v1**: http://localhost:3000/v1
- **Swagger UI**: http://localhost:3000/api/docs
- **phpMyAdmin**: http://localhost:8080

**Nota:** La API utiliza versionado URI. Todos los endpoints están prefijados con `/v1/` (ejemplo: `/v1/users`, `/v1/auth/login`)

### **8. Verificar Seguridad (Opcional)**

```bash
# Probar cabeceras de seguridad (Helmet)
./test-helmet-headers.sh

# Probar configuración CORS
./test-cors.sh

# Probar rate limiting global
./test-rate-limiting.sh
```

## 🗄️ Gestión de Base de Datos

### **Migraciones**

Las migraciones permiten versionar los cambios en el esquema de la base de datos:

```bash
# Generar nueva migración (detecta cambios en entidades)
npm run migration:generate -- src/database/migrations/NombreMigracion

# Crear migración vacía (para cambios manuales)
npm run migration:create -- src/database/migrations/NombreMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Ver estado de migraciones
npm run migration:show
```

⚠️ **IMPORTANTE**: 
- El proyecto tiene `synchronize: false` - **Debes usar migraciones para cambios en el esquema**
- Siempre revisa la migración generada antes de ejecutarla
- Prueba en desarrollo antes de aplicar en producción
- Las migraciones se ejecutan en orden cronológico

**Flujo al crear nuevas entidades:**
1. Crear/modificar entidad
2. `npm run migration:generate -- src/database/migrations/AddNuevaEntidad`
3. Revisar archivo generado en `src/database/migrations/`
4. `npm run migration:run`
5. `npm run migration:show` (verificar que se aplicó)

### **Seeders**

Los seeders permiten poblar la base de datos con datos iniciales:

```bash
# Ejecutar todos los seeders
npm run seed:run
```

**Características:**
- **Idempotentes**: Se pueden ejecutar múltiples veces sin duplicar datos
- **Datos de prueba**: Usuarios admin, moderator, user con contraseñas seguras
- **Roles iniciales**: admin, moderator, user

**Crear nuevo seeder:**
1. Crear archivo en `src/database/seeds/`
2. Implementar método `run()`
3. Registrar en `src/database/seeds/run-seeders.ts`

### **Soft Deletes y Auditoría**

El proyecto implementa:

**Soft Delete** (Borrado Lógico):
- Los registros NO se borran físicamente de la base de datos
- Se marca el campo `deleted_at` con la fecha de eliminación
- Ventajas: Recuperables, trazabilidad, cumplimiento normativo
- Por defecto, las consultas excluyen registros eliminados

```typescript
// Excluir eliminados (comportamiento por defecto)
await repository.find();

// Incluir eliminados
await repository.find({ withDeleted: true });

// Solo eliminados
await repository.find({ 
  where: { deletedAt: Not(IsNull()) },
  withDeleted: true 
});
```

**Auditoría Completa**:
- `created_by` - ID del usuario que creó el registro
- `updated_by` - ID del usuario que actualizó
- `deleted_by` - ID del usuario que eliminó
- `created_at` - Fecha de creación (automático)
- `updated_at` - Fecha de última actualización (automático)
- `deleted_at` - Fecha de eliminación (automático con soft delete)

**Beneficios:**
- ✅ Trazabilidad completa de todas las operaciones
- ✅ Identificación de quién realizó cada cambio
- ✅ Cumplimiento de auditorías y normativas (GDPR, SOC 2)
- ✅ Recuperación de datos eliminados accidentalmente
- ✅ Análisis de patrones de uso y eliminación

📖 Más información: [Mejoras de Base de Datos](resources/documents/AI%20conversations/Mejoras-Base-Datos.md)

## 📡 API Endpoints

### **� Documentación Interactiva**

La API cuenta con documentación interactiva completa usando **Swagger/OpenAPI**:

```
http://localhost:3000/api/docs
```

Así que ten en cuenta swagger/OpenAPI cada vez que crees NUEVOS:
  - endpoints
  - DTOs
  - Controladores
  - UpdateDto (heredados con PartialType)

### **🏗️ Crear Nuevas Entidades (Workflow Actualizado)**

⚠️ **IMPORTANTE**: Desde la implementación de migraciones, soft deletes y auditoría, el proceso ha cambiado:

#### **Paso 1: Crear Entidad**
```typescript
// ✅ SIEMPRE extender de BaseEntity (incluye auditoría y soft delete)
import { BaseEntity } from './base.entity';
import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  // ❌ NO incluir: id, createdAt, updatedAt, deletedAt, createdBy, updatedBy, deletedBy
  // ✅ Ya están en BaseEntity
  
  @Column({ unique: true })
  @ApiProperty({ example: 'ABC1234', description: 'Matrícula del vehículo' })
  plate: string;
  
  @Column()
  @ApiProperty({ example: 'Toyota Corolla', description: 'Modelo del vehículo' })
  model: string;
}
```

#### **Paso 2: Crear DTOs con Swagger**
```typescript
// CreateDto
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ 
    example: 'ABC1234',
    description: 'Matrícula única del vehículo',
    maxLength: 10
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  plate: string;
  
  @ApiProperty({ 
    example: 'Toyota Corolla',
    description: 'Modelo del vehículo'
  })
  @IsString()
  @IsNotEmpty()
  model: string;
}

// UpdateDto - ⚠️ IMPORTANTE: Usar PartialType de @nestjs/swagger
import { PartialType } from '@nestjs/swagger'; // ✅ Correcto
// import { PartialType } from '@nestjs/mapped-types'; // ❌ Incorrecto

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  // Hereda automáticamente todas las propiedades como opcionales
}
```

#### **Paso 3: Crear Servicio con Auditoría**
```typescript
// ✅ Agregar parámetros opcionales para auditoría
async create(dto: CreateDto, createdBy?: number) {
  const entity = this.repository.create({ ...dto, createdBy });
  return this.repository.save(entity);
}

async update(id: number, dto: UpdateDto, updatedBy?: number) {
  const entity = await this.findOne(id);
  Object.assign(entity, dto);
  if (updatedBy) entity.updatedBy = updatedBy;
  return this.repository.save(entity);
}

// ⚠️ Usar softRemove() para soft delete
async remove(id: number, deletedBy?: number) {
  const entity = await this.findOne(id);
  if (deletedBy) entity.deletedBy = deletedBy;
  await this.repository.softRemove(entity); // ✅ Soft delete
  // await this.repository.remove(entity); // ❌ NO hacer esto
}
```

#### **Paso 4: Crear Controlador con JWT y Auditoría**
```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // ✅ Operaciones de escritura requieren autenticación
  @Post()
  @UseGuards(JwtAuthGuard)  // ✅ Requerido para auditoría
  @ApiBearerAuth('JWT-auth') // ✅ Para Swagger
  @ApiOperation({ summary: 'Crear nuevo vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async create(@Body() dto: CreateVehicleDto, @Request() req) {
    const createdBy = req.user?.userId;  // ✅ Extraer userId
    return this.vehiclesService.create(dto, createdBy);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar vehículo' })
  async update(
    @Param('id') id: number, 
    @Body() dto: UpdateVehicleDto, 
    @Request() req
  ) {
    const updatedBy = req.user?.userId;
    return this.vehiclesService.update(id, dto, updatedBy);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar vehículo (soft delete)' })
  async remove(@Param('id') id: number, @Request() req) {
    const deletedBy = req.user?.userId;
    await this.vehiclesService.remove(id, deletedBy);
    return { message: 'Vehículo eliminado exitosamente' };
  }
  
  // ✅ Operaciones de lectura pueden ser públicas o protegidas según necesidad
  @Get()
  @ApiOperation({ summary: 'Listar todos los vehículos' })
  async findAll() {
    return this.vehiclesService.findAll();
  }
}
```

#### **Paso 5: Registrar Entidad**
```typescript
// src/database/database.config.ts
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Vehicle } from '../entities/vehicle.entity'; // ✅ Importar

entities: [
  User, 
  Role, 
  RefreshToken, 
  Vehicle, // ✅ Agregar nueva entidad
],

// También registrar en app.module.ts
imports: [
  TypeOrmModule.forFeature([Vehicle]), // ✅ En el módulo correspondiente
],
```

#### **Paso 6: Generar y Ejecutar Migración**
```bash
# ⚠️ NO confiar en synchronize (está en false)
# Generar migración
npm run migration:generate -- src/database/migrations/AddVehicleEntity

# Revisar migración generada
# Ejecutar migración
npm run migration:run

# Verificar
npm run migration:show
```

#### **Paso 7: (Opcional) Crear Seeder**
```typescript
// src/database/seeds/vehicle.seeder.ts
export class VehicleSeeder {
  public async run(): Promise<void> {
    // Crear datos iniciales
  }
}
```

#### **Checklist Completo para Nuevas Entidades**

**Base de Datos:**
- [ ] Entidad extiende de `BaseEntity`
- [ ] NO incluir campos duplicados (id, timestamps, auditoría)
- [ ] Registrar en `database.config.ts`
- [ ] Generar migración con `npm run migration:generate`
- [ ] Ejecutar migración con `npm run migration:run`
- [ ] (Opcional) Crear seeder para datos iniciales

**Servicio:**
- [ ] Métodos `create()`, `update()`, `remove()` con parámetros de auditoría
- [ ] Usar `softRemove()` en lugar de `remove()`
- [ ] Pasar `createdBy`, `updatedBy`, `deletedBy` al repository

**Controlador:**
- [ ] Operaciones de escritura con `@UseGuards(JwtAuthGuard)`
- [ ] Agregar `@ApiBearerAuth()` para Swagger
- [ ] Incluir `@Request() req` para obtener userId
- [ ] Extraer `req.user?.userId` y pasar a servicios

**Swagger/OpenAPI:**
- [ ] CreateDto con `@ApiProperty`
- [ ] UpdateDto con `PartialType` de `@nestjs/swagger`
- [ ] FiltersDto con `@ApiPropertyOptional` (si aplica)
- [ ] Controlador con `@ApiTags`
- [ ] Cada método con `@ApiOperation`
- [ ] Responses con `@ApiResponse`
- [ ] `@ApiParam` para parámetros de ruta
- [ ] `@ApiQuery` para query parameters

**Validación:**
- [ ] DTOs con decoradores de `class-validator`
- [ ] Validar duplicados en servicio
- [ ] Manejo de errores apropiado

📖 **Guía Detallada**: [Crear Nuevas Entidades](resources/documents/AI%20conversations/GUIA-Crear-Nuevas-Entidades.md)

💡 Tips Importantes
  - Siempre usa ejemplos realistas en @ApiProperty
  - Documenta todos los códigos de error con @ApiResponse
  - Agrupa lógicamente con @ApiTags
  - Usa PartialType de @nestjs/swagger, no de mapped-types
  - Reinicia la app para ver cambios (o usa watch mode)

⚠️ **Errores Comunes a Evitar:**
  1. ❌ **No extender de BaseEntity** → Perderás auditoría y soft delete automáticos
  2. ❌ **Usar `remove()` en lugar de `softRemove()`** → Pérdida de datos irrecuperable (no hay vuelta atrás)
  3. ❌ **Olvidar `@Request() req` en controlador** → Sin trazabilidad de quién hizo el cambio
  4. ❌ **No generar migraciones** → El esquema no se actualiza (synchronize: false)
  5. ❌ **Usar PartialType de mapped-types** → Swagger no documenta correctamente los DTOs
  6. ❌ **Olvidar `@UseGuards(JwtAuthGuard)`** → Sin control de quién hace cambios (auditoría incompleta)
  7. ❌ **No pasar `userId` a los métodos de servicio** → Campos de auditoría quedan en `null`
  8. ❌ **Usar `@ApiBearerAuth()` sin argumento** → Debería ser `@ApiBearerAuth('JWT-auth')`

**💡 Consejos Adicionales:**
  - Siempre revisa la migración generada antes de ejecutarla
  - Prueba primero en desarrollo antes de aplicar en producción
  - Los campos de auditoría son opcionales (`?`) para evitar errores en seeders
  - Usa `withDeleted: true` para consultar registros eliminados cuando sea necesario
  - Considera crear un seeder para datos de prueba de la nueva entidad

**Características de Swagger:**
- 🔍 **Exploración interactiva** - Prueba todos los endpoints desde el navegador
- 📝 **Documentación completa** - Descripciones detalladas de cada endpoint
- 🔐 **Autenticación integrada** - Prueba endpoints protegidos con JWT
- 📊 **Schemas detallados** - Visualiza la estructura de requests y responses
- ✨ **Try it out** - Ejecuta peticiones reales directamente

**Cómo usar Swagger con JWT:**
1. Primero hacer login en `/auth/login` para obtener el `accessToken`
2. Clic en el botón **"Authorize" 🔓** en la esquina superior derecha
3. Ingresar: `Bearer <tu_access_token>` (sin las comillas angulares)
4. Clic en "Authorize" y luego "Close"
5. Ahora puedes probar los endpoints protegidos

### **�🔐 Autenticación**
```http
POST /auth/login                      # Login con refresh token
POST /auth/register                   # Registro de usuario
POST /auth/refresh                    # Renovar access token
POST /auth/logout                     # Logout específico
POST /auth/logout-all                 # Logout masivo
POST /auth/profile                    # Obtener perfil
```

### **🔑 Gestión de Contraseñas**
```http
POST /auth/request-password-reset     # Solicitar reset de contraseña (envía email)
POST /auth/reset-password             # Resetear contraseña con token
POST /auth/change-password            # Cambiar contraseña (autenticado)
GET  /auth/verify-email?token=xxx     # Verificar email de usuario
```

### **👥 Usuarios**
```http
GET    /users             # Listar usuarios (con filtros)
GET    /users/search      # Búsqueda rápida
GET    /users/:id         # Obtener usuario
GET    /users/:id/profiles # Obtener perfiles del usuario
POST   /users             # Crear usuario
PUT    /users/:id         # Actualizar usuario
PATCH  /users/:id/active-role  # Cambiar rol activo (client/provider)
DELETE /users/:id         # Eliminar usuario
POST   /users/:id/roles/:roleId    # Asignar rol
DELETE /users/:id/roles/:roleId    # Remover rol
```

### **🛡️ Roles**
```http
GET    /roles             # Listar roles (con filtros)
GET    /roles/:id         # Obtener rol
POST   /roles             # Crear rol
PUT    /roles/:id         # Actualizar rol
DELETE /roles/:id         # Eliminar rol
```

## 🧪 Testing

### **Probar con REST Client**
Los archivos de prueba están en [`test endpoints with REST CLIENT extension/`](test endpoints with REST CLIENT extension/):

```bash
# Pruebas generales CRUD
test endpoints with REST CLIENT extension/api-tests.http

# Pruebas de refresh tokens
test endpoints with REST CLIENT extension/refresh-tokens-tests.http
```

### **Filtros Avanzados**
```http
# Buscar usuarios por múltiples criterios
GET /users?search=admin&role=admin&isActive=true&page=1&limit=10&sortBy=username&sortOrder=ASC

# Filtrar roles con usuarios
GET /roles?minUsers=1&maxUsers=5&sortBy=userCount&sortOrder=DESC
```

## 🔒 Seguridad

### **Características Implementadas**
- ✅ **CORS** - Control de orígenes permitidos con lista blanca configurable ([Ver guía](README-CORS.md))
- ✅ **Helmet** - Cabeceras HTTP de seguridad contra ataques comunes
- ✅ **Rate Limiting Global** - Protección contra ataques de fuerza bruta y abuso de API (100 req/min)
- ✅ **Login Throttling Avanzado** - Sistema inteligente de protección específico para login:
  - Límites por IP (5 intentos/15min) y usuario (3 intentos/15min)
  - Bloqueos progresivos con duración creciente
  - Registro de todos los intentos en base de datos
  - Respuesta HTTP 429 con información detallada de bloqueo
- ✅ **Refresh Token Rotation** - Tokens rotatorios para máxima seguridad
- ✅ **Validación de duplicados** - Email y username únicos
- ✅ **Hash de contraseñas** - Bcrypt con salt rounds
- ✅ **Guards de autorización** - Protección basada en roles
- ✅ **Limpieza automática** - Tokens expirados eliminados automáticamente
- ✅ **Trazabilidad** - IP y device info en refresh tokens
- ✅ **Verificación de email** - Email de confirmación al registrarse
- ✅ **Recuperación de contraseña** - Reset seguro vía email
- ✅ **Historial de contraseñas** - Validación contra últimas 5 contraseñas
- ✅ **Validación de contraseña fuerte** - Requisitos de complejidad
- ✅ **Notificaciones por email** - Confirmación de cambios de seguridad
- ✅ **Auditoría completa** - Registro de quién crea, modifica y elimina registros
- ✅ **Soft delete** - Recuperación de datos eliminados accidentalmente
- ✅ **Migraciones versionadas** - Control total del esquema de base de datos

### **CORS - Cross-Origin Resource Sharing**
Control de qué dominios pueden acceder a la API desde navegadores web:
- **Lista blanca configurable** - Solo orígenes específicos autorizados
- **Soporte de credenciales** - Cookies y tokens JWT
- **Preflight caching** - Optimización de rendimiento
- **Variables de entorno** - `CORS_ORIGIN`, `CORS_METHODS`

```bash
# Configurar en .env
CORS_ORIGIN=http://localhost:4200,https://tuapp.com

# Probar configuración
./test-cors.sh
```

📖 **[Guía completa de CORS](README-CORS.md)** - Configuración, ejemplos y troubleshooting

### **Helmet - Seguridad HTTP**
Helmet configura automáticamente las siguientes cabeceras de seguridad:
- **Content-Security-Policy (CSP)** - Previene ataques XSS
- **X-Frame-Options** - Protección contra clickjacking
- **X-Content-Type-Options** - Previene MIME type sniffing
- **Strict-Transport-Security (HSTS)** - Fuerza conexiones HTTPS
- **Referrer-Policy** - Control de información del referrer

Para verificar las cabeceras de seguridad:
```bash
./test-helmet-headers.sh
```

### **Rate Limiting - Protección Anti-Abuso**
El sistema implementa dos capas de protección:

#### **1. Rate Limiting Global** 
Protege toda la API contra:
- **Ataques de fuerza bruta** - Límite en intentos de login
- **Spam de registros** - Control de creación de cuentas
- **Abuso de recursos** - Límites en peticiones por minuto
- **Ataques DoS básicos** - Prevención de sobrecarga

**Límites configurados:**
- **Global**: 100 peticiones/minuto (todos los endpoints)
- **Login**: 5 intentos/minuto
- **Register**: 3 intentos/minuto
- **Refresh Token**: 10 intentos/minuto
- **Password Reset**: 3 intentos/15 minutos

**Respuesta al exceder límites:**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 60
Retry-After: 60
```

Para verificar el rate limiting:
```bash
./test-rate-limiting.sh  # Prueba todos los endpoints automáticamente
```

📖 **[Documentación técnica de Rate Limiting](resources/documents/AI%20conversations/Implementación%20de%20Rate%20Limiting.md)** - Configuración detallada y ajustes

#### **2. Login Throttling Avanzado**
Sistema inteligente específico para el endpoint de login con protección progresiva:

**Características:**
- **Doble validación**: Por IP (5 intentos) y por usuario/email (3 intentos) en ventana de 15 minutos
- **Bloqueos progresivos**: Duración aumenta con cada violación
  - 1ª violación: 5 minutos
  - 2ª violación: 15 minutos
  - 3ª violación: 30 minutos
  - 4ª violación: 1 hora
  - 5ª+ violación: 24 horas
- **Tracking completo**: Todos los intentos se registran en base de datos (tabla `login_attempts`)
- **Respuesta informativa**: HTTP 429 con tiempo restante y fecha de desbloqueo
- **Limpieza automática**: Registros antiguos (>30 días) se eliminan automáticamente

**Respuesta de bloqueo:**
```json
{
  "statusCode": 429,
  "message": "Demasiados intentos de login desde esta IP. Bloqueado por 5 minutos.",
  "blockedUntil": "2026-01-19T10:35:00.000Z",
  "remainingTime": "5 minutos"
}
```

**Archivos de prueba:**
```bash
# Pruebas completas de throttling en login
# Ver: test endpoints with REST CLIENT extension/throttling-tests.http
```

📖 **[Documentación técnica de Login Throttling](resources/documents/AI%20conversations/Implementación%20de%20Throttling%20Avanzado%20en%20Login.md)** - Configuración detallada y arquitectura

### **Flujo de Autenticación**
1. **Login** → Recibe access token (15 min) + refresh token (7 días)
2. **Usar API** → Access token en header Authorization
3. **Token expira** → Usar refresh token para obtener nuevo access token
4. **Logout** → Revocar refresh tokens específicos o todos

## 🐳 Docker

### **Servicios disponibles**
- **MySQL** - Base de datos principal (puerto 3306)
- **phpMyAdmin** - Interfaz web (http://localhost:8080)

### **Comandos útiles**
```bash
# Levantar servicios
  docker-compose up -d 
ó el comando más moderno
  docker compose up -d 

# Ver logs
docker-compose logs -f

# Parar servicios
  docker-compose down
ó el comando más moderno
  docker compose down

# Acceder a MySQL
docker exec -it socgerfleet_mysql mysql -u socger -p
```

## 📊 Funcionalidades Destacadas

### **🔍 Sistema de Filtros**
- **37+ combinaciones** de filtros probadas
- **Búsqueda inteligente** en múltiples campos
- **Paginación eficiente** con meta información
- **Filtros por relaciones** (usuarios por rol, etc.)

### **⚡ Rendimiento**
- **Consultas optimizadas** con TypeORM
- **Índices automáticos** en campos clave
- **Paginación a nivel de BD** para escalabilidad

### **🛡️ Validaciones**
- **DTOs robustos** con class-validator
- **Manejo de errores** con códigos HTTP apropiados
- **Validaciones de negocio** (duplicados, relaciones, etc.)

## 📊 Documentación

### 📁 Estructura de Documentación

Este repositorio mantiene toda la documentación técnica organizada:

**Carpetas principales:**
- `resources/docs/IA chats/` - **📝 Conversaciones y decisiones de este proyecto** (crea aquí nuevos .md)
- `resources/documents/AI conversations/AI conversations - socgerFleet/` - Conversaciones del proyecto template (NO modificar)

**⚠️ IMPORTANTE para crear nuevos archivos .md:**
- ✅ **CREAR EN**: `resources/docs/IA chats/`
  - Organiza por features en subcarpetas numeradas: `001 - Nombre Feature/`, `002 - Otra Feature/`
  - Archivos numerados secuencialmente: `001-1-descripcion.md`, `001-2-implementacion.md`
- ❌ **NO CREAR EN**: `resources/documents/AI conversations/` (raíz)
- ❌ **NO MODIFICAR**: `resources/documents/AI conversations/AI conversations - socgerFleet/` (template)

### **📚 Documentación Adicional**

El proyecto incluye documentación detallada para diferentes aspectos:

**Base de Datos:**
- [Mejoras de Base de Datos](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/Mejoras-Base-Datos.md) - Guía completa de migraciones, seeders y auditoría
- [Checklist de Implementación](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/CHECKLIST-Implementacion-BD.md) - Pasos para aplicar las mejoras
- [Resumen de Implementación](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/009%20-%20RESUMEN-Implementacion-Completa.md) - Resumen ejecutivo de cambios

**Seguridad:**
- [Guía de CORS](README-CORS.md) - Configuración completa de Cross-Origin Resource Sharing
- [Implementación de CORS](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/020%20-%20Implementación%20de%20CORS%20para%20seguridad%20adicional.md) - Documentación técnica detallada
- [Mejoras de Seguridad - Helmet](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/Mejoras%20de%20seguridad%20para%20API%20-%20Helmet.md) - Implementación de cabeceras HTTP de seguridad
- [Implementing HELMET for HTTP security headers](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/Implementing%20HELMET%20for%20HTTP%20security%20headers.md) - Documentación técnica de Helmet
- [Implementación de Rate Limiting](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/Implementación%20de%20Rate%20Limiting.md) - Protección contra ataques de fuerza bruta y abuso
- [Implementación de Throttling Avanzado en Login](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/Implementación%20de%20Throttling%20Avanzado%20en%20Login.md) - Sistema inteligente de protección en login

**Desarrollo:**
- [Guía: Crear Nuevas Entidades](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/GUIA-Crear-Nuevas-Entidades.md) - Workflow completo con ejemplos

**Features de Cuidamet-API:**
- [001 - Perfiles de Usuario](resources/documents/AI%20conversations/AI%20conversations%20-%20cuidamet-api/001%20-%20Creación%20de%20los%20perfiles%20de%20usuario%20profesionales%20y%20familiares/) - Implementación completa de ClientProfile y ProviderProfile

**Control de Versiones:**
- [CHANGELOG.md](CHANGELOG.md) - Historial de cambios del proyecto versionado con Semantic Versioning

**Conversaciones con IA:**
- **Proyecto actual**: `resources/docs/IA chats/`
- **Template base**: `resources/documents/AI conversations/AI conversations - socgerFleet/` (NO modificar)

### **📝 Mantenimiento del Proyecto**

**Registro de Cambios (CHANGELOG):**

Este proyecto mantiene un registro detallado de todos los cambios en [CHANGELOG.md](CHANGELOG.md) siguiendo el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

**Workflow al implementar cambios:**

1. **Durante el desarrollo**: Añade tus cambios en la sección `[Unreleased]` del CHANGELOG
2. **Categoriza correctamente**:
   - `Added` - Nueva funcionalidad
   - `Changed` - Cambios en funcionalidad existente
   - `Deprecated` - Funcionalidad que se eliminará próximamente
   - `Removed` - Funcionalidad eliminada
   - `Fixed` - Corrección de bugs
   - `Security` - Parches de seguridad
   - `Technical` - Cambios técnicos, dependencias, refactoring

3. **Antes de un release**:
   ```bash
   # Actualiza version en package.json
   npm version minor  # o major, patch según corresponda
   
   # Mueve cambios de [Unreleased] a nueva versión en CHANGELOG.md
   # con fecha en formato YYYY-MM-DD
   
   # Commit y tag
   git add .
   git commit -m "chore: release v1.1.0"
   git tag v1.1.0
   git push && git push --tags
   ```

**Versionado Semántico (SemVer):**

El proyecto sigue [Semantic Versioning](https://semver.org/lang/es/) - `MAJOR.MINOR.PATCH`:
- **MAJOR** (1.0.0 → 2.0.0): Cambios incompatibles en la API (breaking changes)
- **MINOR** (1.0.0 → 1.1.0): Nueva funcionalidad compatible con versiones anteriores
- **PATCH** (1.0.0 → 1.0.1): Correcciones de bugs compatibles

**Ejemplos de cambios y su versionado:**

```
MAJOR (Breaking Changes):
- Cambiar estructura de respuesta de endpoints existentes
- Eliminar campos o endpoints
- Cambiar comportamiento fundamental de la API
- Actualizar a versión major de dependencias con breaking changes

MINOR (New Features):
- Añadir nuevos endpoints
- Agregar campos opcionales a entidades
- Implementar nueva funcionalidad sin afectar existente
- Agregar versionado de API (/v1/, /v2/)

PATCH (Bug Fixes):
- Corregir errores de validación
- Arreglar bugs de lógica
- Actualizar documentación
- Parches de seguridad sin breaking changes
```

**⚠️ Documentación de Breaking Changes:**

Cuando implementes cambios incompatibles, márcalos claramente:

```markdown
### Changed
- **BREAKING**: Cambio en estructura de respuesta de `/users`. 
  Ahora retorna `{ data: [], meta: {} }` en lugar de array directo
- **BREAKING**: Campo `username` ahora es requerido en registro
---

## 🤖 Guía para IA: Crear/Modificar Endpoints y Entidades

### ⚠️ **IMPORTANTE: Esta sección es una guía para asistentes de IA**

Al trabajar con este proyecto, sigue estas convenciones estrictamente:

### 📝 **1. Idioma de Comunicación**
- ✅ **SIEMPRE contestar en español** a los prompts del usuario
- ✅ Código y comentarios técnicos pueden estar en inglés
- ✅ Documentación en español (README, CHANGELOG, guías)

### 🔄 **2. Versionado de API (CRÍTICO)**

**Versión Actual:** v1.1.0 (API v1)

#### **Cuándo crear nueva versión (v2, v3, etc.):**

**Crear NUEVA versión si:**
- ❌ Eliminas campos de respuestas existentes
- ❌ Cambias tipos de datos (string → number, etc.)
- ❌ Eliminas endpoints completos
- ❌ Cambias formato de respuestas (estructura)
- ❌ Modificas comportamiento esperado de endpoints

**NO crear nueva versión (actualizar v1):**
- ✅ Agregas nuevos endpoints
- ✅ Agregas campos opcionales a respuestas
- ✅ Corriges bugs sin cambiar interfaz
- ✅ Mejoras de rendimiento sin cambios externos

#### **Sintaxis de versionado en controladores:**

```typescript
// CORRECTO: Versión en objeto de configuración
@Controller({ path: 'users', version: '1' })
export class UsersController {}

// INCORRECTO: No uses @Version como decorador separado
@Controller('users')
@Version('1')  // ❌ NO HACER ESTO
export class UsersController {}
```

#### **Proceso para crear v2:**

**ANTES DE CODIFICAR:**
1. Consulta: `resources/documents/AI conversations/AI conversations - socgerFleet/PASO-A-PASO-Crear-Nueva-Version-API.md`
2. Lee: `resources/documents/AI conversations/AI conversations - socgerFleet/GUIA-Versionado-API.md`
3. Sigue el proceso completo documentado

**Pasos básicos:**
1. Mantener v1 funcionando (backward compatibility)
2. Crear nuevos controladores/métodos con `version: '2'`
3. Actualizar `CHANGELOG.md` manualmente con sección `[2.0.0]`
4. Actualizar `package.json` a versión 2.0.0
5. Documentar breaking changes y guía de migración

### 🏗️ **3. Crear Nueva Entidad**

**Proceso OBLIGATORIO:**

```bash
# 1. Crear entidad en src/entities/
# 2. Extender de BaseEntity (incluye auditoría)
# 3. Generar migración
npm run migration:generate -- src/database/migrations/Add[NombreEntidad]

# 4. Revisar migración generada
# 5. Ejecutar migración
npm run migration:run

# 6. Verificar
npm run migration:show
```

**Estructura de entidad:**

```typescript
import { BaseEntity } from './base.entity';

@Entity('nombre_tabla')
export class MiEntidad extends BaseEntity {
  @Column()
  campo: string;
  
  // Relaciones, validaciones, etc.
}
```

**⚠️ NUNCA usar `synchronize: true` - Este proyecto usa migraciones**

### 🔌 **4. Crear Nuevo Endpoint**

**Checklist:**

- [ ] Definir versión del controlador: `@Controller({ path: 'recurso', version: '1' })`
- [ ] Crear DTO con class-validator
- [ ] Documentar con Swagger (@ApiOperation, @ApiResponse)
- [ ] Implementar lógica en Service
- [ ] Agregar guards si requiere autenticación (@UseGuards(JwtAuthGuard))
- [ ] Actualizar archivos de testing `.http`
- [ ] Compilar y probar: `npm run build`
- [ ] Verificar en Swagger: http://localhost:3000/api/docs
- [ ] **ACTUALIZAR CHANGELOG.md manualmente**

**Ejemplo completo:**

```typescript
@ApiTags('mi-recurso')
@Controller({ path: 'mi-recurso', version: '1' })
export class MiRecursoController {
  
  @Get()
  @ApiOperation({ summary: 'Listar recursos' })
  @ApiResponse({ status: 200, description: 'Lista obtenida' })
  async findAll(@Query() filters: MiRecursoFiltersDto) {
    return this.service.findAll(filters);
  }
  
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear recurso' })
  async create(@Body() dto: CreateMiRecursoDto) {
    return this.service.create(dto);
  }
}
```

### � **5. CRÍTICO: Filtros Booleanos en DTOs**

**⚠️ ESTE ES UN PROBLEMA COMÚN - LEER ANTES DE CREAR FILTROS**

Cuando creas DTOs de filtros con campos booleanos, **DEBES seguir este patrón obligatorio**:

**❌ INCORRECTO:**
```typescript
@Type(() => Boolean)  // ← NUNCA USAR ESTO
@IsBoolean()
isActive?: boolean;
```
**Problema:** `Boolean("false")` = `true` - El filtro falla con false

**✅ CORRECTO:**
```typescript
import { Transform } from 'class-transformer';  // ← IMPORTANTE

@IsBoolean()
@Transform(({ value }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
})
isActive?: boolean;
```

**En el servicio (método findAll o similar):**
```typescript
if (typeof filters.isActive === 'boolean') {
  // CRÍTICO: Convertir a 0/1 para MySQL TINYINT(1)
  queryBuilder.andWhere('entidad.isActive = :isActive', {
    isActive: filters.isActive ? 1 : 0,  // ← OBLIGATORIO
  });
}
```

**Por qué es importante:**
- Query parameters HTTP llegan como strings
- MySQL almacena booleanos como TINYINT(1): `0` o `1`
- Sin esta conversión: `?isActive=false` devuelve 0 resultados

**Referencia completa:** Ver `resources/documents/AI conversations/AI conversations - socgerFleet/035 - BOOLEAN-FILTERS-FIX - Cambios necesarios para poder filtrar booleanos en las sql con type ORM.md`

---

### �️ **6. CRÍTICO: Migraciones de Base de Datos**

**REGLA FUNDAMENTAL: SIEMPRE usa TypeORM Migrations**

#### ❌ **NO HACER:**

**NUNCA crear scripts SQL manuales en `docker/mysql/init/` para migraciones:**

```bash
# ❌ INCORRECTO - NO CREAR MÁS ARCHIVOS AQUÍ
docker/mysql/init/02_move_profile_fields.sql  # MAL ❌
docker/mysql/init/03_add_new_table.sql        # MAL ❌
```

**⚠️ Scripts en `docker/mysql/init/` son SOLO para inicialización del contenedor:**
- Se ejecutan una vez al crear el contenedor
- No hay tracking de ejecuciones
- No reversibles
- No funcionan en contenedores existentes

#### ✅ **HACER:**

**Usar SIEMPRE TypeORM Migrations:**

```bash
# 1. Modificar entidad en src/entities/
# 2. Generar migración automáticamente
npm run migration:generate src/database/migrations/DescripcionDelCambio

# 3. Revisar migración generada
cat src/database/migrations/[timestamp]-DescripcionDelCambio.ts

# 4. Ejecutar migración
npm run migration:run

# 5. Verificar estado
npm run migration:show
```

**Ventajas:**
- ✅ Tracking automático de qué se ejecutó
- ✅ Reversibles (`migration:revert`)
- ✅ Versionadas con el código
- ✅ Funcionan en producción
- ✅ Sincronizadas con entidades TypeScript

**Comandos disponibles:**
```bash
npm run migration:create src/database/migrations/Nombre  # Crear vacía
npm run migration:generate src/database/migrations/Nombre # Generar automática
npm run migration:run      # Ejecutar pendientes
npm run migration:revert   # Revertir última
npm run migration:show     # Ver estado
```

**Referencias:**
- [AGENTS.md](AGENTS.md) - Sección "Sistema de Migraciones de Base de Datos"
- [DEVELOPMENT-NOTES.md](DEVELOPMENT-NOTES.md) - Recordatorio crítico #1
- [data-source.ts](src/database/data-source.ts) - Configuración
- [TypeORM Migrations](https://typeorm.io/migrations) - Documentación oficial

---

### 📦 **7. Modificar Entidad Existente**

**Proceso:**

```bash
# 1. Modificar entidad en src/entities/
# 2. Generar migración
npm run migration:generate -- src/database/migrations/Update[NombreEntidad]

# 3. REVISAR migración (crítico)
cat src/database/migrations/[timestamp]-Update[NombreEntidad].ts

# 4. Si es correcto, ejecutar
npm run migration:run

# 5. Verificar
npm run migration:show
```

**Si el cambio rompe compatibilidad:**
- ⚠️ Crear nueva versión de API (v2)
- ⚠️ Seguir guía: PASO-A-PASO-Crear-Nueva-Version-API.md

### 📋 **8. Actualizar CHANGELOG.md**

**OBLIGATORIO después de cada cambio significativo:**

```markdown
## [1.X.X] - 2026-XX-XX

### Added
- Nuevo endpoint `/v1/recurso` con filtros avanzados

### Changed
- Mejorado rendimiento de búsqueda en usuarios

### Fixed
- Corregido bug en paginación con filtros combinados

### Deprecated
- Endpoint `/v1/old-endpoint` será removido en v2.0.0
```

**Formato:** Sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)

### 🧪 **8. Testing**

**Antes de considerar completo:**

```bash
# Compilar
npm run build

# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Probar manualmente con archivos .http
# Verificar Swagger
```

### 📚 **9. Documentación de Referencia**

**Lee estos documentos antes de cambios mayores:**

- `resources/documents/AI conversations/AI conversations - socgerFleet/GUIA-Crear-Nuevas-Entidades.md`
- `resources/documents/AI conversations/AI conversations - socgerFleet/GUIA-Versionado-API.md`
- `resources/documents/AI conversations/AI conversations - socgerFleet/PASO-A-PASO-Crear-Nueva-Version-API.md`
- `CHANGELOG.md` - Ver historial de cambios

### ⚡ **10. Comandos Rápidos de Referencia**

```bash
# Base de datos
docker compose up -d                    # Iniciar MySQL
npm run migration:generate -- src/...   # Generar migración
npm run migration:run                   # Ejecutar migraciones
npm run migration:revert               # Revertir última migración
npm run seed:run                        # Poblar datos iniciales

# Desarrollo
npm run build                           # Compilar
npm run start:dev                       # Modo desarrollo (watch)
npm run start:prod                      # Modo producción

# Testing
npm run test                            # Tests unitarios
npm run test:e2e                        # Tests e2e
npm run lint                            # Linter

# Git (para AI que crea cambios)
git status                              # Ver cambios
git add .                               # Agregar todos
git commit -m "feat: descripción"      # Commit
```

### ✅ **11. Checklist Final (AI)**

Antes de reportar cambio como completo:

- [ ] Código compila sin errores (`npm run build`)
- [ ] Tests pasan (`npm run test`)
- [ ] Documentación Swagger actualizada
- [ ] Archivos `.http` actualizados (si aplica)
- [ ] CHANGELOG.md actualizado manualmente
- [ ] package.json actualizado (si cambió versión)
- [ ] Migraciones ejecutadas y verificadas
- [ ] Sin breaking changes (o nueva versión creada)
- [ ] Guías de referencia consultadas

---

```

## 📊 Como contestar a los prompt's que se hagan a la IA
Siempre se debe de contestar en español

## 🎯 Casos de Uso

### **Ideal para:**
- 🌐 **Aplicaciones web modernas** (React, Angular, Vue)
- 📱 **Apps móviles** (Flutter, React Native)
- 🏢 **Sistemas empresariales** con gestión de usuarios
- 🔐 **APIs que requieren seguridad avanzada**
- 📊 **Dashboards administrativos**

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver [`LICENSE`](LICENSE) para más detalles.

## 👤 Autor

**Tu Nombre**
- GitHub: [@socger](https://github.com/socger)
- Email: socger@gmail.com

---

<div align="center">
  <p>⭐ ¡Dale una estrella si te gusta el proyecto! ⭐</p>
</div>
