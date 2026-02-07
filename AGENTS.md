# SocgerFleet - Agent Documentation

## ⚠️ INSTRUCCIÓN CRÍTICA PARA ASISTENTES DE IA

**ANTES DE HACER CUALQUIER CAMBIO, LEE ESTOS DOCUMENTOS:**

### 📄 Documentación en Raíz del Proyecto (OBLIGATORIA)
1. **[AGENTS.md](AGENTS.md)** - Este archivo - Documentación principal
2. **[DEVELOPMENT-NOTES.md](DEVELOPMENT-NOTES.md)** - Recordatorios críticos de desarrollo
3. **[README.md](README.md)** - Especialmente sección "🤖 Guía para IA"
4. **[CHANGELOG.md](CHANGELOG.md)** - Historial de cambios y versiones

### 📚 Documentación en `resources/documents/AI conversations/` (OBLIGATORIA)
**Lee todos los archivos en esta carpeta y sus subcarpetas** antes de hacer cambios mayores:

**Carpetas organizadas:**
- `AI conversations - socgerFleet/` - Documentación del proyecto template base (NO modificar)
  - Archivos con formato `PASO-A-PASO-*.md` - Guías de procesos específicos
  - Archivos con formato `GUIA-*.md` - Documentación general
  - Archivo `035-BOOLEAN-FILTERS-FIX...md` - **CRÍTICO** si creas DTOs con filtros
- `IA chats/` - **Documentación de este proyecto** (crear nuevos .md AQUÍ)
  - Organizar por features: `001 - Nombre Feature/`, `002 - Otra Feature/`
  - Archivos numerados: `001-1-descripcion.md`, `001-2-implementacion.md`

**⚠️ REGLAS CRÍTICAS:**
- ✅ **CREAR nuevos .md EN**: `resources/docs/IA chats/`
- ❌ **NO CREAR EN**: `resources/documents/AI conversations/` (raíz de la carpeta)
- ❌ **NO MODIFICAR**: `resources/documents/AI conversations/AI conversations - socgerFleet/`

### 🔴 CRÍTICO: Problema Frecuente - Filtros Booleanos
**Este es el error más común en DTOs de filtros:**
- ❌ INCORRECTO: `?isActive=false` → Devuelve 0 resultados
- ✅ CORRECTO: Usar `@Transform` con conversión explícita

**Ubica rápidamente cómo hacerlo:**
- DEVELOPMENT-NOTES.md (tabla de contents)
- AGENTS.md (buscar "CRÍTICO: Manejo de Campos Booleanos")
- README.md (sección 5 de "Guía para IA")

---

## 📋 Proyecto Overview

**SocgerFleet** es una aplicación backend robusta desarrollada con **NestJS** y **TypeScript** que implementa un sistema completo de gestión de usuarios, roles y autenticación con refresh tokens. El proyecto está diseñado para ser una base sólida para aplicaciones empresariales que requieren control de acceso granular y gestión de usuarios.

### 🎯 Características Principales

- ✅ **Autenticación JWT completa** con access tokens (15 min) y refresh tokens (7 días)
- ✅ **Sistema de roles y permisos** con control de acceso basado en roles (RBAC)
- ✅ **CRUD completo de usuarios y roles** con validaciones avanzadas
- ✅ **Filtros y búsqueda avanzada** con paginación en todos los endpoints
- ✅ **Seguridad robusta** con bcrypt, guards, y rotación de tokens
- ✅ **Base de datos MySQL** con TypeORM y relaciones entre entidades
- ✅ **Documentación completa** con endpoints de prueba incluidos

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Framework** | NestJS | 10.0.0 |
| **Lenguaje** | TypeScript | 5.1.3 |
| **Base de Datos** | MySQL | 8.0 |
| **ORM** | TypeORM | 0.3.26 |
| **Autenticación** | JWT + Passport | 11.0.0 |
| **Validación** | Class Validator | 0.14.2 |
| **Hashing** | bcrypt | 6.0.0 |
| **Containerización** | Docker | Latest |

