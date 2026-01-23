# Implementación de Rate Limiting en SocgerFleet

**Fecha:** 19 de enero de 2026  
**Medida de seguridad:** Rate Limiting básico  
**Tiempo estimado:** 30 minutos  
**Estado:** ✅ Completado

---

## 📋 Descripción General

Se ha implementado **Rate Limiting** en el proyecto para proteger la API contra:
- Ataques de fuerza bruta
- Abuso de endpoints
- Ataques de denegación de servicio (DoS)
- Intentos masivos de adivinación de contraseñas

## 🔧 Tecnología Utilizada

- **Paquete:** `@nestjs/throttler` (oficial de NestJS)
- **Versión:** Última versión compatible
- **Estrategia:** Rate limiting basado en IP del cliente

## ⚙️ Configuración Implementada

### 1. Configuración Global

En [app.module.ts](../../../src/app.module.ts), se configuró el rate limiting global para toda la aplicación:

```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60000,  // 60 segundos (1 minuto)
    limit: 100,  // 100 peticiones por minuto
  },
])
```

**Parámetros:**
- `ttl` (Time To Live): Ventana de tiempo en milisegundos
- `limit`: Número máximo de peticiones permitidas en esa ventana

### 2. Guard Global

Se aplicó `ThrottlerGuard` de forma global para proteger automáticamente todos los endpoints:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
]
```

### 3. Límites Específicos por Endpoint

Se configuraron límites más estrictos para endpoints sensibles en [auth.controller.ts](../../../src/auth/auth.controller.ts):

| Endpoint | Límite | Ventana | Motivo |
|----------|--------|---------|---------|
| `/auth/login` | 5 peticiones | 1 minuto | Protección contra fuerza bruta |
| `/auth/register` | 3 peticiones | 1 minuto | Prevenir registros masivos |
| `/auth/refresh` | 10 peticiones | 1 minuto | Balance entre seguridad y UX |
| `/auth/request-password-reset` | 3 peticiones | 15 minutos | Prevenir abuso de emails |
| `/auth/reset-password` | 3 peticiones | 15 minutos | Proteger proceso de reset |

#### Ejemplo de implementación:

```typescript
@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } })
async login(...) { ... }
```

## 📊 Comportamiento

### Respuesta Normal
Cuando no se excede el límite, las peticiones se procesan normalmente.

### Respuesta al Exceder el Límite
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1737326400
Retry-After: 60

{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

**Headers informativos:**
- `X-RateLimit-Limit`: Límite máximo de peticiones
- `X-RateLimit-Remaining`: Peticiones restantes en la ventana actual
- `X-RateLimit-Reset`: Timestamp cuando se resetea el contador
- `Retry-After`: Segundos que debe esperar el cliente

## 🎯 Beneficios de Seguridad

1. **Protección contra fuerza bruta:** Limita intentos de login fallidos
2. **Prevención de DoS:** Evita sobrecarga del servidor
3. **Protección de recursos:** Controla el uso de operaciones costosas
4. **Defensa en profundidad:** Capa adicional de seguridad junto con otras medidas

## 🔍 Monitoreo y Ajustes

### Cómo Verificar que Funciona

1. Realizar múltiples peticiones rápidas a un endpoint protegido
2. Verificar que después del límite se recibe HTTP 429
3. Comprobar los headers de rate limit en las respuestas

### Ajustar Límites

Si necesitas modificar los límites globales, edita [app.module.ts](../../../src/app.module.ts#L19-L24):

```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60000,    // Modificar ventana de tiempo
    limit: 100,    // Modificar límite de peticiones
  },
])
```

Para endpoints específicos, modifica los decoradores en [auth.controller.ts](../../../src/auth/auth.controller.ts):

```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
```

### Excluir Endpoints del Rate Limiting

Si necesitas que un endpoint NO tenga rate limiting:

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Get('public-endpoint')
async publicEndpoint() { ... }
```

## 📝 Consideraciones de Implementación

### Estrategia de Identificación
Por defecto, el rate limiting se basa en la **IP del cliente**. Esto significa:
- Cada IP tiene su propio contador
- Usuarios detrás del mismo NAT/proxy comparten límite
- Usuarios móviles que cambian de IP obtienen nuevo contador

### Alternativas Futuras
Para proyectos más grandes, considerar:
- Rate limiting por usuario autenticado (no solo por IP)
- Diferentes límites según roles de usuario
- Storage distribuido con Redis para entornos multi-servidor

### Compatibilidad con Proxies
Si la aplicación está detrás de un proxy (nginx, load balancer):
- Asegurarse que el proxy pasa headers como `X-Forwarded-For`
- Configurar Express para confiar en proxies en [main.ts](../../../src/main.ts)

## 🧪 Testing

### Test Manual con curl

```bash
# Test de límite de login (5 peticiones por minuto)
for i in {1..6}; do
  echo "Intento $i:"
  curl -X POST http://localhost:3000/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done
```

### Test con REST Client Extension

En [api-tests.http](../../../test endpoints with REST CLIENT extension/api-tests.http), puedes agregar:

```http
### Test Rate Limiting - Login (5 intentos)
POST http://localhost:3000/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "wrongpassword"
}

### Repetir esta petición 6 veces rápidamente para ver el error 429
```

## 📈 Próximas Mejoras Posibles

1. **Logging de violaciones:** Registrar cuando se exceden límites
2. **Notificaciones:** Alertar sobre posibles ataques
3. **Rate limiting dinámico:** Ajustar límites según carga del sistema
4. **Whitelist/Blacklist:** IPs de confianza o bloqueadas
5. **Redis storage:** Para entornos con múltiples instancias

## 📚 Referencias

- [NestJS Throttler Documentation](https://docs.nestjs.com/security/rate-limiting)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#rate-limiting)
- [RFC 6585 - Additional HTTP Status Codes (429)](https://tools.ietf.org/html/rfc6585#section-4)

## ✅ Checklist de Implementación

- [x] Instalación de `@nestjs/throttler`
- [x] Configuración global en `app.module.ts`
- [x] Aplicación de `ThrottlerGuard` global
- [x] Límites específicos en endpoint de login
- [x] Límites específicos en endpoint de registro
- [x] Límites específicos en endpoints de recuperación de contraseña
- [x] Límites específicos en endpoint de refresh token
- [x] Documentación de la implementación
- [ ] Testing manual de los límites
- [ ] Verificación en entorno de producción
- [ ] Configuración de monitoring/alertas (futuro)

---

**Resultado:** La API ahora está protegida contra ataques de fuerza bruta y abuso de endpoints mediante rate limiting configurable y granular.
