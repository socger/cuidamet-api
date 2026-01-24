# Fix: Manejo de Filtros Booleanos en Query Parameters

## 📋 Resumen Ejecutivo

**Fecha:** 24 de enero de 2026  
**Repositorio Afectado:** socgerfleet (template)  
**Impacto:** Crítico - Afecta filtros con campos booleanos en todos los endpoints GET  
**Tiempo Estimado de Implementación:** 15-20 minutos

---

## 🐛 Descripción del Problema

### Síntoma
Cuando se filtran registros usando campos booleanos a través de query parameters (ej: `?isActive=true` o `?isActive=false`), la API no devuelve resultados correctos:
- Con `isActive=true`: Puede devolver registros incorrectos
- Con `isActive=false`: No devuelve ningún resultado (array vacío) aunque existan registros con valor `false`

### Causa Raíz

**1. Almacenamiento en MySQL:**
```sql
-- MySQL almacena booleanos como TINYINT(1)
isActive TINYINT(1)  -- Valores: 0 (false) o 1 (true)
```

**2. Query Parameters HTTP:**
```http
GET /users?isActive=false
-- El parámetro llega como STRING "false", no como booleano
```

**3. Conversión Incorrecta en NestJS:**
```typescript
// ❌ PROBLEMA: @Type(() => Boolean)
@Type(() => Boolean)
isActive?: boolean;

// JavaScript convierte:
Boolean("false") === true  // ⚠️ INCORRECTO!
Boolean("true") === true   // ✅ Correcto
```

**4. Query SQL Generada:**
```sql
-- Con el problema:
WHERE user.is_active = true   -- No coincide con is_active=0 ni is_active=1

-- Correcto (después del fix):
WHERE user.is_active = 1      -- Coincide con is_active=1 en MySQL
WHERE user.is_active = 0      -- Coincide con is_active=0 en MySQL
```

---

## 🔧 Solución Técnica

### Enfoque de Dos Pasos

**Paso 1: Conversión correcta de String a Boolean en el DTO**
- Usar `@Transform` en lugar de `@Type(() => Boolean)`
- Convertir explícitamente: `"true"` → `true`, `"false"` → `false`

**Paso 2: Conversión de Boolean a Number en el Servicio**
- Antes de usar en la query, convertir: `true` → `1`, `false` → `0`
- Esto asegura compatibilidad con el tipo `TINYINT(1)` de MySQL

---

## 📝 Cambios a Implementar en SOCGERFLEET

### Archivo 1: `src/users/dto/user-filters.dto.ts`

#### Cambio 1.1: Agregar Transform al Import

**Ubicación:** Línea ~8

```typescript
// ❌ ANTES:
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ✅ DESPUÉS:
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
```

#### Cambio 1.2: Modificar Decorador del Campo isActive

**Ubicación:** Líneas ~67-77

```typescript
// ❌ ANTES:
@ApiPropertyOptional({
  description: 'Filtrar por estado activo/inactivo',
  example: true,
})
@IsOptional()
@Type(() => Boolean)
@IsBoolean()
isActive?: boolean;

// ✅ DESPUÉS:
@ApiPropertyOptional({
  description: 'Filtrar por estado activo/inactivo',
  example: true,
})
@IsOptional()
@IsBoolean()
@Transform(({ value }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
})
isActive?: boolean;
```

**Explicación:**
- `@Transform` intercepta el valor antes de la validación
- Convierte explícitamente strings a booleanos
- Si no es "true" ni "false", devuelve el valor original (para validación)

---

### Archivo 2: `src/users/users.service.ts`

#### Cambio 2.1: Convertir Boolean a Number en la Query

**Ubicación:** Líneas ~113-118 (método `findAll`)

```typescript
// ❌ ANTES:
// Filtro por estado activo/inactivo
if (typeof filters.isActive === 'boolean') {
  queryBuilder.andWhere('user.isActive = :isActive', {
    isActive: filters.isActive,
  });
}

// ✅ DESPUÉS:
// Filtro por estado activo/inactivo
if (typeof filters.isActive === 'boolean') {
  // Convertir booleano a número para MySQL (0 o 1)
  queryBuilder.andWhere('user.isActive = :isActive', {
    isActive: filters.isActive ? 1 : 0,
  });
}
```

**Explicación:**
- MySQL requiere comparación numérica: `TINYINT(1) = 0` o `TINYINT(1) = 1`
- La conversión `? 1 : 0` transforma el booleano al número correcto
- Esto garantiza que la query SQL funcione correctamente

---

## 🎯 Patrón Reutilizable para Futuros Desarrollos

### Template para DTOs de Filtros con Campos Booleanos

```typescript
import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MiFilterDto {
  
  // ✅ PATRÓN CORRECTO para campos booleanos en filtros
  @ApiPropertyOptional({
    description: 'Descripción del campo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  miCampoBooleano?: boolean;
  
}
```

### Template para Servicios