### Estructura del Proyecto

```
src/
├── auth/                    # Módulo de autenticación
│   ├── decorators/         # Decoradores personalizados (@Roles)
│   ├── dto/               # DTOs para login, registro, refresh
│   ├── guards/            # Guards JWT, Local, Roles
│   ├── interfaces/        # Interfaces de tipos
│   ├── services/          # Servicio de refresh tokens
│   ├── strategies/        # Estrategias JWT y Local
│   ├── auth.controller.ts # Endpoints de autenticación
│   ├── auth.module.ts     # Configuración del módulo
│   └── auth.service.ts    # Lógica de autenticación
├── users/                  # Módulo de usuarios
│   ├── dto/               # DTOs para crear, actualizar, filtrar
│   ├── users.controller.ts # CRUD de usuarios
│   ├── users.module.ts    # Configuración del módulo
│   └── users.service.ts   # Lógica de usuarios
├── roles/                  # Módulo de roles
│   ├── dto/               # DTOs para crear, actualizar, filtrar
│   ├── roles.controller.ts # CRUD de roles
│   ├── roles.module.ts    # Configuración del módulo
│   └── roles.service.ts   # Lógica de roles
├── entities/              # Entidades de base de datos
│   ├── user.entity.ts     # Entidad Usuario
│   ├── role.entity.ts     # Entidad Rol
│   └── refresh-token.entity.ts # Entidad Refresh Token
├── database/              # Configuración de base de datos
└── main.ts               # Punto de entrada de la aplicación
```

## 🔐 Sistema de Autenticación

### Funcionamiento de Tokens

#### Access Tokens
- **Duración**: 15 minutos
- **Propósito**: Acceso a recursos protegidos
- **Contenido**: ID usuario, email, username, roles
- **Almacenamiento**: Cliente (localStorage/memoria)

#### Refresh Tokens
- **Duración**: 7 días
- **Propósito**: Renovar access tokens expirados
- **Características**: 
  - Rotación automática (nuevo token en cada refresh)
  - Tracking de dispositivos e IPs
  - Revocación individual o masiva
  - Limpieza automática de tokens expirados

### Endpoints de Autenticación

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/auth/register` | POST | Registro de nuevos usuarios |
| `/auth/login` | POST | Inicio de sesión con credenciales |
| `/auth/refresh` | POST | Renovar access token |
| `/auth/logout` | POST | Logout individual (revoca un refresh token) |
| `/auth/logout-all` | POST | Logout masivo (revoca todos los tokens) |
| `/auth/profile` | POST | Obtener información del usuario autenticado |

### Flujo de Autenticación

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as Auth Service
    participant DB as Database
    
    C->>A: POST /auth/login (credenciales)
    A->>DB: Validar usuario
    A->>DB: Crear refresh token
    A-->>C: {accessToken, refreshToken}
    
    Note over C: Usar accessToken (15min)
    
    C->>A: Request con token expirado
    A-->>C: 401 Unauthorized
    
    C->>A: POST /auth/refresh (refreshToken)
    A->>DB: Validar refresh token
    A->>DB: Crear nuevo refresh token
    A->>DB: Revocar token anterior
    A-->>C: {nuevo accessToken, nuevo refreshToken}
```

## 👥 Sistema de Usuarios y Roles

### Entidades Principales

#### Usuario (User)
```typescript
{
  id: number;
  username: string;      // Único
  email: string;         // Único
  password: string;      // Hasheado con bcrypt
  firstName?: string;
  lastName?: string;
  isActive: boolean;     // Estado del usuario
  roles: Role[];         // Relación muchos a muchos
  createdAt: Date;
  updatedAt: Date;
}
```

#### Rol (Role)
```typescript
{
  id: number;
  name: string;          // Único (admin, user, editor)
  description?: string;
  users: User[];         // Relación muchos a muchos
  createdAt: Date;
  updatedAt: Date;
}
```

