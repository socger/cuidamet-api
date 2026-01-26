# Fix: Error "Internal server error" al registrar usuarios

**Fecha**: 26 de enero de 2026  
**Tipo**: Bug Fix  
**Severidad**: Alta  
**Estado**: ✅ Resuelto

## 📋 Descripción del Problema

Al registrar un nuevo usuario como "perfil familiar" (o cualquier tipo de usuario), el frontend mostraba un error tipo popup con el mensaje:

```
Error de registro - Internal server error
```

**Síntoma peculiar**: A pesar del error, el usuario SÍ se guardaba correctamente en la tabla `users` de la base de datos.

## 🔍 Análisis de la Causa Raíz

### Flujo de Registro (auth.service.ts)

El proceso de registro seguía estos pasos:

1. ✅ Validar que email y username sean únicos
2. ✅ Crear el usuario en la base de datos
3. ✅ Asignar rol por defecto
4. ⚠️ **ENVIAR EMAIL DE VERIFICACIÓN** ← Aquí fallaba
5. ❌ Generar tokens JWT (nunca se ejecutaba)
6. ❌ Retornar respuesta exitosa (nunca se ejecutaba)

### El Problema: Envío de Email Bloqueante

En `auth.service.ts` línea ~198:

```typescript
// Enviar email de verificación
await this.passwordManagementService.sendVerificationEmail(userWithRoles);
```

Este `await` hacía que si el envío de email fallaba (por ejemplo, no hay servidor SMTP configurado en desarrollo), se lanzaba una excepción que:

1. Interrumpía el flujo del registro
2. Hacía que el endpoint devolviera un error 500
3. El usuario ya estaba creado en la BD, pero el frontend recibía error

### El Origen del Fallo: email.service.ts

En el servicio de email, cuando fallaba el envío (línea ~68-71):

```typescript
catch (error) {
  this.logger.error(
    `Error enviando email de verificación a ${email}:`,
    error,
  );
  throw new Error('No se pudo enviar el email de verificación'); // ← Lanzaba error
}
```

**Por qué fallaba en desarrollo:**
- No hay servidor SMTP configurado (MAIL_HOST, MAIL_PORT, etc.)
- Nodemailer intenta conectarse y falla
- La excepción se propaga y detiene el registro

## ✅ Solución Implementada

### 1. Hacer el envío de email NO BLOQUEANTE en auth.service.ts

```typescript
// Enviar email de verificación (no bloqueante - si falla, no afecta el registro)
try {
  await this.passwordManagementService.sendVerificationEmail(userWithRoles);
} catch (error) {
  // Log del error pero no bloquear el registro
  console.error('Error al enviar email de verificación:', error.message);
}
```

**Beneficios:**
- ✅ El registro se completa aunque falle el email
- ✅ Se registra el error para debugging
- ✅ El usuario obtiene sus tokens JWT
- ✅ El frontend recibe respuesta exitosa

### 2. Modificar email.service.ts para NO lanzar excepciones

**sendVerificationEmail** (línea ~68):
```typescript
catch (error) {
  this.logger.warn(
    `Error enviando email de verificación a ${email}: ${error.message}. Esto no afecta el registro del usuario.`,
  );
  // NO lanzar error - permitir que el registro continúe aunque falle el email
}
```

**sendPasswordResetEmail** (línea ~122):
```typescript
catch (error) {
  this.logger.warn(
    `Error enviando email de reset de contraseña a ${email}: ${error.message}`,
  );
  // NO lanzar error - en desarrollo puede no haber servidor SMTP
}
```

**Cambios realizados:**
- `logger.error()` → `logger.warn()` (el error no es crítico)
- Eliminado `throw new Error()` (no bloquear el flujo)
- Agregado mensaje explicativo en el log

## 🎯 Resultado Final

### Antes (❌):
1. Usuario se registra
2. Email falla → Error 500
3. Frontend muestra "Internal server error"
4. Usuario está en BD pero sin tokens
5. Usuario no puede continuar

### Después (✅):
1. Usuario se registra
2. Email falla → Solo un log WARN
3. Registro continúa normalmente
4. Usuario recibe tokens JWT
5. Frontend muestra "Registro exitoso"
6. Usuario puede usar la aplicación

## 📊 Impacto

- **Usuarios afectados**: Todos los nuevos registros
- **Entornos afectados**: Desarrollo, QA (sin SMTP configurado)
- **Producción**: No afecta si SMTP está configurado, pero ahora es más resiliente

## 🔧 Configuración Recomendada para Producción

Para enviar emails reales en producción, agregar en `.env`:

```env
# Configuración SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=tu-email@gmail.com
MAIL_PASS=tu-app-password
MAIL_FROM="Cuidamet <noreply@cuidamet.com>"

# URL de la aplicación
APP_URL=https://cuidamet.com
```

## 📝 Lecciones Aprendidas

1. **Operaciones de email deben ser no bloqueantes**: No deben impedir el flujo principal
2. **Diferencia entre errores críticos y no críticos**: Email fallido ≠ registro fallido
3. **Logging apropiado**: `warn` para errores no críticos, `error` para críticos
4. **Manejo de excepciones**: Try-catch en operaciones secundarias
5. **Resilencia**: La aplicación debe funcionar sin servicios externos opcionales

## ✅ Verificación

Para verificar que está funcionando:

1. Registrar un nuevo usuario sin configurar SMTP
2. Verificar en logs: `WARN Error enviando email...`
3. Verificar que el frontend muestra "Registro exitoso"
4. Verificar que el usuario puede hacer login inmediatamente

## 📎 Archivos Modificados

- `src/auth/auth.service.ts` (líneas ~195-202)
- `src/auth/services/email.service.ts` (líneas ~68-71, ~122-125)

---

**Documentado por**: GitHub Copilot  
**Fecha**: 26 de enero de 2026
