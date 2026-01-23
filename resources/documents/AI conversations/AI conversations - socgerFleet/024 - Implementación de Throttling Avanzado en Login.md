# Implementación de Throttling Avanzado en Login

**Fecha:** 19 de enero de 2026  
**Versión del proyecto:** 1.1.2  
**Estado:** ✅ Completado

---

## 📋 Resumen

Se implementó un sistema de **throttling avanzado** para el endpoint de login para prevenir ataques de fuerza bruta, con las siguientes características:

### 🛡️ Protecciones Implementadas

1. **Throttling por IP**: Máximo 5 intentos fallidos por IP en 15 minutos
2. **Throttling por Usuario**: Máximo 3 intentos fallidos por email/username en 15 minutos
3. **Bloqueo Progresivo**: Los bloqueos aumentan con cada violación
4. **Tracking de Intentos**: Almacenamiento en base de datos de todos los intentos
5. **Gestión de Bloqueos**: Sistema automatizado de bloqueo temporal

---

## 🔐 Reglas de Seguridad

### Límites de Intentos

```
Por IP:          5 intentos fallidos en 15 minutos
Por Usuario:     3 intentos fallidos en 15 minutos
Ventana:         15 minutos (900.000 ms)
```

### Bloqueos Progresivos

Cada vez que se supera el límite, el tiempo de bloqueo aumenta:

| Violación | Duración del Bloqueo |
|-----------|---------------------|
| 1ª vez    | 5 minutos          |
| 2ª vez    | 15 minutos         |
| 3ª vez    | 30 minutos         |
| 4ª vez    | 1 hora             |
| 5ª vez+   | 24 horas           |

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/entities/login-attempt.entity.ts`**
   - Entidad para almacenar intentos de login
   - Índices optimizados para consultas rápidas

2. **`src/auth/guards/login-throttler.guard.ts`**
   - Guard personalizado con lógica de throttling
   - Validación por IP y por identificador
   - Cálculo de bloqueos progresivos

3. **`src/database/migrations/1768854380268-AddLoginAttempts.ts`**
   - Migración para crear tabla `login_attempts`

### Archivos Modificados

1. **`src/auth/auth.service.ts`**
   - Agregado método `recordLoginAttempt()`
   - Agregado método `cleanOldLoginAttempts()`
   - Integración con registro de intentos

2. **`src/auth/auth.controller.ts`**
   - Aplicación del `LoginThrottlerGuard` al endpoint de login
   - Documentación Swagger actualizada

3. **`src/auth/auth.module.ts`**
   - Registro de entidad `LoginAttempt`
   - Registro del provider `LoginThrottlerGuard`

---

## 🗃️ Estructura de Base de Datos

### Tabla: `login_attempts`

```sql
CREATE TABLE `login_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) NOT NULL,           -- Email o username
  `ip_address` varchar(45) NOT NULL,            -- IP del cliente
  `user_agent` text NULL,                       -- User-Agent del navegador
  `is_successful` tinyint NOT NULL DEFAULT 0,   -- ¿Fue exitoso?
  `failure_reason` varchar(255) NULL,           -- Razón del fallo
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `blocked_until` datetime NULL,                -- Hasta cuándo está bloqueado
  
  PRIMARY KEY (`id`),
  INDEX `idx_identifier_created` (`identifier`, `created_at`),
  INDEX `idx_ip_created` (`ip_address`, `created_at`)
) ENGINE=InnoDB;
```

### Índices

- `idx_ip_created`: Optimiza consultas por IP y fecha
- `idx_identifier_created`: Optimiza consultas por usuario y fecha

---

## 🔄 Flujo de Funcionamiento

### 1. Antes del Login (Guard)

```
Usuario intenta login
       ↓
LoginThrottlerGuard.canActivate()
       ↓
Verificar bloqueos activos
       ↓
Verificar intentos recientes por IP
       ↓
Verificar intentos recientes por identificador
       ↓
¿Superado límite? → Sí → Bloquear (429)
       ↓ No
Permitir continuar
```

### 2. Durante el Login (Service)

```
AuthService.login()
       ↓
Validar credenciales
       ↓
¿Credenciales válidas?
       ↓
No → Registrar intento fallido → 401
       ↓ Sí
¿Usuario activo?
       ↓
No → Registrar intento fallido → 401
       ↓ Sí
Generar tokens
       ↓
Registrar intento exitoso
       ↓
Retornar respuesta
```

### 3. Respuestas HTTP

#### Login Exitoso (200)
```json
{
  "message": "Login exitoso",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@socgerfleet.com",
    "roles": ["admin"]
  }
}
```

#### Credenciales Inválidas (401)
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas"
}
```

#### Bloqueado por Throttling (429)
```json
{
  "statusCode": 429,
  "message": "Demasiados intentos de login desde esta IP. Bloqueado por 5 minutos.",
  "blockedUntil": "2026-01-19T10:35:00.000Z",
  "remainingTime": "5 minutos"
}
```

---

## 🧪 Pruebas

### Probar Throttling por IP

```bash
# Hacer 6 intentos fallidos desde la misma IP
for i in {1..6}; do
  curl -X POST http://localhost:3000/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "usuario@incorrecto.com",
      "password": "wrongpassword"
    }'
  echo "\nIntento $i completado"
  sleep 2
done
```

Esperado:
- Intentos 1-5: HTTP 401 (Unauthorized)
- Intento 6+: HTTP 429 (Too Many Requests)

### Probar Throttling por Usuario

```bash
# Hacer 4 intentos con el mismo email desde diferentes IPs (simular con diferentes User-Agents)
for i in {1..4}; do
  curl -X POST http://localhost:3000/v1/auth/login \
    -H "Content-Type: application/json" \
    -H "User-Agent: TestClient-$i" \
    -d '{
      "email": "admin@socgerfleet.com",
      "password": "wrongpassword"
    }'
  echo "\nIntento $i completado"
  sleep 2