#### Refresh Token
```typescript
{
  id: number;
  token: string;         // Hash único del token
  userId: number;        // Referencia al usuario
  expiresAt: Date;       // Fecha de expiración
  isRevoked: boolean;    // Estado del token
  deviceInfo?: string;   // Información del dispositivo
  ipAddress?: string;    // IP del cliente
  createdAt: Date;
}
```

### Control de Acceso (RBAC)

#### Roles Predefinidos
- **admin**: Acceso completo a todos los recursos
- **user**: Acceso básico limitado

#### Guards Implementados
- **JwtAuthGuard**: Valida access tokens
- **LocalAuthGuard**: Autenticación con credenciales
- **RolesGuard**: Control de acceso basado en roles

#### Uso de Decoradores
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('users')
async getUsers() {
  // Solo administradores pueden acceder
}
```

## 🔍 Sistema de Filtros y Búsqueda

### Características Avanzadas

#### Para Usuarios
- **Búsqueda general**: `?search=término`
- **Filtros específicos**: 
  - `?username=valor`
  - `?email=valor`
  - `?firstName=valor&lastName=valor`
  - `?isActive=true|false`
  - `?roleName=admin`
  - `?roleId=1`
- **Filtros de fecha**: `?createdFrom=2025-01-01&createdTo=2025-12-31`
- **Ordenamiento**: `?sortBy=username&sortOrder=ASC|DESC`
- **Paginación**: `?page=1&limit=10`

#### Para Roles
- **Búsqueda general**: `?search=término`
- **Filtros específicos**:
  - `?name=admin`
  - `?description=término`
  - `?minUsers=1&maxUsers=10`
- **Ordenamiento avanzado**: `?sortBy=userCount&sortOrder=DESC`

### Ejemplos de Uso

```http
# Buscar usuarios activos con rol admin, ordenados por fecha
GET /users?isActive=true&roleName=admin&sortBy=createdAt&sortOrder=DESC&page=1&limit=5

# Buscar roles con más de 2 usuarios
GET /roles?minUsers=2&sortBy=userCount&sortOrder=DESC

# Búsqueda rápida de usuarios
GET /users/search?q=admin&limit=5
```

## 🐳 Configuración de Docker

### Docker Compose
El proyecto incluye una configuración completa de Docker con:

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: socgerfleet
      MYSQL_USER: socger
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/mysql/init:/docker-entrypoint-initdb.d

  phpmyadmin:
    image: phpmyadmin:latest
    ports:
      - "8080:80"
    depends_on:
      - mysql
```

### Inicialización de Base de Datos
- **Archivo**: `docker/mysql/init/01_create_tables.sql`
- **Función**: Setup inicial del contenedor - Crear estructura base y datos de prueba
- **Usuario admin predefinido**: admin@socgerfleet.com / admin123
- **⚠️ IMPORTANTE**: Estos scripts SQL **NO son migraciones**. Solo se ejecutan cuando se crea el contenedor por primera vez. Para cambios evolutivos de la BD, usar **TypeORM Migrations** (ver sección "Sistema de Migraciones" en este documento).

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+ con npm
- Docker y Docker Compose
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repositorio>
cd socgerfleet
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env con:
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=socger
DB_PASSWORD=dcb4f2e8106a0ef44c3f530d3ae3f9fd
DB_NAME=socgerfleet
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=15m
```

4. **Iniciar servicios Docker**
```bash
docker-compose up -d
```

5. **Ejecutar la aplicación**
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

### Acceso a Servicios
- **API**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
- **Base de datos**: localhost:3306

## 🧪 Testing y Desarrollo

### Scripts Disponibles
```bash
npm run start:dev      # Desarrollo con watch mode
npm run build          # Compilar para producción
npm run test           # Ejecutar tests unitarios
npm run test:e2e       # Ejecutar tests end-to-end
npm run lint           # Verificar código con ESLint
npm run format         # Formatear código con Prettier
```

### Tests de API
El proyecto incluye archivos de test completos:

- **api-tests.http**: Tests de CRUD de usuarios y roles
- **refresh-tokens-tests.http**: Tests de sistema de autenticación

### Usar REST Client Extension
1. Instalar "REST Client" en VS Code
2. Abrir archivos `.http` en `test endpoints with REST CLIENT extension/`
3. Hacer clic en "Send Request" sobre cada endpoint

## 📊 Casos de Uso Principales

### 1. Gestión de Usuarios
```typescript
// Crear usuario con roles
POST /users
{
  "username": "nuevo_usuario",
  "email": "user@domain.com",
  "password": "password123",
  "firstName": "Nombre",
  "lastName": "Apellido",
  "roleIds": [2] // Asignar rol de usuario
}

