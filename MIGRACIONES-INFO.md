# 📋 Información de Migraciones - Cuidamet API

## ✅ Estado Actual de las Migraciones

El proyecto tiene configuradas **5 migraciones** en orden cronológico que recrean completamente la base de datos.

### 📂 Archivos de Migraciones

```
src/database/migrations/
├── 1700000000000-CreateInitialTables.ts       ⭐ PRIMERA
├── 1710000000000-AddAuditFields.ts
├── 1768854380268-AddLoginAttempts.ts
├── 1769160948978-AddProfileEntities.ts
└── 1769200000000-AddProfileFieldsToUsers.ts   ⭐ ÚLTIMA
```

---

## 🔄 Orden de Ejecución

### 1️⃣ **CreateInitialTables** (timestamp: 1700000000000)
**Crea la estructura base de la aplicación:**
- ✅ Tabla `roles` con roles predefinidos
- ✅ Tabla `users` (campos básicos)
- ✅ Tabla `user_roles` (relación muchos a muchos)
- ✅ Tabla `refresh_tokens`
- ✅ Tabla `password_history`
- ✅ Tabla `verification_tokens`
- ✅ Usuario admin por defecto (admin@socgerfleet.com / admin123)
- ✅ Foreign keys e índices

### 2️⃣ **AddAuditFields** (timestamp: 1710000000000)
**Agrega campos de auditoría:**
- ✅ Campos: `deleted_at`, `created_by`, `updated_by`, `deleted_by`
- ✅ A todas las tablas base
- ✅ Índices para soft delete

### 3️⃣ **AddLoginAttempts** (timestamp: 1768854380268)
**Sistema de protección de login:**
- ✅ Tabla `login_attempts`
- ✅ Tracking de intentos fallidos
- ✅ Bloqueos por IP y usuario
- ✅ Índices compuestos para consultas rápidas

### 4️⃣ **AddProfileEntities** (timestamp: 1769160948978)
**Sistema de perfiles y servicios:**
- ✅ Tabla `provider_profiles` (perfiles de cuidadores)
- ✅ Tabla `client_profiles` (perfiles de clientes)
- ✅ Tabla `service_configs` (configuración de servicios)
- ✅ Tabla `service_variations` (variaciones de servicios)
- ✅ Tabla `certificates` (certificaciones)
- ✅ Cambios en `user_roles` (quita `assigned_at`)
- ✅ Foreign keys y relaciones

### 5️⃣ **AddProfileFieldsToUsers** (timestamp: 1769200000000) ⭐ NUEVA
**Consolidación de datos de perfil:**
- ✅ Mueve campos comunes desde `provider_profiles` y `client_profiles` a `users`
- ✅ Campos migrados:
  - `phone` (varchar 15)
  - `photo_url` (mediumtext - soporta base64)
  - `location` (varchar 255)
  - `latitude` (decimal 10,7)
  - `longitude` (decimal 10,7)
  - `languages` (text)
  - `is_premium` (tinyint 1)
- ✅ Migra datos existentes sin pérdida
- ✅ Elimina campos de tablas de perfil (evita duplicación)
- ✅ Agrega índices de rendimiento

---

## 🚀 Instalación en Nuevo Servidor

### Opción A: Instalación Limpia (Recomendada)

```bash
# 1. Clonar repositorio
git clone <repositorio>
cd cuidamet-api

# 2. Instalar dependencias
npm ci

# 3. Configurar .env
cp .env.example .env
# Editar .env con tus credenciales

# 4. Levantar contenedor Docker con MySQL
docker compose up -d

# 5. Ejecutar todas las migraciones (crea estructura completa)
npm run migration:run

# 6. (Opcional) Poblar datos de prueba
npm run seed:run

# 7. Verificar estado de migraciones
npm run migration:show

# 8. Iniciar servidor
npm run start:dev
```

### Opción B: Base de Datos Existente

Si ya tienes una base de datos con estructura antigua:

```bash
# 1. BACKUP PRIMERO (importante)
docker compose exec mysql mysqldump -u socger -p cuidamet > backup.sql

# 2. Ver qué migraciones ya se ejecutaron
npm run migration:show

# 3. Ejecutar solo las migraciones pendientes
npm run migration:run
```

---

## 🔍 Comandos Útiles

```bash
# Ver estado de migraciones (cuáles están ejecutadas)
npm run migration:show

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Crear nueva migración vacía
npm run migration:create src/database/migrations/NombreMigracion

# Generar migración desde cambios en entidades
npm run migration:generate src/database/migrations/NombreCambio
```

---

## ⚠️ Importante

### ❌ NO USAR Scripts SQL Manuales

**NUNCA crear scripts en `docker/mysql/init/` para migraciones:**
- ❌ Solo se ejecutan al crear el contenedor
- ❌ No hay tracking
- ❌ No reversibles
- ❌ No funcionan en BD existentes

### ✅ SIEMPRE Usar TypeORM Migrations

- ✅ Versionadas con el código
- ✅ Reversibles (`migration:revert`)
- ✅ Tracking automático
- ✅ Funcionan en cualquier entorno

---

## 📊 Resultado Final

Después de ejecutar todas las migraciones, tendrás:

**13 tablas creadas:**
1. `roles` - Roles del sistema
2. `users` - Usuarios del sistema (con campos de perfil)
3. `user_roles` - Relación usuarios-roles
4. `refresh_tokens` - Tokens de refresh para autenticación
5. `password_history` - Historial de contraseñas
6. `verification_tokens` - Tokens de verificación email/reset password
7. `login_attempts` - Tracking de intentos de login
8. `provider_profiles` - Perfiles de cuidadores (sin campos comunes)
9. `client_profiles` - Perfiles de clientes (sin campos comunes)
10. `service_configs` - Configuración de servicios por categoría
11. `service_variations` - Variaciones de servicios
12. `certificates` - Certificaciones de proveedores
13. `migrations` - Control de migraciones (automática)

**Datos iniciales:**
- 5 roles: admin, user, moderator, provider, client
- 1 usuario admin (admin@socgerfleet.com / admin123)

---

## 🛠️ Troubleshooting

### Problema: Migration already executed

```bash
# Ver qué migraciones están registradas
npm run migration:show

# Si hay inconsistencias, puedes limpiar la tabla migrations
# y re-registrar las migraciones (en BD existente)
```

### Problema: Container no arranca

```bash
# Ver logs del contenedor
docker compose logs mysql

# Recrear contenedor desde cero
docker compose down -v
docker compose up -d
```

### Problema: Error de conexión

```bash
# Verificar que MySQL esté corriendo
docker compose ps

# Verificar .env
cat .env | grep DB_

# Verificar conexión
docker compose exec mysql mysql -u socger -p
```

---

## 📚 Referencias

- [AGENTS.md](AGENTS.md) - Documentación para IA
- [DEVELOPMENT-NOTES.md](DEVELOPMENT-NOTES.md) - Recordatorios críticos
- [README.md](README.md) - Documentación general
- [TypeORM Migrations](https://typeorm.io/migrations) - Documentación oficial

---

**Última actualización:** 7 de febrero de 2026
**Versión:** 1.1.3
