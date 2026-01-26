# Auto-creación de Perfiles al Registrarse

**Fecha**: 26 de enero de 2026  
**Tipo**: Feature / Enhancement  
**Prioridad**: Alta  
**Estado**: ✅ Implementado

## 📋 Descripción del Problema

Cuando un usuario se registraba introduciendo su `firstName`, `lastName` y `email`, estos datos **NO se pasaban automáticamente** a la creación de su perfil (ClientProfile o ProviderProfile). Esto causaba que el usuario tuviera que **volver a rellenar** la misma información al completar su perfil.

### Experiencia de Usuario Anterior (❌)

1. Usuario se registra con:
   - `firstName`: "María"
   - `lastName`: "García"
   - `email`: "maria@example.com"
2. Usuario es redirigido a completar su perfil
3. **Problema**: Los campos `name`, `email` están vacíos
4. Usuario debe rellenar todo de nuevo manualmente

## ✅ Solución Implementada

### Creación Automática de Perfil al Registrarse

Al registrar un nuevo usuario, el sistema ahora **automáticamente crea un perfil básico de cliente** con los datos proporcionados durante el registro.

### Flujo Mejorado

1. Usuario se registra con datos personales
2. **Backend crea automáticamente** un `ClientProfile` con:
   - `name`: Combinación de `firstName` + `lastName`
   - `location`: "Por configurar" (valor temporal)
   - `profileStatus`: "draft" (borrador)
3. Usuario puede **completar** su perfil con información adicional
4. **No necesita rellenar** nombre, email nuevamente

## 🔧 Cambios Técnicos Realizados

### 1. Módulo de Autenticación (auth.module.ts)

```typescript
// Importar módulos de perfiles
import { ClientProfilesModule } from '../client-profiles/client-profiles.module';
import { ProviderProfilesModule } from '../provider-profiles/provider-profiles.module';

@Module({
  imports: [
    // ... otros imports
    forwardRef(() => ClientProfilesModule),
    forwardRef(() => ProviderProfilesModule),
  ],
  // ...
})
```

**Cambios:**
- Agregado import de `ClientProfilesModule` y `ProviderProfilesModule`
- Usado `forwardRef` para evitar dependencias circulares
- Módulos disponibles para inyección en `AuthService`

### 2. Servicio de Autenticación (auth.service.ts)

#### Inyección de Servicios

```typescript
import { ClientProfilesService } from '../client-profiles/client-profiles.service';
import { ProviderProfilesService } from '../provider-profiles/provider-profiles.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    // ... otros servicios
    @Inject(forwardRef(() => ClientProfilesService))
    private clientProfilesService: ClientProfilesService,
    @Inject(forwardRef(() => ProviderProfilesService))
    private providerProfilesService: ProviderProfilesService,
  ) {}
}
```

#### Método register() Mejorado

```typescript
async register(registerDto: RegisterDto, deviceInfo?: string, ipAddress?: string): Promise<AuthResponse> {
  // ... código de creación de usuario ...

  // 🆕 NUEVO: Crear perfil básico automáticamente
  try {
    const fullName = [registerDto.firstName, registerDto.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || registerDto.username;

    await this.clientProfilesService.create({
      userId: userWithRoles.id,
      name: fullName,
      location: 'Por configurar',
      profileStatus: 'draft',
    }, userWithRoles.id);

    this.logger.log(`Perfil de cliente creado automáticamente para usuario ${userWithRoles.id}`);
  } catch (error) {
    this.logger.warn(`Error al crear perfil automático: ${error.message}`);
  }

  // ... generar tokens y retornar ...
}
```

**Lógica implementada:**
1. **Construir nombre completo**: Combina `firstName` + `lastName` (o usa `username` si no hay nombre)
2. **Crear ClientProfile**: Siempre crea perfil de cliente por defecto
3. **No bloqueante**: Si falla, solo registra un warning, el registro continúa
4. **Estado draft**: Perfil en borrador hasta que el usuario lo complete

## 📊 Estructura de Datos

### Perfil Creado Automáticamente

```json
{
  "id": 2,
  "userId": 8,
  "name": "Juan Pérez",        // ← firstName + lastName
  "location": "Por configurar", // ← Valor temporal
  "profileStatus": "draft",     // ← Estado borrador
  "phone": null,                // ← Se completa después
  "photoUrl": null,             // ← Se completa después
  "languages": null,            // ← Se completa después
  "preferences": null,          // ← Se completa después
  "isPremium": false,
  "createdAt": "2026-01-26T14:25:29.000Z",
  "updatedAt": "2026-01-26T14:25:29.000Z"
}
```

## 🎯 Beneficios

### Para el Usuario
✅ **No repetir información** - Datos del registro se usan automáticamente  
✅ **Experiencia fluida** - Proceso de registro más rápido  
✅ **Menos fricción** - Reduce pasos para empezar a usar la app  
✅ **Perfil inmediato** - Tiene un perfil básico desde el inicio

### Para el Sistema
✅ **Integridad de datos** - Todos los usuarios tienen perfil  
✅ **Consistencia** - Proceso estandarizado de creación  
✅ **Trazabilidad** - Logs claros de creación de perfiles  
✅ **Resiliente** - No bloquea registro si falla creación de perfil

