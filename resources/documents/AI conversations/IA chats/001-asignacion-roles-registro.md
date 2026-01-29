# Solución: Asignación Correcta de Roles Durante el Registro de Usuarios

**Fecha**: 29 de enero de 2026  
**Problema**: Cuando un usuario se registraba, siempre se le asignaba el rol "user" en lugar del rol correspondiente a su tipo de perfil ("provider" o "client").

## 📋 Problema Identificado

Al registrarse, los usuarios deben elegir entre dos tipos de perfil:
- **Perfil Profesional** → Debería asignarse el rol `provider`
- **Perfil Familiar** → Debería asignarse el rol `client`

Sin embargo, el sistema siempre asignaba el rol genérico `user`, ignorando la selección del usuario.

## 🔧 Solución Implementada

### 1. Base de Datos - Agregar Nuevos Roles

**Archivo modificado**: `docker/mysql/init/01_create_tables.sql`

Se agregaron los roles `provider` y `client` a la inicialización de la base de datos:

```sql
-- Insertar roles por defecto
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrador del sistema con todos los permisos'),
('user', 'Usuario básico del sistema'),
('moderator', 'Moderador con permisos especiales'),
('provider', 'Cuidador profesional que ofrece servicios'),
('client', 'Cliente familiar que busca y contrata servicios')
ON DUPLICATE KEY UPDATE description = VALUES(description);
```

**Roles creados**:
- `id: 4` → `provider` - Cuidador profesional que ofrece servicios
- `id: 5` → `client` - Cliente familiar que busca y contrata servicios

### 2. Backend - DTO de Registro

**Archivo modificado**: `src/auth/dto/register.dto.ts`

Se agregó el campo `profileType` para indicar el tipo de perfil seleccionado:

```typescript
@ApiProperty({
  description: 'Tipo de perfil del usuario: provider (cuidador) o client (familiar)',
  example: 'provider',
  enum: ['provider', 'client'],
  type: String,
})
@IsString()
@IsIn(['provider', 'client'], {
  message: 'El tipo de perfil debe ser "provider" o "client"',
})
profileType: 'provider' | 'client';
```

### 3. Backend - Servicio de Autenticación

**Archivo modificado**: `src/auth/auth.service.ts`

Se modificó el método `register()` para asignar el rol correcto según el `profileType`:

```typescript
// Obtener rol según el tipo de perfil seleccionado
const roleName = registerDto.profileType; // 'provider' o 'client'
let role = await this.rolesService.findByName(roleName);

// Si el rol no existe, crearlo (solo en desarrollo)
if (!role) {
  const roleDescription = 
    roleName === 'provider' 
      ? 'Cuidador profesional que ofrece servicios' 
      : 'Cliente familiar que busca y contrata servicios';
  
  role = await this.rolesService.create({
    name: roleName,
    description: roleDescription,
  });
}

// Crear el usuario CON EL ROL CORRECTO incluido en la creación
const createUserDto = {
  ...registerDto,
  roleIds: [role.id], // Asignar el rol correspondiente al tipo de perfil
};
```

### 4. Frontend - Servicio de Autenticación

**Archivo modificado**: `services/authService.ts`

Se actualizó la interfaz `RegisterData` para incluir el campo `profileType`:

```typescript
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profileType: 'provider' | 'client'; // Tipo de perfil
}
```

### 5. Frontend - Componente de Autenticación

**Archivo modificado**: `components/AuthPage.tsx`

Se modificó el método `handleSignupStep1` para enviar el `profileType` al backend:

```typescript
// Convertir el rol del frontend a profileType del backend
const profileType = role === 'provider' ? 'provider' : 'client';

// Registrar usuario en el backend con el tipo de perfil
const response = await authService.register({
  username: generatedUsername,
  email,
  password,
  firstName: firstName || undefined,
  lastName: lastName || undefined,
  profileType, // Enviar el tipo de perfil al backend
});
```

## ✅ Resultado

Ahora, cuando un usuario se registra:

1. **Selecciona su tipo de perfil** en el frontend (Profesional o Familiar)
2. **El frontend envía** el `profileType` correspondiente (`provider` o `client`)
3. **El backend asigna** automáticamente el rol correcto en la tabla `user_roles`
4. **El usuario queda registrado** con el rol apropiado:
   - Perfil Profesional → Rol `provider` (id: 4)
   - Perfil Familiar → Rol `client` (id: 5)

## 🔍 Verificación

Para verificar que los roles se asignan correctamente:

```sql
-- Ver todos los roles
SELECT id, name, description FROM roles;

-- Ver usuarios con sus roles
SELECT 
  u.id, 
  u.username, 
  u.email, 
  r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;
```

## 📝 Notas Importantes

1. **Reiniciar Docker**: Para que los cambios en el script SQL se apliquen, fue necesario:
   ```bash
   docker compose down
   docker compose up -d
   ```

2. **Validación estricta**: El campo `profileType` solo acepta los valores `'provider'` o `'client'`, cualquier otro valor será rechazado.

3. **Compatibilidad**: El rol `user` se mantiene para compatibilidad con usuarios antiguos o casos especiales.

4. **Roles en la respuesta**: Al registrarse, el backend devuelve el usuario con sus roles asignados, que pueden ser utilizados por el frontend para configurar la aplicación.

## 🚀 Próximos Pasos

- [ ] Implementar migración de usuarios existentes con rol `user` para asignarles el rol correcto
- [ ] Crear endpoint para que usuarios puedan cambiar entre perfiles (provider/client) si tienen ambos
- [ ] Agregar validación de permisos específicos por rol en los endpoints de la API
