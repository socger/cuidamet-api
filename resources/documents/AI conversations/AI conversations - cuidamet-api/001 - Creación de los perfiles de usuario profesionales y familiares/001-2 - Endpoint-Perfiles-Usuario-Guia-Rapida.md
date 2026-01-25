# Endpoint de Perfiles de Usuario - Guía Rápida

## 📋 Descripción

Nuevo endpoint público que permite acceder a los perfiles de cliente y proveedor de un usuario en una sola llamada API.

## 🔗 Endpoint

```
GET /v1/users/:id/profiles
```

- **Método**: GET
- **Autenticación**: No requerida (público)
- **Parámetros de ruta**: `id` (number) - ID del usuario

## 📊 Respuesta

### Estructura
```typescript
{
  message: string;
  data: {
    clientProfile: ClientProfile | null;
    providerProfile: ProviderProfile | null;
    hasProfiles: boolean;
    profileType: 'none' | 'client' | 'provider' | 'both';
  }
}
```

### Casos posibles

#### 1. Usuario sin perfiles
```json
{
  "message": "Perfiles obtenidos exitosamente",
  "data": {
    "clientProfile": null,
    "providerProfile": null,
    "hasProfiles": false,
    "profileType": "none"
  }
}
```

#### 2. Usuario solo con perfil de cliente
```json
{
  "message": "Perfiles obtenidos exitosamente",
  "data": {
    "clientProfile": {
      "id": 1,
      "userId": 1,
      "address": "Calle Ejemplo 123",
      "city": "Madrid",
      "postalCode": "28001",
      "phoneNumber": "+34600000000",
      "emergencyContactName": "Juan Pérez",
      "emergencyContactPhone": "+34600000001",
      "preferredLanguage": "es",
      "notifications": true,
      "createdAt": "2026-01-25T10:00:00.000Z",
      "updatedAt": "2026-01-25T10:00:00.000Z"
    },
    "providerProfile": null,
    "hasProfiles": true,
    "profileType": "client"
  }
}
```

#### 3. Usuario solo con perfil de proveedor
```json
{
  "message": "Perfiles obtenidos exitosamente",
  "data": {
    "clientProfile": null,
    "providerProfile": {
      "id": 1,
      "userId": 1,
      "businessName": "Mi Negocio SL",
      "businessType": "company",
      "taxId": "B12345678",
      "address": "Calle Negocio 456",
      "city": "Barcelona",
      "postalCode": "08001",
      "phoneNumber": "+34600000002",
      "website": "https://minegocio.com",
      "description": "Proveedor de servicios",
      "verified": false,
      "rating": null,
      "createdAt": "2026-01-25T10:00:00.000Z",
      "updatedAt": "2026-01-25T10:00:00.000Z"
    },
    "hasProfiles": true,
    "profileType": "provider"
  }
}
```

#### 4. Usuario con ambos perfiles
```json
{
  "message": "Perfiles obtenidos exitosamente",
  "data": {
    "clientProfile": { /* ... */ },
    "providerProfile": { /* ... */ },
    "hasProfiles": true,
    "profileType": "both"
  }
}
```

#### 5. Usuario no encontrado (404)
```json
{
  "statusCode": 404,
  "message": "Usuario con ID 99999 no encontrado",
  "error": "Not Found"
}
```

## 💡 Casos de Uso

### Frontend - Determinar qué UI mostrar
```typescript
const response = await fetch('http://localhost:3000/v1/users/1/profiles');
const { data } = await response.json();

switch (data.profileType) {
  case 'none':
    // Mostrar mensaje: "Este usuario aún no tiene perfiles"
    // Botón: "Crear perfil"
    break;
    
  case 'client':
    // Mostrar UI de cliente
    // Renderizar datos de clientProfile
    break;
    
  case 'provider':
    // Mostrar UI de proveedor
    // Renderizar datos de providerProfile
    break;
    
  case 'both':
    // Mostrar toggle para cambiar entre cliente y proveedor
    // Renderizar ambos perfiles según selección
    break;
}
```

### Frontend - Verificar si usuario puede realizar acción
```typescript
async function canBookService(userId: number): Promise<boolean> {
  const { data } = await getUserProfiles(userId);
  // Solo usuarios con perfil de cliente pueden reservar
  return data.profileType === 'client' || data.profileType === 'both';
}

async function canOfferService(userId: number): Promise<boolean> {
  const { data } = await getUserProfiles(userId);
  // Solo usuarios con perfil de proveedor pueden ofrecer servicios
  return data.profileType === 'provider' || data.profileType === 'both';
}
```

### Frontend - Redirección condicional
```typescript
async function redirectBasedOnProfile(userId: number) {
  const { data } = await getUserProfiles(userId);
  
  if (data.profileType === 'none') {
    // Redirigir a creación de perfil
    router.push('/create-profile');
  } else if (data.profileType === 'client') {
    // Redirigir a búsqueda de servicios
    router.push('/search-providers');
  } else if (data.profileType === 'provider') {
    // Redirigir a panel de proveedor
    router.push('/provider-dashboard');
  } else {
    // Usuario con ambos perfiles - mostrar selector
    router.push('/profile-selector');
  }
}
```

## 🎯 Ventajas

### Para el Frontend
- ✅ **Una sola llamada API** en lugar de múltiples queries
- ✅ **Campo `profileType`** indica rápidamente qué UI mostrar
- ✅ **Campo `hasProfiles`** para mostrar mensaje si usuario no tiene perfiles
- ✅ **Cacheable** (el profileType no cambia frecuentemente)