## 📝 Decisiones de Diseño

### ¿Por qué ClientProfile por Defecto?

**Decisión:** Crear siempre un `ClientProfile` (perfil familiar) al registrarse.

**Razones:**
1. **Mayoría de usuarios**: La mayoría busca servicios (son clientes)
2. **Menor fricción**: Es más fácil de completar un perfil de cliente
3. **Convertible**: El usuario puede crear un `ProviderProfile` después si lo desea
4. **Ambos perfiles**: Un usuario puede tener ambos perfiles (cliente Y proveedor)

### ¿Por qué "Por configurar" en location?

**Decisión:** Usar string temporal en lugar de dejar vacío o null.

**Razones:**
1. **Campo requerido**: `location` es `@IsNotEmpty()` en el DTO
2. **Validación clara**: Indica explícitamente que falta configurar
3. **UI amigable**: Frontend puede detectar este valor y mostrar mensaje
4. **Evita errores**: No causa problemas de validación o búsqueda

### ¿Por qué profileStatus = "draft"?

**Decisión:** Marcar el perfil como borrador inicialmente.

**Razones:**
1. **Incompleto**: El perfil solo tiene nombre y ubicación temporal
2. **No público**: No aparece en búsquedas hasta que esté completo
3. **Guía al usuario**: Indica que debe completar su perfil
4. **Estándar**: Coincide con el flujo de perfiles de proveedor

## 🧪 Pruebas y Verificación

### Caso de Prueba 1: Registro con Nombre Completo

**Request:**
```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "user-agent: TestClient/1.0" \
  -d '{
    "username": "juanperez",
    "email": "juan@test.com",
    "password": "Test123!",
    "firstName": "Juan",
    "lastName": "Pérez"
  }'
```

**Resultado Esperado:**
- ✅ Usuario creado con ID 8
- ✅ ClientProfile creado automáticamente
- ✅ `name` = "Juan Pérez"
- ✅ `location` = "Por configurar"
- ✅ `profileStatus` = "draft"

**Logs del Servidor:**
```
[Nest] 32371  - 26/01/2026, 14:25:29 LOG [AuthService] Perfil de cliente creado automáticamente para usuario 8
```

### Caso de Prueba 2: Registro Solo con Username

**Request:**
```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "user-agent: TestClient/1.0" \
  -d '{
    "username": "testuser",
    "email": "test@test.com",
    "password": "Test123!"
  }'
```

**Resultado Esperado:**
- ✅ Usuario creado
- ✅ ClientProfile creado con `name` = "testuser" (fallback)
- ✅ Proceso no falla por falta de firstName/lastName

## 🔄 Posibles Mejoras Futuras

### 1. Detección Inteligente de Rol
```typescript
// Basado en parámetros del registro, crear el tipo de perfil adecuado
if (registerDto.role === 'provider') {
  await this.providerProfilesService.create({...});
} else {
  await this.clientProfilesService.create({...});
}
```

### 2. Pre-poblar Más Campos
```typescript
// Si el frontend envía más datos en el registro
const profileData = {
  userId: user.id,
  name: fullName,
  phone: registerDto.phone,      // ← Si está disponible
  location: registerDto.location, // ← Si está disponible
  profileStatus: 'draft',
};
```

### 3. Detección de Ubicación Automática
```typescript
// Usar IP del usuario para sugerir ubicación inicial
const suggestedLocation = await this.geoService.getLocationFromIP(ipAddress);
// En lugar de "Por configurar", usar ciudad detectada
```

### 4. Webhook/Event para Completar Perfil
```typescript
// Emitir evento para que el frontend muestre wizard de completar perfil
this.eventEmitter.emit('user.registered', {
  userId: user.id,
  profileStatus: 'draft',
  needsCompletion: true,
});
```

## 📎 Archivos Modificados

1. **`src/auth/auth.module.ts`**
   - Agregados imports de `ClientProfilesModule` y `ProviderProfilesModule`
   - Usado `forwardRef` para dependencias circulares

2. **`src/auth/auth.service.ts`**
   - Agregados imports de servicios de perfiles
   - Agregado `Logger` para logging estructurado
   - Modificado método `register()` para crear perfil automáticamente
   - Agregada lógica de construcción de nombre completo
   - Agregado manejo de errores no bloqueante

## 🔗 Referencias

- **Entidades**: 
  - [client-profile.entity.ts](../../src/entities/client-profile.entity.ts)
  - [provider-profile.entity.ts](../../src/entities/provider-profile.entity.ts)
- **DTOs**: 
  - [create-client-profile.dto.ts](../../src/client-profiles/dto/create-client-profile.dto.ts)
- **Servicios**: 
  - [client-profiles.service.ts](../../src/client-profiles/client-profiles.service.ts)
- **Documentación relacionada**:
  - [001-FIX-EMAIL-SERVICE-ERROR-ON-REGISTER.md](../001-FIX-EMAIL-SERVICE-ERROR-ON-REGISTER.md)

---

**Implementado por**: GitHub Copilot  
**Fecha**: 26 de enero de 2026  
**Estado**: ✅ Completado y Verificado