// Buscar usuarios activos con filtros
GET /users?isActive=true&search=admin&page=1&limit=10
```

### 2. Control de Acceso
```typescript
// Login y obtención de tokens
POST /auth/login
{
  "email": "admin@socgerfleet.com",
  "password": "admin123"
}

// Renovar token expirado
POST /auth/refresh
{
  "refreshToken": "token_refresh_actual"
}
```

### 3. Gestión de Roles
```typescript
// Crear nuevo rol
POST /roles
{
  "name": "editor",
  "description": "Editor de contenido"
}

// Asignar rol a usuario
POST /users/{userId}/roles/{roleId}
```

## 🔒 Seguridad Implementada

### Medidas de Seguridad
- ✅ **Hash de contraseñas** con bcrypt (salt rounds: 10)
- ✅ **Validación de entrada** con class-validator
- ✅ **Sanitización de datos** automática
- ✅ **Control de acceso** basado en roles
- ✅ **Rotación de refresh tokens** por seguridad
- ✅ **Tracking de dispositivos** e IPs
- ✅ **Limpieza automática** de tokens expirados
- ✅ **Exclusión de campos sensibles** en respuestas

### Configuración de JWT
```typescript
{
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '15m' }, // Access token
  // Refresh tokens: 7 días configurables
}
```

## 📈 Métricas y Monitoring

### Endpoints de Salud
- `GET /`: Verificar que la aplicación esté funcionando
- Logs automáticos de errores y operaciones

### Base de Datos
- Índices optimizados en campos únicos
- Relaciones con CASCADE para integridad
- Timestamps automáticos (createdAt, updatedAt)

---

## ⚠️ Consideraciones Importantes para Desarrollo

### 🔴 CRÍTICO: Manejo de Campos Booleanos en Filtros

**Cuando crees nuevos DTOs de filtros con campos booleanos, SIEMPRE sigue este patrón:**

#### Problema
Los query parameters HTTP llegan como **strings**, no como booleanos. Esto causa:
- `?isActive=false` se convierte a `Boolean("false")` = `true` ❌
- `?isActive=true` se convierte a `Boolean("true")` = `true` ✅ (parcialmente correcto)
- MySQL almacena booleanos como TINYINT(1): `0` o `1`
- Comparaciones SQL incorrectas: `WHERE is_active = true` (no coincide con 0 ni 1)

#### Solución - Patrón a Seguir

**En el DTO de filtros:**
```typescript
import { Type, Transform } from 'class-transformer';  // ← Importar Transform
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MiFilterDto {
  @ApiPropertyOptional({
    description: 'Descripción del campo booleano',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    // ← IMPORTANTE: @Transform SIEMPRE después de @IsBoolean()
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;  // Devuelve valor original para validación
  })
  miCampoBooleano?: boolean;
}
```

**En el servicio (método que usa la query):**
```typescript
if (typeof filters.miCampoBooleano === 'boolean') {
  // Convertir booleano a número para MySQL (0 o 1)
  queryBuilder.andWhere('entidad.miCampoBooleano = :miCampoBooleano', {
    miCampoBooleano: filters.miCampoBooleano ? 1 : 0,  // ← CRÍTICO
  });
}
```

#### Checklist para Code Review
- [ ] ¿El campo está en un DTO de filtros (no en create/update)?
- [ ] ¿Se usa como query parameter en un GET?
- [ ] ¿Importaste `Transform` de `class-transformer`?
- [ ] ¿El orden de decoradores es: `@IsBoolean()` → `@Transform(...)`?
- [ ] ¿Convertiste a 0/1 en la query SQL?
- [ ] ¿Probaste con `true` y `false`?
- [ ] ¿Verificaste los logs SQL para confirmar `PARAMETERS: [1]` o `[0]`?

#### Campos Booleanos Existentes que Requieren Este Patrón

Si creas endpoints GET con filtros, aplica este patrón a:
- `User.isActive` - ✅ Ya implementado
- `User.emailVerified` - Si se agrega filtro
- `RefreshToken.isRevoked` - Si se crea endpoint GET
- `LoginAttempt.isSuccessful` - Si se crea consulta
- `VerificationToken.isUsed` - Si se crea endpoint de administración

#### Referencias
- **Documentación completa**: [BOOLEAN-FILTERS-FIX.md](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/035%20-%20BOOLEAN-FILTERS-FIX%20-%20Cambios%20necesarios%20para%20poder%20filtrar%20booleanos%20en%20las%20sql%20con%20type%20ORM.md)
- **NestJS Serialization**: https://docs.nestjs.com/techniques/serialization
- **Class Transformer**: https://github.com/typestack/class-transformer

---

### 🔴 CRÍTICO: Sistema de Migraciones de Base de Datos

**REGLA FUNDAMENTAL: SIEMPRE usa TypeORM Migrations para cambios en la base de datos.**

#### ❌ NO HACER - Scripts SQL Manuales

**NUNCA crear archivos SQL en `docker/mysql/init/` para migraciones:**

```bash
# ❌ INCORRECTO - NO CREAR MÁS ARCHIVOS AQUÍ
docker/mysql/init/
  ├── 01_create_tables.sql          # Solo para setup inicial
  ├── 02_move_profile_fields.sql    # ❌ MAL - Debió ser migración TypeORM
  └── 03_nueva_tabla.sql            # ❌ MAL - NO HACER ESTO
