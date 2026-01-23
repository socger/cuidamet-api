# Implementación de Helmet - Cabeceras de Seguridad HTTP

**Fecha:** 19 de enero de 2026
**Estado:** ✅ Implementado

## 📋 Descripción

Se ha implementado **Helmet** en el proyecto para mejorar la seguridad mediante la configuración de cabeceras HTTP. Helmet es un middleware para aplicaciones Express/NestJS que ayuda a proteger contra vulnerabilidades web comunes.

## 🎯 Objetivo

Añadir una capa adicional de seguridad a la API mediante la configuración automática de cabeceras HTTP de seguridad, protegiendo contra:
- Cross-Site Scripting (XSS)
- Clickjacking
- MIME type sniffing
- Otros ataques comunes basados en cabeceras HTTP

## 🔧 Implementación

### 1. Instalación de Dependencias

```bash
npm install helmet
npm install --save-dev @types/helmet
```

### 2. Configuración en main.ts

Se agregó Helmet en el archivo `src/main.ts` con una configuración personalizada compatible con Swagger:

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de seguridad con Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
          imgSrc: [`'self'`, 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ... resto de la configuración
}
```

## 🛡️ Cabeceras de Seguridad Configuradas

Helmet configura automáticamente las siguientes cabeceras HTTP:

### 1. **Content-Security-Policy (CSP)**
- **Qué hace:** Previene ataques XSS controlando qué recursos pueden cargarse
- **Configuración:** Personalizada para permitir Swagger funcionar correctamente
  - `defaultSrc: 'self'` - Solo permite recursos del mismo origen
  - `styleSrc: 'self', 'unsafe-inline'` - Permite estilos inline para Swagger
  - `scriptSrc: 'self', 'unsafe-inline', 'unsafe-eval'` - Permite scripts necesarios para Swagger
  - `imgSrc: 'self', data:, https:` - Permite imágenes del mismo origen, data URIs y HTTPS

### 2. **X-DNS-Prefetch-Control**
- **Qué hace:** Controla el DNS prefetching del navegador
- **Valor por defecto:** `off`

### 3. **X-Frame-Options**
- **Qué hace:** Previene clickjacking impidiendo que la página se muestre en un iframe
- **Valor por defecto:** `SAMEORIGIN`

### 4. **Strict-Transport-Security (HSTS)**
- **Qué hace:** Fuerza conexiones HTTPS
- **Valor por defecto:** `max-age=15552000; includeSubDomains`
- **Nota:** Solo funciona si se sirve la aplicación por HTTPS

### 5. **X-Download-Options**
- **Qué hace:** Previene que IE ejecute descargas en el contexto del sitio
- **Valor por defecto:** `noopen`

### 6. **X-Content-Type-Options**
- **Qué hace:** Previene MIME type sniffing
- **Valor por defecto:** `nosniff`

### 7. **X-Permitted-Cross-Domain-Policies**
- **Qué hace:** Controla políticas de dominios cruzados para clientes como Adobe Flash
- **Valor por defecto:** `none`

### 8. **Referrer-Policy**
- **Qué hace:** Controla cuánta información del referrer se envía
- **Valor por defecto:** `no-referrer`

### 9. **X-XSS-Protection**
- **Qué hace:** Habilita protección XSS del navegador (legacy, CSP es mejor)
- **Valor por defecto:** `0` (deshabilitado en favor de CSP)

## ⚙️ Configuraciones Especiales

### Compatibilidad con Swagger

Se realizaron las siguientes configuraciones para que Swagger funcione correctamente:

1. **Content-Security-Policy personalizada:**
   - Se permite `unsafe-inline` para estilos y scripts que Swagger necesita
   - Se permite `unsafe-eval` para el funcionamiento de la interfaz Swagger UI

2. **Cross-Origin Embedder Policy:**
   - Se desactivó (`crossOriginEmbedderPolicy: false`) para evitar problemas con recursos externos de Swagger

## 📊 Verificación

### Cómo verificar que Helmet está funcionando:

1. **Iniciar la aplicación:**
```bash
npm run start:dev
```

2. **Verificar cabeceras HTTP:**
   - Abrir las DevTools del navegador (F12)
   - Ir a la pestaña "Network"
   - Hacer una petición a cualquier endpoint
   - Inspeccionar las "Response Headers"

3. **Cabeceras que deberías ver:**
```
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
...
```

### Verificar que Swagger sigue funcionando:

1. Acceder a: `http://localhost:3000/api/docs`
2. Verificar que la interfaz carga correctamente
3. Probar algunos endpoints desde Swagger UI

## 🎨 Personalización Adicional

Si necesitas ajustar la configuración de Helmet, puedes modificar las opciones en `main.ts`:

```typescript
// Ejemplo: Configuración más estricta
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`],  // Sin unsafe-inline
        scriptSrc: [`'self'`], // Sin unsafe-inline/eval
        imgSrc: [`'self'`],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

**Nota:** Una configuración más estricta puede romper Swagger. Evalúa según tu entorno (desarrollo vs producción).

## 🌍 Configuración por Entorno

Puedes condicionar la configuración según el entorno:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

app.use(
  helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: [`'self'`],
        // Configuración más estricta en producción
      },
    } : false, // Desactivar CSP en desarrollo si causa problemas
  }),
);
```

## 📚 Recursos Adicionales

- [Documentación oficial de Helmet](https://helmetjs.github.io/)
- [Content Security Policy (CSP) Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP - Secure Headers](https://owasp.org/www-project-secure-headers/)

## ✅ Checklist de Implementación

- [x] Instalar paquete `helmet`
- [x] Instalar `@types/helmet` como dependencia de desarrollo
- [x] Importar helmet en `main.ts`
- [x] Configurar helmet con opciones personalizadas
- [x] Ajustar CSP para compatibilidad con Swagger
- [x] Desactivar COEP para Swagger
- [x] Verificar que las cabeceras se aplican correctamente
- [x] Verificar que Swagger sigue funcionando
- [x] Documentar la implementación

## 🎯 Próximos Pasos Recomendados

1. **CORS:** Configurar políticas de CORS si la API será consumida desde diferentes orígenes
2. **Rate Limiting:** Implementar límite de peticiones para prevenir ataques de fuerza bruta
3. **HTTPS:** En producción, servir siempre la aplicación a través de HTTPS
4. **Monitoreo:** Configurar logging de cabeceras de seguridad rechazadas

## 📝 Notas Importantes

- Helmet NO es un sustituto de buenas prácticas de seguridad, es una capa adicional
- Las cabeceras de seguridad son solo efectivas si el navegador las respeta
- HSTS solo funciona con conexiones HTTPS
- En producción, considera una configuración más estricta de CSP
- Prueba siempre después de cambios en la configuración de Helmet

---

**Implementado por:** GitHub Copilot  
**Fecha de implementación:** 19 de enero de 2026  
**Versión del proyecto:** 1.1.0