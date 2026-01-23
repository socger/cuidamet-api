# Guía Paso a Paso: Crear Nueva Versión de API (v1 → v2)

## 📋 Índice
1. [Planificación Previa](#1-planificación-previa)
2. [Preparar el Entorno](#2-preparar-el-entorno)
3. [Cambios en el Código](#3-cambios-en-el-código)
4. [Actualizar CHANGELOG](#4-actualizar-changelog)
5. [Actualizar package.json](#5-actualizar-packagejson)
6. [Testing](#6-testing)
7. [Compilar y Probar](#7-compilar-y-probar)
8. [Documentación Final](#8-documentación-final)
9. [Despliegue](#9-despliegue)

---

## 1. Planificación Previa

### ¿Cuándo crear una nueva versión?

**Crear v2 cuando haya cambios BREAKING:**
- ❌ Eliminar campos de respuestas
- ❌ Cambiar tipos de datos (string → number)
- ❌ Eliminar endpoints completos
- ❌ Cambiar formato de respuestas
- ❌ Cambiar comportamiento esperado

**NO crear nueva versión (solo actualizar v1):**
- ✅ Agregar nuevos endpoints
- ✅ Agregar campos opcionales
- ✅ Mejoras de rendimiento sin cambios de interfaz
- ✅ Corrección de bugs

### Ejemplo de Escenario Real

**Situación:** Queremos mejorar el endpoint de usuarios para devolver paginación cursor-based en lugar de page-based.

**Cambio Breaking:**
```json
// v1 (actual)
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}

// v2 (nuevo)
{
  "data": [...],
  "meta": {
    "cursor": "eyJpZCI6MTB9",
    "hasMore": true,
    "pageSize": 10
  }
}
```

---

## 2. Preparar el Entorno

### Paso 2.1: Crear rama de desarrollo

```bash
cd /home/socger/trabajo/socger/socgerfleet

# Asegurarse de estar en main/master actualizado
git checkout main
git pull origin main

# Crear nueva rama para la v2
git checkout -b feature/api-v2

# Verificar rama actual
git branch
```

### Paso 2.2: Asegurar que todo funciona

```bash
# Compilar proyecto actual
npm run build

# Verificar que no hay errores
# Si hay errores, corregirlos antes de continuar
```

### Paso 2.3: Iniciar base de datos (si está apagada)

```bash
# Iniciar Docker con MySQL
docker compose up -d

# Verificar que MySQL está corriendo
docker compose ps

# Debería mostrar:
# NAME                          STATUS
# socgerfleet-mysql-1           Up
```

---

## 3. Cambios en el Código

### Paso 3.1: Decidir estrategia de versionado

**Opción A: Mantener ambas versiones (RECOMENDADO para transición)**
- v1 sigue funcionando
- v2 implementa nuevas funcionalidades
- Período de transición de 3-6 meses

**Opción B: Solo v2 (si no hay clientes en producción)**
- Reemplazar completamente v1
- Más simple pero rompe clientes existentes

**Para este ejemplo usaremos Opción A**

### Paso 3.2: Duplicar o Modificar Controlador

#### Ejemplo: Crear v2 de UsersController

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet

# Crear backup del controlador actual (opcional pero recomendado)
cp src/users/users.controller.ts src/users/users.controller.v1.backup
```

**Código en `src/users/users.controller.ts`:**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserFiltersDto } from './dto/user-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ===================================
// CONTROLADOR V1 (Mantener funcionando)
// ===================================
@ApiTags('users (v1)')
@Controller({ path: 'users', version: '1' })
@UseInterceptors(ClassSerializerInterceptor)
export class UsersControllerV1 {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar usuarios v1',
    description: 'Endpoint v1 con paginación tradicional (page/limit). Será deprecado el 2026-06-01'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filters: UserFiltersDto,
  ) {
    return this.usersService.findAll(paginationDto, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID (v1)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // ... resto de métodos v1
}

// ===================================
// CONTROLADOR V2 (Nueva versión mejorada)
// ===================================
@ApiTags('users (v2)')
@Controller({ path: 'users', version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
export class UsersControllerV2 {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar usuarios v2 (Nuevo)',
    description: 'Endpoint v2 con paginación cursor-based mejorada y campos adicionales'
  })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Cursor de paginación' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  async findAll(
    @Query('cursor') cursor?: string,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize?: number,
    @Query() filters?: UserFiltersDto,
  ) {
    // Llamar a un nuevo método del servicio con lógica cursor-based
    return this.usersService.findAllV2(cursor, pageSize, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID (v2)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado con campos adicionales (createdAt, updatedAt en formato ISO)',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // Puede usar el mismo servicio o uno modificado
    return this.usersService.findOneV2(id);
  }

  // ... resto de métodos v2 con mejoras
}
```

### Paso 3.3: Actualizar el módulo de usuarios

**Archivo: `src/users/users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersControllerV1, UsersControllerV2 } from './users.controller';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { PasswordHistory } from '../entities/password-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, PasswordHistory])],
  controllers: [UsersControllerV1, UsersControllerV2], // Ambas versiones
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### Paso 3.4: Actualizar Service (si es necesario)

**Archivo: `src/users/users.service.ts`**

```typescript
// Mantener métodos existentes para v1
async findAll(paginationDto: PaginationDto, filters: UserFiltersDto) {
  // Lógica actual (page-based pagination)
  // NO MODIFICAR - lo usan clientes v1
}

// Agregar nuevos métodos para v2
async findAllV2(
  cursor: string | undefined,
  pageSize: number,
  filters: UserFiltersDto,
) {
  // Nueva lógica con cursor-based pagination
  const queryBuilder = this.userRepository.createQueryBuilder('user');
  
  // Si hay cursor, decodificarlo y usar como punto de partida
  if (cursor) {
    const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString());
    queryBuilder.where('user.id > :lastId', { lastId: decodedCursor.id });
  }
  
  // Aplicar filtros
  if (filters.search) {
    queryBuilder.andWhere(
      '(user.username LIKE :search OR user.email LIKE :search)',
      { search: `%${filters.search}%` }
    );
  }
  
  // Obtener pageSize + 1 para saber si hay más resultados
  const users = await queryBuilder
    .take(pageSize + 1)
    .orderBy('user.id', 'ASC')
    .leftJoinAndSelect('user.roles', 'roles')
    .getMany();
  
  const hasMore = users.length > pageSize;
  const results = hasMore ? users.slice(0, pageSize) : users;
  
  // Generar cursor para siguiente página
  let nextCursor = null;
  if (hasMore) {
    const lastUser = results[results.length - 1];
    nextCursor = Buffer.from(JSON.stringify({ id: lastUser.id })).toString('base64');
  }
  
  return {
    message: 'Lista de usuarios obtenida exitosamente (v2)',
    data: results,
    meta: {
      cursor: nextCursor,
      hasMore,
      pageSize,
    },
  };
}

async findOneV2(id: number) {
  // Puede ser igual o agregar más información
  const user = await this.userRepository.findOne({
    where: { id },
    relations: ['roles'],
  });
  
  if (!user) {
    throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
  }
  
  // Retornar con formato mejorado
  return {
    message: 'Usuario obtenido exitosamente (v2)',
    data: user,
    meta: {
      version: 2,
      fetchedAt: new Date().toISOString(),
    },
  };
}
```

### Paso 3.5: Aplicar lo mismo a otros controladores si es necesario

Si necesitas versionar `auth` o `roles`, repite los pasos 3.2-3.4 para cada controlador.

**Terminal:**
```bash
# Para auth controller
cp src/auth/auth.controller.ts src/auth/auth.controller.v1.backup

# Para roles controller  
cp src/roles/roles.controller.ts src/roles/roles.controller.v1.backup

# Luego editar cada archivo siguiendo el mismo patrón
```

---

## 4. Actualizar CHANGELOG

### Paso 4.1: Abrir CHANGELOG.md

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet
code CHANGELOG.md
# O usar tu editor favorito:
# nano CHANGELOG.md
# vim CHANGELOG.md
```

### Paso 4.2: Agregar entrada para v2.0.0

**Archivo: `CHANGELOG.md`**

```markdown
# Changelog

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Planeado
- Sistema de webhooks para integraciones
- Rate limiting y throttling

---

## [2.0.0] - 2026-01-19

### Added
- **API v2 con mejoras significativas**
  - Endpoint `/v2/users` con paginación cursor-based
  - Respuestas mejoradas con más metadatos
  - Formato de fechas ISO 8601 consistente
  - Campo `fetchedAt` en respuestas para tracking
  - Nuevo parámetro `cursor` y `pageSize` en lugar de `page` y `limit`

- **Mejoras de documentación**
  - Swagger actualizado con documentación v1 y v2
  - Tags separados para cada versión ('users (v1)', 'users (v2)')
  - Ejemplos de migración de v1 a v2

### Changed
- Estructura de respuestas de paginación (breaking change)
- Formato de metadatos en respuestas

### Deprecated
- **API v1 será descontinuada el 2026-06-01** (5 meses desde hoy)
  - Endpoint `/v1/users` con paginación tradicional
  - Clientes deben migrar a `/v2/users` antes de la fecha límite
  - Ver guía de migración: [docs/MIGRATION-v1-to-v2.md]

### Breaking Changes
- ⚠️ **Cambio en estructura de paginación:**
  - Eliminado: `meta.page`, `meta.limit`, `meta.total`, `meta.totalPages`
  - Agregado: `meta.cursor`, `meta.hasMore`, `meta.pageSize`
- ⚠️ **Fechas ahora en formato ISO 8601** en lugar de timestamps Unix
- ⚠️ **Parámetros de query cambiaron:**
  - `page` → `cursor`
  - `limit` → `pageSize`

### Migration Guide

#### De v1 a v2:

**Antes (v1):**
```javascript
// Petición
GET /v1/users?page=2&limit=10

// Respuesta
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Después (v2):**
```javascript
// Primera petición
GET /v2/users?pageSize=10

// Respuesta
{
  "data": [...],
  "meta": {
    "cursor": "eyJpZCI6MTB9",
    "hasMore": true,
    "pageSize": 10
  }
}

// Siguiente página
GET /v2/users?pageSize=10&cursor=eyJpZCI6MTB9
```

**Código de migración para clientes:**
```javascript
// v1 (antiguo)
async function fetchUsersV1(page = 1, limit = 10) {
  const response = await fetch(`/v1/users?page=${page}&limit=${limit}`);
  const data = await response.json();
  return {
    users: data.data,
    hasMore: data.meta.page < data.meta.totalPages
  };
}

// v2 (nuevo)
async function fetchUsersV2(cursor = null, pageSize = 10) {
  const url = cursor 
    ? `/v2/users?pageSize=${pageSize}&cursor=${cursor}`
    : `/v2/users?pageSize=${pageSize}`;
  
  const response = await fetch(url);
  const data = await response.json();
  return {
    users: data.data,
    nextCursor: data.meta.cursor,
    hasMore: data.meta.hasMore
  };
}
```

---

## [1.1.0] - 2026-01-19

### Added
- **Versionado de API (URI Versioning)**
  - Implementación de versionado URI en todos los endpoints
  - Rutas versionadas: `/v1/users`, `/v1/auth/*`, `/v1/roles`
  (... resto del CHANGELOG existente ...)
```

### Paso 4.3: Guardar CHANGELOG

**Terminal:**
```bash
# Si usaste un editor GUI, solo guarda
# Si usaste vim: presiona ESC, luego :wq
# Si usaste nano: presiona Ctrl+X, luego Y, luego Enter

# Verificar que se guardó correctamente
cat CHANGELOG.md | head -50
```

---

## 5. Actualizar package.json

### Paso 5.1: Actualizar versión del proyecto

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet

# Editar package.json
code package.json
# O usar sed para cambio rápido:
sed -i 's/"version": "1.1.0"/"version": "2.0.0"/' package.json
```

**Archivo: `package.json`**

```json
{
  "name": "socgerfleet",
  "version": "2.0.0",
  "description": "Sistema avanzado de gestión de usuarios con autenticación JWT y API versionada v2",
  "author": "Socger",
  ...
}
```

### Paso 5.2: Verificar el cambio

**Terminal:**
```bash
# Ver la versión actualizada
grep '"version"' package.json

# Debería mostrar:
# "version": "2.0.0",
```

---

## 6. Testing

### Paso 6.1: Crear tests para v2

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet

# Si no existe archivo de tests, crearlo
# touch test/users-v2.e2e-spec.ts
```

**Archivo: `test/users-v2.e2e-spec.ts`** (ejemplo básico)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('UsersController V2 (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/v2/users (GET) - should use cursor pagination', () => {
    return request(app.getHttpServer())
      .get('/v2/users?pageSize=5')
      .expect(200)
      .expect((res) => {
        expect(res.body.meta).toHaveProperty('cursor');
        expect(res.body.meta).toHaveProperty('hasMore');
        expect(res.body.meta).toHaveProperty('pageSize');
        // No debe tener propiedades de v1
        expect(res.body.meta).not.toHaveProperty('page');
        expect(res.body.meta).not.toHaveProperty('limit');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Paso 6.2: Ejecutar tests

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet

# Asegurarse de que la BD de test está disponible
docker compose up -d

# Ejecutar todos los tests
npm run test

# Ejecutar solo tests e2e
npm run test:e2e

# Si todo pasa, continuar. Si falla, corregir.
```

### Paso 6.3: Actualizar archivos HTTP de testing

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet

# Editar archivo de tests HTTP
code "test endpoints with REST CLIENT extension/api-tests.http"
```

**Agregar al archivo `api-tests.http`:**

```http
###
# ==========================================
# TESTS API V2 - NUEVA VERSIÓN
# ==========================================
###

### V2 - Listar usuarios con cursor pagination (primera página)
GET {{baseUrl}}/v2/users?pageSize=5
Authorization: Bearer {{adminToken}}

### V2 - Listar usuarios con cursor (página siguiente)
# Reemplaza el cursor con el que obtuviste en la respuesta anterior
GET {{baseUrl}}/v2/users?pageSize=5&cursor=eyJpZCI6NX0=
Authorization: Bearer {{adminToken}}

### V2 - Obtener usuario por ID
GET {{baseUrl}}/v2/users/1
Authorization: Bearer {{adminToken}}

### V2 - Buscar usuarios
GET {{baseUrl}}/v2/users?pageSize=10&search=admin
Authorization: Bearer {{adminToken}}

###
# ==========================================
# COMPARACIÓN V1 vs V2
# ==========================================
###

### V1 - Estilo antiguo (seguirá funcionando hasta 2026-06-01)
GET {{baseUrl}}/v1/users?page=1&limit=5
Authorization: Bearer {{adminToken}}

### V2 - Estilo nuevo (recomendado)
GET {{baseUrl}}/v2/users?pageSize=5
Authorization: Bearer {{adminToken}}
```

### Paso 6.4: Actualizar variable baseUrl si es necesario

**Archivo: `api-tests.http`** (verificar que tiene):

```http
# Variables
@baseUrl = http://localhost:3000
@contentType = application/json
```

No necesita `/v1` en baseUrl porque ahora especificamos la versión en cada request.

---

## 7. Compilar y Probar

### Paso 7.1: Compilar el proyecto

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet

# Limpiar build anterior
rm -rf dist/

# Compilar proyecto
npm run build

# Verificar que no hay errores
# Debería mostrar: "Successfully compiled X files"
```

### Paso 7.2: Iniciar servidor de desarrollo

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet

# Asegurar que MySQL está corriendo
docker compose up -d

# Iniciar servidor en modo desarrollo
npm run start:dev

# Esperar a ver:
# [Nest] ... Application is running on: http://localhost:3000
# [Nest] ... Swagger documentation: http://localhost:3000/api/docs
```

### Paso 7.3: Probar endpoints manualmente

**En otra terminal:**

```bash
# Probar v1 (debe seguir funcionando)
curl -X GET "http://localhost:3000/v1/users?page=1&limit=5"

# Probar v2 (nueva versión)
curl -X GET "http://localhost:3000/v2/users?pageSize=5"

# Obtener usuario específico v1
curl -X GET "http://localhost:3000/v1/users/1"

# Obtener usuario específico v2
curl -X GET "http://localhost:3000/v2/users/1"
```

### Paso 7.4: Verificar Swagger

**Terminal:**
```bash
# Abrir Swagger en navegador
xdg-open http://localhost:3000/api/docs
# O en Mac:
# open http://localhost:3000/api/docs
```

**En Swagger deberías ver:**
- Sección "users (v1)" con endpoints `/v1/users`
- Sección "users (v2)" con endpoints `/v2/users`
- Documentación diferente para cada versión

### Paso 7.5: Probar con archivos .http

**En VS Code:**
1. Abrir archivo `api-tests.http`
2. Click en "Send Request" sobre cada petición
3. Verificar respuestas de v1 vs v2
4. Confirmar que ambas versiones funcionan

---

## 8. Documentación Final

### Paso 8.1: Crear guía de migración

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet
mkdir -p docs
touch docs/MIGRATION-v1-to-v2.md
code docs/MIGRATION-v1-to-v2.md
```

**Archivo: `docs/MIGRATION-v1-to-v2.md`**

```markdown
# Guía de Migración: API v1 → v2

## Fecha de Deprecación de v1
**2026-06-01** (en 5 meses)

## Cambios Principales

### 1. Paginación
- **v1:** Page-based (`page`, `limit`)
- **v2:** Cursor-based (`cursor`, `pageSize`)

### 2. Formato de Fechas
- **v1:** Timestamps Unix (números)
- **v2:** ISO 8601 strings

### 3. Estructura de Respuestas
Ver ejemplos detallados en CHANGELOG.md sección [2.0.0]

## Pasos de Migración

1. Actualizar URLs de `/v1/` a `/v2/`
2. Cambiar parámetros de paginación
3. Adaptar lógica de siguiente página
4. Actualizar parseo de fechas

## Ejemplos de Código

(Ver ejemplos completos en CHANGELOG.md)
```

### Paso 8.2: Actualizar README (opcional)

**Terminal:**
```bash
code README.md
```

**Agregar sección en README.md:**

```markdown
## Versionado de API

Esta API utiliza versionado URI para mantener compatibilidad.

### Versiones Disponibles

- **v1**: Estable, será deprecada el 2026-06-01
- **v2**: Actual, recomendada para nuevas implementaciones

### Endpoints

```
v1: http://localhost:3000/v1/users
v2: http://localhost:3000/v2/users
```

Ver [MIGRATION-v1-to-v2.md](docs/MIGRATION-v1-to-v2.md) para migrar.
```

---

## 9. Despliegue

### Paso 9.1: Commit de cambios

**Terminal:**
```bash
cd /home/socger/trabajo/socger/socgerfleet

# Ver archivos modificados
git status

# Agregar todos los cambios
git add .

# Ver diferencias antes de commit
git diff --staged

# Hacer commit
git commit -m "feat: implement API v2 with cursor-based pagination

- Added v2 endpoints for users with cursor pagination
- Maintained v1 for backward compatibility
- Updated CHANGELOG with migration guide
- v1 deprecated, will be removed on 2026-06-01
- Version bump to 2.0.0

BREAKING CHANGES:
- Pagination structure changed from page-based to cursor-based
- Date format now ISO 8601 instead of Unix timestamps
- Query params changed: page→cursor, limit→pageSize"

# Verificar commit
git log -1
```

### Paso 9.2: Push a repositorio

**Terminal:**
```bash
# Push de la rama feature
git push origin feature/api-v2

# Si es la primera vez:
git push -u origin feature/api-v2
```

### Paso 9.3: Crear Pull Request

**En GitHub/GitLab:**
1. Ir a tu repositorio
2. Verás banner "Compare & pull request"
3. Click en "Compare & pull request"
4. Título: "feat: Implement API v2 with cursor-based pagination"
5. Descripción:
```markdown
## Cambios

- ✅ Implementado API v2 con paginación cursor-based
- ✅ Mantenida compatibilidad con v1
- ✅ Actualizado CHANGELOG con guía de migración
- ✅ Creada documentación de migración
- ✅ Tests actualizados

## Breaking Changes

- Estructura de paginación cambiada
- Formato de fechas actualizado a ISO 8601
- Parámetros de query modificados

## Deprecación

API v1 será deprecada el 2026-06-01 (5 meses)

## Testing

- [x] Tests unitarios pasan
- [x] Tests e2e pasan
- [x] Probado manualmente en desarrollo
- [x] Swagger documentado correctamente

## Checklist

- [x] CHANGELOG actualizado
- [x] package.json actualizado (v2.0.0)
- [x] Documentación de migración creada
- [x] Tests actualizados
- [x] Ambas versiones (v1 y v2) funcionan
```

6. Asignar reviewers
7. Click "Create pull request"

### Paso 9.4: Merge y Deploy

**Después de aprobación, en terminal:**

```bash
# Cambiar a main
git checkout main

# Pull con los cambios mergeados
git pull origin main

# Tag de release
git tag -a v2.0.0 -m "Release v2.0.0 - API v2 with cursor pagination"

# Push del tag
git push origin v2.0.0

# Ver tags
git tag -l
```

### Paso 9.5: Deploy a producción

**Terminal (ejemplo con servidor):**

```bash
# SSH a servidor de producción
ssh usuario@tu-servidor.com

# Navegar al proyecto
cd /ruta/a/socgerfleet

# Pull de cambios
git pull origin main

# Instalar dependencias (por si acaso)
npm install

# Compilar
npm run build

# Restart del servicio (depende de tu setup)
# Opción 1: PM2
pm2 restart socgerfleet

# Opción 2: systemd
sudo systemctl restart socgerfleet

# Opción 3: Docker
docker compose up -d --build

# Verificar logs
pm2 logs socgerfleet
# O:
journalctl -u socgerfleet -f
# O:
docker compose logs -f
```

### Paso 9.6: Verificar en producción

**Terminal:**
```bash
# Probar v1 (debe funcionar)
curl https://tu-dominio.com/v1/users?page=1&limit=10

# Probar v2 (debe funcionar)
curl https://tu-dominio.com/v2/users?pageSize=10

# Verificar Swagger
curl https://tu-dominio.com/api/docs
```

---

## 10. Comunicación a Usuarios/Clientes

### Paso 10.1: Anunciar nueva versión

**Email/Notificación a desarrolladores:**

```
Asunto: Nueva API v2 Disponible - v1 será deprecada el 2026-06-01

Hola,

Nos complace anunciar el lanzamiento de la API v2 de SocgerFleet con mejoras significativas:

✨ Mejoras:
- Paginación cursor-based más eficiente
- Formato de fechas ISO 8601 consistente
- Mejor rendimiento en listas grandes

⚠️ Importante:
- API v1 seguirá funcionando hasta el 2026-06-01
- A partir de esa fecha, v1 será desactivada
- Por favor, migrar a v2 antes de esa fecha

📖 Recursos:
- Documentación: https://tu-dominio.com/api/docs
- Guía de migración: https://github.com/tu-repo/blob/main/docs/MIGRATION-v1-to-v2.md
- CHANGELOG: https://github.com/tu-repo/blob/main/CHANGELOG.md

Saludos,
Equipo SocgerFleet
```

---

## 📋 Checklist Final

Antes de considerar completo, verificar:

- [ ] ✅ v1 sigue funcionando (backward compatibility)
- [ ] ✅ v2 implementada y funcionando
- [ ] ✅ CHANGELOG actualizado con sección [2.0.0]
- [ ] ✅ package.json actualizado a version 2.0.0
- [ ] ✅ Tests pasan (v1 y v2)
- [ ] ✅ Swagger documenta ambas versiones
- [ ] ✅ Archivos .http actualizados
- [ ] ✅ Guía de migración creada
- [ ] ✅ README actualizado
- [ ] ✅ Commit y push realizados
- [ ] ✅ Pull request creado y revisado
- [ ] ✅ Merge a main
- [ ] ✅ Tag de release (v2.0.0) creado
- [ ] ✅ Deploy a producción
- [ ] ✅ Verificación en producción
- [ ] ✅ Comunicación a usuarios

---

## 🔧 Comandos Rápidos de Referencia

```bash
# Crear rama
git checkout -b feature/api-v2

# Compilar
npm run build

# Tests
npm run test
npm run test:e2e

# Iniciar dev
npm run start:dev

# Commit
git add .
git commit -m "feat: implement API v2"

# Push
git push origin feature/api-v2

# Tag
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0

# Deploy Docker
docker compose up -d --build
```

---

## 🆘 Troubleshooting

### Error: "Cannot find module @nestjs/common"
```bash
npm install
```

### Error: "MySQL not running"
```bash
docker compose up -d
docker compose ps
```

### Error: "Port 3000 already in use"
```bash
# Encontrar y matar proceso
lsof -ti:3000 | xargs kill -9
# O cambiar puerto
PORT=3001 npm run start:dev
```

### Tests fallan
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
npm run test
```

---

**Última actualización:** 19 de enero de 2026  
**Versión de documento:** 1.0  
**Autor:** Socger / GitHub Copilot