### Para el Backend
- ✅ **Consulta optimizada** con LEFT JOIN (una sola query SQL)
- ✅ **TypeORM carga relaciones** automáticamente
- ✅ **Relaciones bidireccionales** disponibles internamente

## 🧪 Testing

### Con REST Client (VS Code)
Ver archivo: `test endpoints with REST CLIENT extension/user-profiles-relations-tests.http`

```http
### Obtener perfiles de usuario
GET http://localhost:3000/v1/users/1/profiles
Content-Type: application/json
```

### Con Swagger
1. Acceder a: http://localhost:3000/api/docs
2. Buscar endpoint: `GET /v1/users/{id}/profiles`
3. Clic en "Try it out"
4. Ingresar ID del usuario
5. Clic en "Execute"

### Con cURL
```bash
curl -X GET "http://localhost:3000/v1/users/1/profiles" \
  -H "Content-Type: application/json"
```

### Con JavaScript/TypeScript
```typescript
const getUserProfiles = async (userId: number) => {
  const response = await fetch(`http://localhost:3000/v1/users/${userId}/profiles`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

// Uso
const result = await getUserProfiles(1);
console.log(result.data.profileType); // 'client', 'provider', 'both', 'none'
```

## 🔧 Implementación Técnica

### Archivos creados/modificados
- ✅ `src/users/users.controller.ts` - Nuevo endpoint `@Get(':id/profiles')`
- ✅ `src/users/users.service.ts` - Nuevo método `getUserProfiles()`
- ✅ `src/users/dto/user-profiles-response.dto.ts` - Nuevo DTO de respuesta
- ✅ `src/entities/user.entity.ts` - Relaciones bidireccionales agregadas
- ✅ `test endpoints.../user-profiles-relations-tests.http` - Tests actualizados

### Relaciones bidireccionales
```typescript
// En User entity
@OneToOne(() => ClientProfile, (clientProfile) => clientProfile.user, {
  nullable: true,
})
clientProfile?: ClientProfile;

@OneToOne(() => ProviderProfile, (providerProfile) => providerProfile.user, {
  nullable: true,
})
providerProfile?: ProviderProfile;
```

### Lógica del servicio
```typescript
async getUserProfiles(userId: number) {
  // Cargar usuario con relaciones
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['clientProfile', 'providerProfile'],
  });

  if (!user) {
    throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
  }

  // Determinar tipo de perfil
  const hasClientProfile = !!user.clientProfile;
  const hasProviderProfile = !!user.providerProfile;
  
  let profileType: 'none' | 'client' | 'provider' | 'both' = 'none';
  if (hasClientProfile && hasProviderProfile) {
    profileType = 'both';
  } else if (hasClientProfile) {
    profileType = 'client';
  } else if (hasProviderProfile) {
    profileType = 'provider';
  }

  return {
    clientProfile: user.clientProfile || null,
    providerProfile: user.providerProfile || null,
    hasProfiles: hasClientProfile || hasProviderProfile,
    profileType,
  };
}
```

## ⚡ Rendimiento

- **Query optimizada**: TypeORM genera un LEFT JOIN eficiente
- **Una sola query SQL**: No hay N+1 problem
- **Cacheable**: Los datos de perfiles no cambian frecuentemente
- **Sin sobrecarga**: Solo carga los campos necesarios

### Query SQL generada
```sql
SELECT 
  user.*, 
  clientProfile.*, 
  providerProfile.*
FROM users user
LEFT JOIN client_profiles clientProfile ON clientProfile.user_id = user.id
LEFT JOIN provider_profiles providerProfile ON providerProfile.user_id = user.id
WHERE user.id = ?
```

## 📚 Documentación Adicional

- **Swagger**: http://localhost:3000/api/docs
- **CHANGELOG**: Ver sección `[Unreleased] - Added`
- **Tests**: `test endpoints with REST CLIENT extension/user-profiles-relations-tests.http`

## 🔐 Consideraciones de Seguridad

### Endpoint público (sin autenticación)
Actualmente el endpoint es público. Si necesitas protegerlo:

```typescript
@Get(':id/profiles')
@UseGuards(JwtAuthGuard)  // ← Agregar guard
@ApiBearerAuth('JWT-auth') // ← Agregar documentación Swagger
async getUserProfiles(@Param('id', ParseIntPipe) id: number) {
  // ...
}
```

### Validación de permisos
Si quieres que usuarios solo vean sus propios perfiles:

```typescript
async getUserProfiles(
  @Param('id', ParseIntPipe) id: number,
  @Request() req
) {
  // Validar que el usuario solo acceda a su propio perfil
  if (req.user?.userId !== id && !req.user?.roles?.includes('admin')) {
    throw new ForbiddenException('No tienes permiso para ver estos perfiles');
  }
  
  return {
    message: 'Perfiles obtenidos exitosamente',
    data: await this.usersService.getUserProfiles(id),
  };
}
```

## ✨ Próximas Mejoras Posibles

- [ ] Agregar filtro de campos (`?fields=clientProfile.address,providerProfile.businessName`)
- [ ] Incluir estadísticas de perfiles (cantidad de servicios, reservas, etc.)
- [ ] Endpoint para actualizar múltiples perfiles en una sola llamada
- [ ] WebSocket para notificar cambios en perfiles en tiempo real
- [ ] Cache con Redis para mejorar rendimiento

---

**Fecha de implementación**: 25 de enero de 2026  
**Versión de API**: v1  
**Estado**: ✅ Implementado y probado