done
```

Esperado:
- Intentos 1-3: HTTP 401 (Unauthorized)
- Intento 4+: HTTP 429 (Too Many Requests)

### Verificar en Base de Datos

```sql
-- Ver todos los intentos de login
SELECT * FROM login_attempts 
ORDER BY created_at DESC 
LIMIT 20;

-- Ver intentos por IP
SELECT ip_address, COUNT(*) as attempts, 
       SUM(is_successful) as successful,
       SUM(!is_successful) as failed
FROM login_attempts
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY ip_address;

-- Ver bloqueos activos
SELECT * FROM login_attempts
WHERE blocked_until > NOW()
ORDER BY blocked_until DESC;
```

---

## 🔧 Mantenimiento

### Limpieza Automática

El método `cleanOldLoginAttempts()` permite eliminar registros antiguos:

```typescript
// Elimina intentos más antiguos de 30 días
const deletedCount = await authService.cleanOldLoginAttempts();
console.log(`${deletedCount} registros eliminados`);
```

### Configuración Recomendada

Se puede crear un **cron job** para ejecutar limpieza periódica:

```typescript
// Ejemplo con @nestjs/schedule
@Cron('0 2 * * *') // Ejecutar a las 2 AM cada día
async handleCleanup() {
  const deleted = await this.authService.cleanOldLoginAttempts();
  this.logger.log(`Limpieza de login attempts: ${deleted} registros eliminados`);
}
```

---

## 📊 Monitoreo y Métricas

### Consultas Útiles

#### Intentos fallidos en las últimas 24 horas
```sql
SELECT 
  DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
  COUNT(*) as total_attempts,
  SUM(is_successful) as successful,
  SUM(!is_successful) as failed
FROM login_attempts
WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY hour
ORDER BY hour DESC;
```

#### Top IPs con más intentos fallidos
```sql
SELECT 
  ip_address,
  COUNT(*) as failed_attempts,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM login_attempts
WHERE is_successful = 0
  AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY ip_address
HAVING failed_attempts > 5
ORDER BY failed_attempts DESC
LIMIT 10;
```

#### Usuarios bajo ataque
```sql
SELECT 
  identifier,
  COUNT(*) as failed_attempts,
  COUNT(DISTINCT ip_address) as different_ips
FROM login_attempts
WHERE is_successful = 0
  AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY identifier
HAVING failed_attempts > 3
ORDER BY failed_attempts DESC;
```

---

## ⚙️ Configuración Personalizable

Para ajustar los límites, editar [login-throttler.guard.ts](../../src/auth/guards/login-throttler.guard.ts):

```typescript
// Límites actuales
private readonly MAX_ATTEMPTS_BY_IP = 5;
private readonly MAX_ATTEMPTS_BY_IDENTIFIER = 3;
private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutos

// Duraciones de bloqueo progresivo (en minutos)
private readonly BLOCK_DURATIONS = [5, 15, 30, 60, 1440];
```

---

## 🔒 Consideraciones de Seguridad

### ✅ Ventajas

1. **Prevención de Fuerza Bruta**: Limita intentos automatizados
2. **Bloqueo Progresivo**: Disuade ataques persistentes
3. **Tracking Completo**: Auditoría de todos los intentos
4. **Bajo Impacto**: No afecta usuarios legítimos

### ⚠️ Limitaciones

1. **IPs Compartidas**: NAT/Proxies pueden afectar usuarios legítimos
2. **Ataques Distribuidos**: Botnets con muchas IPs diferentes
3. **Almacenamiento**: Crecimiento de la tabla `login_attempts`

### 💡 Mejoras Futuras

1. **Whitelist de IPs**: Permitir IPs confiables sin límite
2. **CAPTCHA**: Agregar después de X intentos fallidos
3. **2FA Obligatorio**: Para cuentas con múltiples intentos fallidos
4. **Alertas**: Notificar al usuario sobre intentos sospechosos
5. **GeoIP**: Bloquear países específicos si es necesario

---

## 📚 Documentación Swagger

La documentación se actualizó automáticamente en Swagger:

- **Endpoint**: `POST /v1/auth/login`
- **Respuesta 429**: Documentada con ejemplo de bloqueo
- **Descripción**: Incluye información sobre throttling

**Acceder a Swagger**: http://localhost:3000/api

---

## ✅ Checklist de Implementación

- [x] Crear entidad `LoginAttempt`
- [x] Implementar `LoginThrottlerGuard`
- [x] Actualizar `AuthService` con tracking
- [x] Integrar guard en `AuthController`
- [x] Crear migración de base de datos
- [x] Ejecutar migración
- [x] Actualizar `AuthModule`
- [x] Documentar en Swagger
- [x] Crear documentación técnica

---

## 🎯 Resultados

### Antes
- Rate limiting básico: 5 intentos/minuto
- Sin tracking de intentos
- Sin bloqueos progresivos
- Sin distinción IP vs Usuario

### Después
- ✅ Throttling avanzado por IP (5/15min)
- ✅ Throttling avanzado por Usuario (3/15min)
- ✅ Tracking completo en BD
- ✅ Bloqueos progresivos (5min → 24h)
- ✅ Auditoría y monitoreo
- ✅ Respuestas HTTP informativas

---

## 📞 Soporte

Para dudas o problemas:
1. Revisar logs de la aplicación
2. Consultar tabla `login_attempts`
3. Verificar configuración en `.env`
4. Revisar documentación de NestJS Throttler

---

**Implementado por:** GitHub Copilot  
**Revisado:** 19 de enero de 2026  
**Próxima revisión:** Según necesidades del proyecto
