# Implementación de Entidades para Perfiles de Usuario - Cuidamet API

**Fecha:** 23 de enero de 2026  
**Autor:** GitHub Copilot (Claude Sonnet 4.5)  
**Contexto:** Creación de entidades para soportar los perfiles de usuarios del frontend Cuidamet

---

## 📋 Resumen Ejecutivo

Se han creado **5 nuevas entidades** en el repositorio cuidamet-api para soportar la funcionalidad de perfiles de usuarios (clientes y proveedores) que actualmente existe en el frontend pero no tiene persistencia en base de datos.

### Entidades Creadas

1. **ClientProfile** - Perfiles de clientes/familias que buscan servicios
2. **ProviderProfile** - Perfiles de proveedores/profesionales que ofrecen servicios
3. **ServiceConfig** - Configuración de servicios ofrecidos por proveedores
4. **Certificate** - Certificados, referencias y documentos de verificación
5. **ServiceVariation** - Variaciones de precios de servicios

---

## 🏗️ Arquitectura de Entidades

### Diagrama de Relaciones

```
User (existing)
├── ClientProfile (1:1)
│   └── Campos: name, phone, photoUrl, location, coordinates, languages, preferences
│
└── ProviderProfile (1:1)
    ├── Campos base: name, phone, photoUrl, location, coordinates, languages, availability
    ├── Métricas: rating, reviewsCount, completedBookings
    ├── Estado: providerStatus, isPremium, verifications, badges
    │
    └── ServiceConfig (1:N)
        ├── Campos: careCategory, completed, tasks, rates, description, experience
        ├── Disponibilidad: availability, schedule, specificDates
        ├── Habilidades: medicalSkills (elderly), acceptedPets (pets), cleaningProducts (housekeeping)
        │
        ├── Certificate (1:N)
        │   └── Campos: name, type, description, status, fileUrl, verifiedAt
        │
        └── ServiceVariation (1:N)
            └── Campos: name, price, unit, enabled, description, displayOrder
```

---

## 📄 Detalle de Entidades

### 1. ClientProfile (`client-profile.entity.ts`)

**Propósito:** Almacenar información de usuarios que buscan servicios de cuidado.

**Campos principales:**
- `userId` (único) - Relación 1:1 con User
- `name`, `phone`, `photoUrl` - Información básica
- `location`, `latitude`, `longitude` - Ubicación geográfica
- `languages[]` - Idiomas que habla
- `preferences[]` - Categorías de cuidado que le interesan (CareCategory)
- `profileStatus` - Estado: draft, published, suspended
- `isPremium` - Suscripción premium

**Relaciones:**
- OneToOne con `User`

**Campos de auditoría (heredados de BaseEntity):**
- `id`, `createdAt`, `updatedAt`, `deletedAt`
- `createdBy`, `updatedBy`, `deletedBy`

---

### 2. ProviderProfile (`provider-profile.entity.ts`)

**Propósito:** Almacenar información de profesionales que ofrecen servicios de cuidado.

**Campos principales:**
- `userId` (único) - Relación 1:1 con User
- `name`, `phone`, `photoUrl` - Información básica
- `location`, `latitude`, `longitude` - Ubicación geográfica
- `languages[]` - Idiomas que habla
- `availability[]` - Disponibilidad agregada para búsqueda
- `profileStatus` - Estado: draft, published, suspended
- `isPremium` - Suscripción premium
- `providerStatus` - Disponibilidad: available, busy, offline
- `rating` - Calificación promedio (0-5)
- `reviewsCount` - Número de reseñas
- `completedBookings` - Servicios completados
- `verifications[]` - Verificaciones obtenidas
- `badges[]` - Insignias y reconocimientos

**Relaciones:**
- OneToOne con `User`
- OneToMany con `ServiceConfig`

---

### 3. ServiceConfig (`service-config.entity.ts`)

**Propósito:** Configurar cada tipo de servicio que ofrece un proveedor.

**Campos principales:**
- `providerId` - Relación con ProviderProfile
- `careCategory` - Tipo de servicio: Elderly Care, Child Care, Pet Care, Home Cleaning
- `completed` - Si la configuración está completa
- `tasks[]` - Servicios específicos ofrecidos
- `hourlyRate`, `shiftRate`, `urgentSurcharge` - Tarifas base
- `description` - Descripción del servicio
- `experience` - Años de experiencia
- `availability[]`, `scheduleStart`, `scheduleEnd`, `specificDates[]` - Disponibilidad
- `training` - Formación específica

**Campos específicos por categoría:**
- **Elderly Care:** `medicalSkills[]` (Alzheimer, Parkinson, etc.)
- **Pet Care:** `acceptedPets[]`, `petWorkZones[]`, `maxPets`
- **Housekeeping:** `cleaningProducts`, `hasEquipment`, `wasteManagement`, `ecoFriendly`

**Relaciones:**
- ManyToOne con `ProviderProfile`
- OneToMany con `Certificate`
- OneToMany con `ServiceVariation`