```

**Problemas de los scripts SQL manuales:**
- ❌ Solo se ejecutan cuando se crea el contenedor por primera vez
- ❌ No hay tracking de qué migraciones se ejecutaron
- ❌ No se pueden revertir automáticamente (`down()`)
- ❌ No están versionadas con el código
- ❌ Difíciles de sincronizar con cambios en entidades TypeScript
- ❌ No funcionan en entornos de producción existentes

#### ✅ HACER - TypeORM Migrations

**SIEMPRE usa el sistema de migraciones de TypeORM/NestJS:**

```bash
# ✅ CORRECTO - Estructura del proyecto
src/database/
  ├── data-source.ts                      # Configuración de TypeORM
  └── migrations/                         # Carpeta de migraciones
      ├── 1737158400000-InitialSchema.ts  # Migración inicial
      ├── 1768854380268-AddLoginAttempts.ts
      ├── 1769160948978-AddProfileEntities.ts
      └── [timestamp]-MiNuevaMigracion.ts # ✅ Crear aquí
```

#### Comandos de Migraciones

```bash
# 1. Crear migración vacía (para escribir manualmente)
npm run migration:create src/database/migrations/MiNuevaMigracion

# 2. Generar migración desde cambios en entidades (RECOMENDADO)
npm run migration:generate src/database/migrations/AddNuevoCampo

# 3. Ejecutar migraciones pendientes
npm run migration:run

# 4. Revertir última migración
npm run migration:revert

