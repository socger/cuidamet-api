# 📝 Development Notes - Recordatorios Importantes

## 🔴 CRÍTICO #1: Sistema de Migraciones de Base de Datos

**REGLA FUNDAMENTAL: SIEMPRE usa TypeORM Migrations para cambios en la base de datos.**

### ❌ NO HACER

**NUNCA crear scripts SQL manuales en `docker/mysql/init/` para migraciones:**

```bash
# ❌ INCORRECTO - NO CREAR MÁS ARCHIVOS AQUÍ PARA MIGRACIONES
docker/mysql/init/02_move_profile_fields.sql  # MAL ❌
docker/mysql/init/03_add_new_table.sql        # MAL ❌
```

### ✅ HACER

**SIEMPRE usa TypeORM Migrations:**

```bash
# 1. Modificar entidad en src/entities/
# 2. Generar migración automáticamente
npm run migration:generate src/database/migrations/DescripcionDelCambio

# 3. Ejecutar migración
npm run migration:run

# 4. Ver estado
npm run migration:show
```

### Por qué TypeORM Migrations

✅ **Ventajas:**
- Tracking automático de qué se ejecutó
- Reversibles con `migration:revert`
- Versionadas con el código
- Funcionan en producción
- Sincronizadas con entidades TypeScript

❌ **Problemas de scripts SQL manuales:**
- Solo se ejecutan al crear contenedor
- No reversibles
- Sin tracking
- No funcionan en BD existentes

### Comandos Rápidos

| Comando | Descripción |
|---------|-------------|
| `npm run migration:create src/database/migrations/Nombre` | Crear migración vacía |
| `npm run migration:generate src/database/migrations/Nombre` | Generar desde entidades |
| `npm run migration:run` | Ejecutar pendientes |
| `npm run migration:revert` | Revertir última |
| `npm run migration:show` | Ver estado |

### Referencias
- [AGENTS.md](AGENTS.md) - Sección "Sistema de Migraciones de Base de Datos"
- [data-source.ts](src/database/data-source.ts) - Configuración de TypeORM
- [TypeORM Migrations](https://typeorm.io/migrations) - Documentación oficial

---

## 🔴 CRÍTICO #2: Filtros Booleanos en Query Parameters

**Este es el problema más común cuando se crean nuevos DTOs de filtros.**

### ¿Por qué sucede?

```
HTTP Request: ?isActive=false
     ↓
Query Parameter: "false" (string, NO booleano)
     ↓
❌ INCORRECTO: Boolean("false") = true   ← ERROR LÓGICO
✅ CORRECTO:   "false" → false → SQL: WHERE is_active = 0
     ↓
MySQL: TINYINT(1) requiere 0 o 1, NO true/false
```

### Patrón Obligatorio

**1. En DTO de Filtros** (`src/[modulo]/dto/*-filters.dto.ts`):

```typescript
import { Transform } from 'class-transformer';  // ← CRÍTICO

@IsBoolean()
@Transform(({ value }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
})
miCampoBooleano?: boolean;
```

**2. En Servicio** (método `findAll` o similar):

```typescript
if (typeof filters.miCampoBooleano === 'boolean') {
  queryBuilder.andWhere('entidad.miCampoBooleano = :miCampoBooleano', {
    miCampoBooleano: filters.miCampoBooleano ? 1 : 0,  // ← OBLIGATORIO
  });
}
```

### Checklist

- [ ] ¿Es un DTO de **filtros** (GET) o de creación (POST)?
  - Filtros: Sí → Aplica este patrón
  - Creación: No → Usa solo `@IsBoolean()`
- [ ] ¿Importaste `Transform` de `class-transformer`?
- [ ] ¿El decorador es: `@IsBoolean()` → `@Transform(...)`?
- [ ] ¿Convertiste a 0/1 en la query SQL?
- [ ] ¿Probaste con `?campo=true` y `?campo=false`?
- [ ] ¿Verificaste los logs SQL? (Deben mostrar `PARAMETERS: [0]` o `[1]`)

### Campos Booleanos en SocgerFleet

| Entidad | Campo | DTO | Service |
|---------|-------|-----|---------|
| `User` | `isActive` | ✅ Implementado | ✅ Implementado |
| `User` | `emailVerified` | ❌ Pendiente | ❌ Pendiente |
| `RefreshToken` | `isRevoked` | ❌ Pendiente | ❌ Pendiente |
| `LoginAttempt` | `isSuccessful` | ❌ Pendiente | ❌ Pendiente |
| `VerificationToken` | `isUsed` | ❌ Pendiente | ❌ Pendiente |

### Documentación Completa

📖 [BOOLEAN-FILTERS-FIX.md](resources/documents/AI%20conversations/AI%20conversations%20-%20socgerFleet/035%20-%20BOOLEAN-FILTERS-FIX%20-%20Cambios%20necesarios%20para%20poder%20filtrar%20booleanos%20en%20las%20sql%20con%20type%20ORM.md)

---

## 📋 Otros Recordatorios

### Migraciones TypeORM

⚠️ **NUNCA usar `synchronize: true`** - Este proyecto usa migraciones

```bash
# Generar migración después de cambiar entidad
npm run migration:generate -- src/database/migrations/Add[NombreEntidad]

# Ejecutar migraciones
npm run migration:run

# Verificar migraciones ejecutadas
npm run migration:show
```

### Versioning de API

Cambios que requieren **nueva versión (v2)**:
- ❌ Eliminas campos de respuesta
- ❌ Cambias tipo de datos (string → number)
- ❌ Eliminas endpoints

**NO requieren nueva versión:**
- ✅ Agregas nuevos campos opcionales
- ✅ Corriges bugs
- ✅ Mejoras rendimiento

### CHANGELOG.md

Actualizar **después de cada cambio significativo** en sección `[Unreleased]`

---

## 🔍 Debugging

### Ver SQL Generado

En `src/database/database.config.ts`:
```typescript
logging: ['query'],  // ← Activa logs SQL
```

Buscar líneas como:
```
query: SELECT ... WHERE user.is_active = ?
PARAMETERS: [1]  // ← Así debe verse
```

### Tests de Filtros Booleanos

```bash
# Filtrar por true
curl "http://localhost:3000/users?isActive=true"

# Filtrar por false
curl "http://localhost:3000/users?isActive=false"

# Sin filtro
curl "http://localhost:3000/users"
```

---

## 📞 Referencias Rápidas

- **AGENTS.md** - Documentación principal del proyecto
- **README.md** - Sección "🤖 Guía para IA"
- **CHANGELOG.md** - Historial de cambios
- **Class Transformer docs** - https://github.com/typestack/class-transformer
- **NestJS Serialization** - https://docs.nestjs.com/techniques/serialization

---

> **Última actualización:** 24 de enero de 2026
> **Autor:** Development Team & AI Assistant
