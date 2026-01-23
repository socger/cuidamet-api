# Implementación de CORS (Cross-Origin Resource Sharing)

**Fecha:** 19 de enero de 2026  
**Estado:** ✅ Implementado

## 📋 Resumen

Se ha implementado una configuración de CORS (Cross-Origin Resource Sharing) robusta y segura para la API de SocgerFleet. CORS es un mecanismo de seguridad que controla qué dominios pueden acceder a los recursos de la API desde navegadores web.

## 🎯 Objetivo

Permitir que aplicaciones frontend desplegadas en diferentes dominios puedan consumir la API de forma segura, mientras se bloquean peticiones de orígenes no autorizados.

## 🔧 Cambios Implementados

### 1. Configuración en `main.ts`

Se agregó una configuración completa de CORS con las siguientes características:

- **Orígenes permitidos**: Configurables vía variable de entorno `CORS_ORIGIN`
- **Métodos HTTP permitidos**: GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS
- **Credenciales**: Habilitado para permitir cookies y tokens de autenticación
- **Cabeceras permitidas**: Content-Type, Authorization, X-Requested-With, Accept, Origin
- **Cabeceras expuestas**: Authorization (para que el cliente pueda leer tokens)
- **Preflight caching**: 1 hora (3600 segundos)

#### Características de seguridad:

```typescript
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Validación de origen con lista blanca
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // Rechaza silenciosamente orígenes no permitidos
      callback(null, false);
    }
  },
  credentials: true, // Importante para JWT en cookies
  maxAge: 3600, // Cacheo de preflight
  // ... más configuraciones
};
```

### 2. Variables de Entorno

**Archivo `.env`:**
```bash
# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:4200,http://localhost:5173
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
```

**Valores por defecto:**
- Si no se define `CORS_ORIGIN`: `http://localhost:3000`
- Si no se define `CORS_METHODS`: `GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS`

### 3. Script de Prueba

Se creó `test-cors.sh` para validar la configuración:

```bash
./test-cors.sh
```

Este script prueba:
- ✅ Peticiones preflight (OPTIONS)
- ✅ Orígenes permitidos
- ✅ Orígenes bloqueados
- ✅ Peticiones sin origen (Postman, curl)

## 📝 Uso

### Desarrollo Local

Para desarrollo, puedes permitir múltiples puertos locales:

```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:4200,http://localhost:5173
```

### Producción

En producción, especifica solo los dominios necesarios:

```bash
CORS_ORIGIN=https://app.tudominio.com,https://admin.tudominio.com
```

### Permitir Todos los Orígenes (⚠️ NO RECOMENDADO EN PRODUCCIÓN)

```bash
CORS_ORIGIN=*
```

## 🧪 Cómo Probar

### 1. Probar con el script incluido:

```bash
./test-cors.sh
```

### 2. Probar desde el navegador:

Abre la consola del navegador y ejecuta:

```javascript
// Desde un origen permitido (ejemplo: http://localhost:4200)
fetch('http://localhost:3000/v1/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Importante para cookies/tokens
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### 3. Probar con curl:

```bash
# Simular petición desde origen permitido
curl -X GET http://localhost:3000/v1/users \
  -H "Origin: http://localhost:4200" \
  -v

# Simular petición preflight
curl -X OPTIONS http://localhost:3000/v1/auth/login \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

## 🔒 Consideraciones de Seguridad

### ✅ Implementado

1. **Lista blanca de orígenes**: Solo los dominios especificados pueden acceder
2. **Validación estricta**: Orígenes no listados son rechazados
3. **Credenciales habilitadas**: Permite autenticación con cookies/tokens
4. **Cabeceras controladas**: Solo se permiten cabeceras necesarias
5. **Métodos HTTP específicos**: Solo métodos definidos son permitidos

### 🎯 Mejores Prácticas

1. **En Producción**:
   - ❌ NUNCA uses `CORS_ORIGIN=*`
   - ✅ Lista solo dominios específicos
   - ✅ Usa HTTPS siempre
   - ✅ Incluye subdominios si son necesarios

2. **En Desarrollo**:
   - ✅ Incluye todos los puertos de desarrollo local
   - ✅ Usa `http://localhost` con puertos específicos

3. **Subdominios**:
   ```bash
   # Si tienes múltiples subdominios
   CORS_ORIGIN=https://app.tudominio.com,https://admin.tudominio.com,https://api.tudominio.com
   ```

## 📊 Cabeceras CORS Enviadas

La API ahora envía las siguientes cabeceras CORS:

```
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept,Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Authorization
Access-Control-Max-Age: 3600
```

## 🔍 Comportamiento

### Peticiones Simples

Las peticiones GET, HEAD y POST (con content-type simple) se envían directamente:

1. Cliente envía petición con cabecera `Origin`
2. Servidor valida el origen
3. Si está permitido, devuelve `Access-Control-Allow-Origin`

### Peticiones Preflight

Las peticiones complejas (PUT, DELETE, custom headers) requieren preflight:

1. Cliente envía petición OPTIONS (preflight)
2. Servidor responde con cabeceras CORS permitidas
3. Si es válido, cliente envía la petición real

## 🛠️ Troubleshooting

### Error: "blocked by CORS policy"

**Problema**: El origen no está en la lista blanca

**Solución**: Agregar el dominio a `CORS_ORIGIN` en `.env`

```bash
CORS_ORIGIN=http://localhost:3000,http://nuevo-dominio.com
```

### Error: "credentials mode is 'include'"

**Problema**: El frontend envía credenciales pero no está configurado

**Solución**: Ya está configurado con `credentials: true`

### Sin cabeceras CORS en la respuesta

**Problema**: La petición no incluye cabecera `Origin`

**Solución**: Las herramientas como Postman no envían Origin por defecto (esto es normal)

## 📚 Referencias

- [MDN Web Docs - CORS](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [NestJS CORS Documentation](https://docs.nestjs.com/security/cors)
- [W3C CORS Specification](https://www.w3.org/TR/cors/)

## ✅ Checklist de Verificación

- [x] Variables de entorno configuradas (.env y .env.example)
- [x] Configuración CORS en main.ts
- [x] Lista blanca de orígenes implementada
- [x] Credenciales habilitadas
- [x] Cabeceras permitidas definidas
- [x] Preflight configurado
- [x] Script de prueba creado
- [x] Documentación actualizada

## 🔄 Próximos Pasos

1. **Reiniciar la aplicación** para aplicar los cambios:
   ```bash
   npm run start:dev
   ```

2. **Ejecutar el script de prueba**:
   ```bash
   ./test-cors.sh
   ```

3. **Actualizar la configuración** según tus frontends:
   - Modifica `CORS_ORIGIN` en `.env` con tus dominios reales
   - En producción, usa solo dominios HTTPS específicos

## 🎉 Resultado

La API ahora tiene una configuración de CORS robusta que:
- ✅ Permite acceso controlado desde frontends específicos
- ✅ Bloquea orígenes no autorizados
- ✅ Soporta autenticación con credenciales
- ✅ Es configurable por entorno
- ✅ Sigue las mejores prácticas de seguridad
