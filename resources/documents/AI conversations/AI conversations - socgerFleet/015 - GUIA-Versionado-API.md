# Guía de Versionado de API - SocgerFleet

## Introducción

Esta API utiliza **URI Versioning** para mantener compatibilidad con clientes existentes mientras permite la evolución de los endpoints.

## Estructura de Versionado

### URLs Versionadas

Todas las rutas API incluyen la versión en la URI:

```
https://api.socgerfleet.com/v1/users
https://api.socgerfleet.com/v1/auth/login
https://api.socgerfleet.com/v1/roles
```

### Versión Actual: v1

- **Estado**: Estable
- **Fecha de lanzamiento**: 19 de enero de 2026
- **Deprecación**: TBD (To Be Determined)

## Implementación Técnica

### Configuración Global (main.ts)

```typescript
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

### Controladores

Cada controlador está decorado con `@Version('1')`:

```typescript
@Controller('users')
@Version('1')
export class UsersController {
  // Endpoints accesibles en /v1/users
}
```

## Política de Versionado

### Cuándo crear una nueva versión

**Versión MAJOR (v1 → v2)** - Cuando hay:
- Cambios que rompen compatibilidad (breaking changes)
- Eliminación de endpoints
- Cambios en el formato de respuestas existentes
- Modificación de comportamiento de endpoints

**Versión MINOR (v1.0 → v1.1)** - Cuando hay:
- Nuevos endpoints (sin afectar existentes)
- Nuevos campos opcionales en requests/responses
- Mejoras de rendimiento sin cambios de interfaz

### Proceso para crear v2

1. **Planificación (1-2 semanas antes)**
   ```markdown
   # CHANGELOG - [Unreleased]
   ### Deprecated
   - API v1 será descontinuada el [FECHA]
   - Migrar a v2: [ENLACE A GUÍA DE MIGRACIÓN]
   ```

2. **Implementación**
   ```typescript
   // Crear nuevo controlador o modificar existente
   @Controller('users')
   @Version(['1', '2']) // Soportar ambas versiones temporalmente
   export class UsersController {
     
     @Get()
     @Version('1')
     findAllV1() {
       // Lógica v1
     }
     
     @Get()
     @Version('2')
     findAllV2() {
       // Lógica mejorada v2
     }
   }
   ```

3. **Documentación**
   - Actualizar Swagger para mostrar ambas versiones
   - Crear guía de migración
   - Notificar a consumidores de API

4. **Período de Transición**
   - Mantener v1 activa mínimo 3-6 meses
   - Monitorear uso de v1
   - Deprecar formalmente con fecha límite

5. **Retirada de v1**
   ```typescript
   @Controller('users')
   @Version('2') // Solo v2 disponible
   export class UsersController {
     // Solo nueva lógica
   }
   ```

## Ejemplos de Uso

### Cliente JavaScript/TypeScript

```typescript
// Configurar base URL con versión
const API_BASE = 'https://api.socgerfleet.com/v1';

// Login
const response = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Obtener usuarios
const users = await fetch(`${API_BASE}/users?page=1&limit=10`);
```

### Cliente cURL

```bash
# Login
curl -X POST https://api.socgerfleet.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'

# Obtener usuarios
curl https://api.socgerfleet.com/v1/users?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Swagger y Documentación

La documentación interactiva está disponible en:
```
http://localhost:3000/api/docs
```

Incluye automáticamente todas las versiones disponibles de cada endpoint.

## Testing con Versionado

```typescript
// En tests e2e
describe('Users API v1', () => {
  it('GET /v1/users', () => {
    return request(app.getHttpServer())
      .get('/v1/users')
      .expect(200);
  });
});

describe('Users API v2', () => {
  it('GET /v2/users', () => {
    return request(app.getHttpServer())
      .get('/v2/users')
      .expect(200);
  });
});
```

## Archivos HTTP para Testing

Actualizar archivos `.http` para incluir versión:

```http
### Login v1
POST http://localhost:3000/v1/auth/login
Content-Type: application/json

{
  "email": "admin@socger.com",
  "password": "Admin123!"
}

### Obtener usuarios v1
GET http://localhost:3000/v1/users?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

## Beneficios del Versionado URI

✅ **Claridad**: URLs explícitas (`/v1/users` vs `/v2/users`)  
✅ **Cacheo**: Fácil configuración de caché por versión  
✅ **Testing**: Pruebas paralelas de múltiples versiones  
✅ **Migración gradual**: Clientes migran a su ritmo  
✅ **Swagger**: Documentación clara por versión  

## Relación con CHANGELOG

El versionado de API debe documentarse en el CHANGELOG:

```markdown
## [2.0.0] - 2026-06-01

### Added
- API v2 con paginación cursor-based
- Nuevos campos en respuestas de usuarios
- Endpoint `/v2/users/search` con filtros avanzados

### Deprecated
- API v1 será descontinuada el 2026-12-01
- Migrar a v2 siguiendo: [docs/migration-v1-to-v2.md]

### Breaking Changes
- Campo `createdAt` ahora devuelve ISO 8601 en lugar de timestamp Unix
- Respuestas de paginación ahora incluyen `cursor` en lugar de `page`
```

## Checklist para Nuevas Versiones

- [ ] Planificar breaking changes
- [ ] Crear branch `feature/api-v2`
- [ ] Implementar nuevos controladores/métodos con `@Version('2')`
- [ ] Actualizar tests
- [ ] Actualizar Swagger
- [ ] Crear guía de migración
- [ ] Actualizar CHANGELOG con fecha de deprecación de versión anterior
- [ ] Notificar a consumidores de API (email, docs, etc.)
- [ ] Desplegar en staging para pruebas
- [ ] Período de transición (3-6 meses)
- [ ] Monitorear uso de versión antigua
- [ ] Deprecar versión antigua
- [ ] Eliminar código de versión antigua

## Referencias

- [NestJS Versioning](https://docs.nestjs.com/techniques/versioning)
- [Semantic Versioning](https://semver.org/lang/es/)
- [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)

---

**Última actualización**: 19 de enero de 2026  
**Versión de este documento**: 1.0