```typescript
// En el método findAll o similar:

if (typeof filters.miCampoBooleano === 'boolean') {
  // Convertir booleano a número para MySQL (0 o 1)
  queryBuilder.andWhere('entidad.miCampoBooleano = :miCampoBooleano', {
    miCampoBooleano: filters.miCampoBooleano ? 1 : 0,
  });
}
```

---

## 🧪 Plan de Testing

### Prerequisitos
```bash
# 1. Aplicar los cambios en socgerfleet
# 2. Compilar y ejecutar
npm run build
npm run start:dev

# 3. Verificar que la aplicación está corriendo
curl http://localhost:3000/
```

### Tests Funcionales

#### Test 1: Filtrar por isActive=true

```bash
curl -X GET "http://localhost:3000/users?isActive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resultado Esperado:**
- Status Code: `200 OK`
- Response: Usuarios con `is_active = 1`
- SQL en logs debe mostrar: `... WHERE user.is_active = 1`

#### Test 2: Filtrar por isActive=false

```bash
curl -X GET "http://localhost:3000/users?isActive=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resultado Esperado:**
- Status Code: `200 OK`
- Response: Usuarios con `is_active = 0`
- SQL en logs debe mostrar: `... WHERE user.is_active = 0`

#### Test 3: Sin filtro isActive

```bash
curl -X GET "http://localhost:3000/users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resultado Esperado:**
- Status Code: `200 OK`
- Response: Todos los usuarios (activos e inactivos)
- SQL en logs NO debe incluir condición `WHERE user.is_active`

#### Test 4: Filtros combinados

```bash
curl -X GET "http://localhost:3000/users?isActive=true&roleName=admin" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resultado Esperado:**
- Status Code: `200 OK`
- Response: Usuarios activos con rol admin
- SQL en logs debe mostrar: `... WHERE user.is_active = 1 AND role.name = 'admin'`

### Verificación de Logs SQL

En la terminal donde corre la aplicación, buscar líneas como:

```sql
-- ❌ ANTES (INCORRECTO):
query: SELECT ... WHERE user.is_active = true
-- PARAMETERS: [true]

-- ✅ DESPUÉS (CORRECTO):
query: SELECT ... WHERE user.is_active = ?
-- PARAMETERS: [1]  o  [0]
```

### Tests con Swagger UI

1. Abrir Swagger: `http://localhost:3000/api`
2. Navegar a: `GET /users`
3. Expandir el endpoint y hacer clic en "Try it out"
4. Probar con:
   - `isActive` = `true` → Click "Execute"
   - `isActive` = `false` → Click "Execute"
5. Verificar que ambos devuelven resultados correctos

---

## 📊 Comparación: Antes vs Después

### Escenario: Base de Datos con 3 Usuarios

```sql
-- Datos de ejemplo:
id | username | is_active
---|----------|----------
1  | admin    | 1
2  | user1    | 1
3  | inactive | 0
```

### Request: `GET /users?isActive=false`

| | Antes del Fix | Después del Fix |
|---|---------------|-----------------|
| **Query Parameter** | `"false"` (string) | `"false"` (string) |
| **Conversión DTO** | `Boolean("false")` = `true` ❌ | `"false"` → `false` ✅ |
| **Valor en Service** | `true` | `false` |
| **SQL Parameter** | `true` | `0` |
| **SQL WHERE** | `is_active = true` | `is_active = 0` |
| **Resultados** | 0 registros (ninguno coincide) | 1 registro (id=3) ✅ |

### Request: `GET /users?isActive=true`

| | Antes del Fix | Después del Fix |
|---|---------------|-----------------|
| **Query Parameter** | `"true"` (string) | `"true"` (string) |
| **Conversión DTO** | `Boolean("true")` = `true` ✅ | `"true"` → `true` ✅ |
| **Valor en Service** | `true` | `true` |
| **SQL Parameter** | `true` | `1` |
| **SQL WHERE** | `is_active = true` | `is_active = 1` |
| **Resultados** | Inconsistente (depende de MySQL) | 2 registros (id=1,2) ✅ |

---

## 🚨 Casos Especiales y Edge Cases

### 1. Valores Inválidos

**Request:** `GET /users?isActive=maybe`

```typescript
// El @Transform no convertirá "maybe"
@Transform(({ value }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;  // Devuelve "maybe"
})

// @IsBoolean() detectará el error
@IsBoolean()
```

**Response:**
```json
{
  "statusCode": 400,
  "message": ["isActive must be a boolean value"],
  "error": "Bad Request"
}
```

### 2. Campos Booleanos Requeridos (no opcionales)

Si el campo booleano NO es opcional:

```typescript
@ApiProperty({  // Sin "Optional"
  description: 'Estado activo (requerido)',
  example: true,
})
@IsBoolean()
@Transform(({ value }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
})
isActive: boolean;  // Sin "?"
```

### 3. Campos Booleanos en Body (no en Query)

Para campos booleanos en request body (POST/PUT/PATCH):

```typescript
// NO necesita @Transform, los clientes JSON envían booleanos nativos
@ApiProperty({
  description: 'Estado activo',
  example: true,
})
@IsBoolean()
isActive: boolean;

// Request body:
{
  "isActive": true  // Booleano JSON, no string
}
```