# 5. Ver estado de migraciones
npm run migration:show
```

#### Estructura de una Migración TypeORM

```typescript
// src/database/migrations/1738972800000-AddPhoneToUsers.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhoneToUsers1738972800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // APLICAR cambios
    await queryRunner.addColumn('users', new TableColumn({
      name: 'phone',
      type: 'varchar',
      length: '15',
      isNullable: true,
      comment: 'Número de teléfono del usuario'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REVERTIR cambios
    await queryRunner.dropColumn('users', 'phone');
  }
}
```

#### Flujo de Trabajo para Cambios en BD

1. **Modificar entidad TypeScript**:
   ```typescript
   // src/entities/user.entity.ts
   @Column({ type: 'varchar', length: 15, nullable: true })
   phone?: string;
   ```

2. **Generar migración automática**:
   ```bash
   npm run migration:generate src/database/migrations/AddPhoneToUsers
   ```

3. **Revisar migración generada** (TypeORM la crea automáticamente)

4. **Ejecutar migración**:
   ```bash
   npm run migration:run
   ```

5. **Verificar en BD** (phpMyAdmin o MySQL Workbench)

6. **Commit de la migración** junto con los cambios de código

#### Casos Especiales

**Migración de datos complejos:**
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // 1. Agregar columnas
  await queryRunner.addColumn('users', ...);
  
  // 2. Migrar datos existentes
  await queryRunner.query(`
    UPDATE users u
    INNER JOIN provider_profiles pp ON u.id = pp.user_id
    SET u.phone = pp.phone
    WHERE u.phone IS NULL
  `);
  
  // 3. Eliminar columnas antiguas
  await queryRunner.dropColumn('provider_profiles', 'phone');
}
```

#### Verificación de Estado

```bash
# Ver qué migraciones están pendientes/ejecutadas
npm run migration:show

# Salida esperada:
✓ InitialSchema1737158400000
✓ AddLoginAttempts1768854380268
✓ AddProfileEntities1769160948978
⬜ AddPhoneToUsers1738972800000  ← Pendiente
```

#### Referencias
- **TypeORM Migrations**: https://typeorm.io/migrations
- **NestJS Database**: https://docs.nestjs.com/techniques/database
- **Configuración del proyecto**: [src/database/data-source.ts](src/database/data-source.ts)
- **Scripts NPM**: Ver [package.json](package.json) líneas 21-25

#### ⚠️ Nota sobre `docker/mysql/init/`

Los archivos SQL en `docker/mysql/init/` son **SOLO para inicialización del contenedor Docker**:
- Se ejecutan una sola vez cuando creas el contenedor por primera vez
- Útiles para: setup inicial, datos de prueba, usuario admin
- **NO son migraciones** - No usar para cambios evolutivos de la BD
- Si el contenedor ya existe, estos scripts NO se ejecutan

---

## 🚀 Próximas Mejoras Sugeridas

### Funcionalidades Pendientes
- [ ] **Rate limiting** para prevenir ataques de fuerza bruta
- [ ] **Logs estructurados** con Winston
- [ ] **Métricas de performance** con Prometheus
- [ ] **Cache** con Redis para consultas frecuentes
- [ ] **Notificaciones** por email (registro, cambio de password)
- [ ] **2FA** (Two-Factor Authentication)
- [ ] **Swagger/OpenAPI** para documentación automática
- [ ] **Tests automatizados** más completos
- [ ] **CI/CD Pipeline** con GitHub Actions

### Optimizaciones Técnicas
- [ ] **Soft delete** para usuarios y roles
- [ ] **Audit log** para tracking de cambios
- [ ] **Conexiones de DB** optimizadas con pool
- [ ] **Validaciones personalizadas** más avanzadas
- [ ] **Middlewares** de logging y error handling

## 📞 Información de Contacto

- **Proyecto**: SocgerFleet Backend API
- **Framework**: NestJS 10.0.0
- **Documentación**: Este archivo AGENTS.md
- **Tests**: Carpeta `test endpoints with REST CLIENT extension/`

### Links Útiles
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [JWT.io](https://jwt.io) para debugging de tokens

---

> **Nota**: Este proyecto está listo para producción con todas las características de seguridad y funcionalidad implementadas. Para uso en producción, asegúrate de cambiar las credenciales por defecto y configurar variables de entorno seguras.