---

### 4. Certificate (`certificate.entity.ts`)

**Propósito:** Almacenar certificados, referencias y documentos de verificación.

**Campos principales:**
- `serviceConfigId` - Relación con ServiceConfig
- `name` - Nombre de la institución o referencia
- `contactInfo` - Información de contacto (privada)
- `description` - Descripción del certificado
- `certificateType` - Tipo: experience, education, license, other
- `fileName`, `fileUrl` - Archivo subido
- `verificationStatus` - Estado: pending, verified, rejected
- `verifiedAt`, `verifiedBy` - Información de verificación
- `rejectionReason` - Razón del rechazo (si aplica)

**Relaciones:**
- ManyToOne con `ServiceConfig`

---

### 5. ServiceVariation (`service-variation.entity.ts`)

**Propósito:** Diferentes modalidades de cobro para un servicio.

**Campos principales:**
- `serviceConfigId` - Relación con ServiceConfig
- `name` - Nombre de la variación (ej: "Por hora", "Por noche")
- `price` - Precio
- `unit` - Unidad: hora, noche, visita, paseo, servicio, m2, día
- `enabled` - Si está activa
- `description` - Descripción de la variación
- `isCustom` - Si es personalizada por el usuario
- `displayOrder` - Orden de visualización

**Relaciones:**
- ManyToOne con `ServiceConfig`

---

## 🔄 Mapeo Frontend → Backend

### Tipos TypeScript del Frontend (types.ts)

#### ClientProfile
```typescript
interface ClientProfile {
  name: string;
  email: string;        // Ya está en User.email
  phone: string;
  photoUrl: string;
  location: string;
  languages: string[];
  preferences: CareCategory[];
}
```

**✅ Mapeo:** Corresponde directamente a la entidad `ClientProfile`, excepto `email` que se obtiene de la relación con `User`.

---

#### ProviderProfile
```typescript
interface ProviderProfile {
  name: string;
  email: string;        // Ya está en User.email
  phone: string;
  photoUrl: string;
  location: string;
  languages: string[];
  availability: string[];
  services: Record<CareCategory, ServiceConfig>;
}
```

**✅ Mapeo:** 
- Campos básicos → `ProviderProfile` entity
- `services` → Relación OneToMany con `ServiceConfig`

---

#### ServiceConfig
```typescript
interface ServiceConfig {
  completed: boolean;
  tasks: string[];
  rates: ServiceRates;
  variations: ServiceVariation[];
  experience: string;
  availability?: string[];
  schedule?: { startTime: string; endTime: string };
  specificDates?: string[];
  training?: string;
  description?: string;
  certificates: Certificate[];
  petAttributes?: PetAttributes;
  housekeepingAttributes?: HousekeepingAttributes;
  medicalSkills?: string[];
}
```

**✅ Mapeo:**
- Campos generales → `ServiceConfig` entity
- `rates` → Campos `hourlyRate`, `shiftRate`, `urgentSurcharge` en ServiceConfig
- `variations[]` → Relación OneToMany con `ServiceVariation` entity
- `certificates[]` → Relación OneToMany con `Certificate` entity
- Atributos específicos → Campos en ServiceConfig (petAttributes, housekeepingAttributes, medicalSkills)

---

#### Certificate
```typescript
interface Certificate {
  id: string;
  name: string;
  contactInfo?: string;
  description: string;
  type: CertificateType;
  fileName?: string;
  fileUrl?: string;
  status: VerificationStatus;
  dateAdded: string;
}
```

**✅ Mapeo:** Corresponde directamente a la entidad `Certificate`.

---

#### ServiceVariation
```typescript
interface ServiceVariation {
  name: string;
  price: number;
  unit: string;
  enabled: boolean;
  description: string;
  isCustom?: boolean;
}
```

**✅ Mapeo:** Corresponde directamente a la entidad `ServiceVariation` (añadimos `displayOrder`).

---

## 📊 Casos de Uso

### 1. Crear Perfil de Cliente
```typescript
// Frontend envía:
{
  name: "María García",
  phone: "+34612345678",
  photoUrl: "https://...",
  location: "Madrid, España",
  latitude: 40.4168,
  longitude: -3.7038,
  languages: ["Español", "Inglés"],
  preferences: ["Elderly Care", "Child Care"]
}

// Backend crea:
ClientProfile {
  userId: currentUser.id,
  name: "María García",
  phone: "+34612345678",
  photoUrl: "https://...",
  location: "Madrid, España",
  latitude: 40.4168,
  longitude: -3.7038,
  languages: ["Español", "Inglés"],
  preferences: ["Elderly Care", "Child Care"],
  profileStatus: "draft",
  isPremium: false,
  createdBy: currentUser.id
}
```

---