---

## 🔍 Campos Booleanos Existentes en SOCGERFLEET

### Inventario de Campos Booleanos

| Entidad | Campo | Tipo | Ubicación |
|---------|-------|------|-----------|
| `User` | `isActive` | TINYINT(1) | `src/entities/user.entity.ts` |
| `User` | `emailVerified` | TINYINT(1) | `src/entities/user.entity.ts` |
| `RefreshToken` | `isRevoked` | TINYINT(1) | `src/entities/refresh-token.entity.ts` |
| `LoginAttempt` | `isSuccessful` | TINYINT(1) | `src/entities/login-attempt.entity.ts` |
| `VerificationToken` | `isUsed` | TINYINT(1) | `src/entities/verification-token.entity.ts` |

### Campos que Requieren el Fix

**✅ Ya Cubierto:**
- `User.isActive` en filtros de usuarios

**📝 Pendiente de Implementar (si se crean endpoints de filtrado):**
- `User.emailVerified` - Si se agrega filtro en `user-filters.dto.ts`
- `RefreshToken.isRevoked` - Si se crea endpoint GET con filtros
- `LoginAttempt.isSuccessful` - Si se crea endpoint de consulta
- `VerificationToken.isUsed` - Si se crea endpoint de administración

---

## 📚 Documentación Adicional

### Referencias Técnicas

**NestJS Class Transformer:**
- Docs: https://docs.nestjs.com/techniques/serialization
- GitHub: https://github.com/typestack/class-transformer

**MySQL TINYINT:**
- Docs: https://dev.mysql.com/doc/refman/8.0/en/integer-types.html
- TINYINT(1) es usado para booleanos: 0 = false, 1 = true

**TypeORM:**
- Docs: https://typeorm.io/entities#column-types-for-mysql
- Boolean columns en MySQL se mapean a TINYINT(1)

### Mejores Prácticas

1. **Siempre usar `@Transform` para booleanos en query parameters**
2. **Convertir a número antes de usar en queries SQL**
3. **Documentar el comportamiento en el código con comentarios**
4. **Probar ambos casos: true y false**
5. **Verificar los logs SQL durante desarrollo**

---

## 🎓 Capacitación del Equipo

### Checklist para Nuevos Desarrolladores

Cuando trabajes con filtros booleanos:

- [ ] ¿El campo booleano está en un DTO de filtros?
- [ ] ¿Se usa como query parameter en un GET?
- [ ] ¿Importaste `Transform` de `class-transformer`?
- [ ] ¿Agregaste el decorador `@Transform` con la conversión correcta?
- [ ] ¿Conviertes a número (0/1) antes de usar en la query SQL?
- [ ] ¿Probaste con `true` y `false` en los tests?
- [ ] ¿Verificaste los logs SQL para confirmar los parámetros?

### Ejemplo de Code Review

```typescript
// ❌ CODE REVIEW: RECHAZAR
@IsBoolean()
@Type(() => Boolean)
isActive?: boolean;

// ✅ CODE REVIEW: APROBAR
@IsBoolean()
@Transform(({ value }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
})
isActive?: boolean;
```

---

## 📞 Contacto y Soporte

**Para dudas o problemas:**
- Revisar este documento primero
- Verificar los logs SQL en desarrollo
- Comparar con los ejemplos de este documento
- Probar con los tests de ejemplo proporcionados

**Actualizaciones futuras:**
- Este patrón debe aplicarse a TODOS los campos booleanos en DTOs de filtros
- Mantener consistencia en todo el proyecto
- Actualizar este documento si se descubren nuevos casos especiales

---

## ✅ Checklist de Implementación

### Fase 1: Aplicar Cambios
- [ ] Abrir proyecto socgerfleet en VS Code
- [ ] Modificar `src/users/dto/user-filters.dto.ts`
- [ ] Modificar `src/users/users.service.ts`
- [ ] Compilar sin errores: `npm run build`

### Fase 2: Testing
- [ ] Iniciar aplicación: `npm run start:dev`
- [ ] Test: `GET /users?isActive=true` devuelve usuarios activos
- [ ] Test: `GET /users?isActive=false` devuelve usuarios inactivos
- [ ] Test: Verificar SQL logs muestran parámetros numéricos (0 o 1)
- [ ] Test: Swagger UI funciona correctamente con el filtro

### Fase 3: Documentación
- [ ] Commit con mensaje descriptivo
- [ ] Actualizar CHANGELOG.md si existe
- [ ] Notificar al equipo del cambio
- [ ] Actualizar documentación de API si corresponde

### Fase 4: Propagación
- [ ] Actualizar proyectos derivados (ej: cuidamet-api)
- [ ] Aplicar el mismo patrón a nuevos campos booleanos futuros
- [ ] Incluir en el template de código del proyecto

---

**Documento Creado:** 24 de enero de 2026  
**Versión:** 1.0  
**Autor:** GitHub Copilot  
**Última Actualización:** 24 de enero de 2026