### 2. Crear Perfil de Proveedor con Servicios
```typescript
// Frontend envía:
{
  // Datos básicos del proveedor
  name: "Ana García",
  phone: "+34612345678",
  photoUrl: "https://...",
  location: "Madrid, España",
  languages: ["Español", "Inglés"],
  availability: ["Mañanas", "Tardes"],
  
  // Configuración de servicios
  services: {
    "Elderly Care": {
      completed: true,
      tasks: ["Gestión de Medicamentos", "Compañía"],
      rates: { hourly: 15, shift: 100, urgentSurcharge: 20 },
      experience: "5-10 años",
      description: "Como enfermera con 10 años...",
      medicalSkills: ["Alzheimer", "Parkinson"],
      certificates: [{...}],
      variations: [{name: "Por hora", price: 15, unit: "hora", enabled: true}]
    }
  }
}

// Backend crea:
ProviderProfile {
  userId: currentUser.id,
  name: "Ana García",
  ...otros campos básicos,
  profileStatus: "draft"
}

ServiceConfig {
  providerId: providerProfile.id,
  careCategory: "Elderly Care",
  completed: true,
  tasks: ["Gestión de Medicamentos", "Compañía"],
  hourlyRate: 15,
  shiftRate: 100,
  urgentSurcharge: 20,
  experience: "5-10 años",
  description: "Como enfermera con 10 años...",
  medicalSkills: ["Alzheimer", "Parkinson"]
}

Certificate[] // Relación cascade
ServiceVariation[] // Relación cascade
```

---

### 3. Búsqueda de Proveedores
```sql
-- Buscar proveedores por categoría y ubicación
SELECT 
  pp.*,
  sc.care_category,
  sc.hourly_rate,
  sc.rating
FROM provider_profiles pp
INNER JOIN service_configs sc ON pp.id = sc.provider_id
WHERE 
  sc.care_category = 'Elderly Care'
  AND sc.completed = true
  AND pp.profile_status = 'published'
  AND pp.provider_status = 'available'
  AND pp.latitude BETWEEN 40.3 AND 40.5
  AND pp.longitude BETWEEN -3.8 AND -3.6
ORDER BY pp.rating DESC, pp.reviews_count DESC;
```

---

## 🔐 Seguridad y Validaciones

### Validaciones Recomendadas

1. **Un usuario solo puede tener un ClientProfile Y/O un ProviderProfile**
2. **El userId debe coincidir con el usuario autenticado** (excepto admins)
3. **Solo el propietario puede modificar su perfil**
4. **Los certificados con estado 'verified' no pueden ser modificados** por el usuario
5. **ProfileStatus 'published' requiere** que el perfil esté completo
6. **ServiceConfig.completed debe ser true** para que el servicio sea visible

---

## 📝 Próximos Pasos

### 1. Generar Migración
```bash
npm run migration:generate -- src/database/migrations/AddProfileEntities
```

### 2. Ejecutar Migración
```bash
npm run migration:run
```

### 3. Crear DTOs
- `create-client-profile.dto.ts`
- `update-client-profile.dto.ts`
- `create-provider-profile.dto.ts`
- `update-provider-profile.dto.ts`
- `create-service-config.dto.ts`
- `create-certificate.dto.ts`
- `create-service-variation.dto.ts`
- Filtros para búsquedas

### 4. Crear Servicios
- `client-profiles.service.ts` con CRUD completo
- `provider-profiles.service.ts` con CRUD completo y lógica de búsqueda
- Validaciones de negocio

### 5. Crear Controladores
- `client-profiles.controller.ts`
- `provider-profiles.controller.ts`
- Documentación Swagger completa

### 6. Crear Módulos
- `client-profiles.module.ts`
- `provider-profiles.module.ts`

### 7. (Opcional) Crear Seeders
- Datos de prueba para perfiles de clientes
- Datos de prueba para perfiles de proveedores con servicios completos

---

## 🎯 Beneficios de la Implementación

1. **✅ Persistencia:** Los perfiles ya no se pierden al reiniciar la app
2. **✅ Escalabilidad:** Arquitectura preparada para miles de usuarios
3. **✅ Búsqueda eficiente:** Índices en ubicación, categorías, rating
4. **✅ Auditoría completa:** Tracking de quién crea/modifica/elimina
5. **✅ Soft delete:** Los perfiles eliminados se pueden recuperar
6. **✅ Flexibilidad:** Fácil añadir nuevos campos o categorías
7. **✅ Verificación:** Sistema de certificados con estados de verificación
8. **✅ Precios dinámicos:** Variaciones de precios personalizables

---

## 📚 Referencias

- **Frontend types:** `/home/socger/trabajo/socger/cuidamet/types.ts`
- **Frontend mock data:** `/home/socger/trabajo/socger/cuidamet/services/mockData.ts`
- **Guía de creación de entidades:** `010 - GUIA-Crear-Nuevas-Entidades.md`
- **Base Entity:** `/home/socger/trabajo/socger/cuidamet-api/src/entities/base.entity.ts`

---

**Estado:** ✅ Entidades creadas y registradas en database.config.ts  
**Pendiente:** Generar y ejecutar migraciones, crear DTOs, servicios y controladores
