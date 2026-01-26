# Documentación de AI Conversations

Esta carpeta contiene toda la documentación técnica y conversaciones con asistentes de IA del proyecto.

## 📁 Estructura de Carpetas

### `IA chats/`
**✅ Documentación del proyecto ACTUAL (Cuidamet API)**

Esta es la carpeta donde debes **CREAR TODOS los nuevos archivos .md** relacionados con:
- Nuevas features implementadas
- Decisiones técnicas del proyecto
- Conversaciones con IA sobre el desarrollo
- Guías específicas de Cuidamet

**Organización recomendada:**
```
IA chats/
├── 001 - Nombre de Feature/
│   ├── 001-0 - Conversación inicial.md
│   ├── 001-1 - Análisis técnico.md
│   ├── 001-2 - Guía de uso.md
│   └── 001-3 - Implementación detallada.md
├── 002 - Otra Feature/
│   ├── 002-1 - [...].md
│   └── 002-2 - [...].md
└── ...
```

### `AI conversations - socgerFleet/`
**❌ Documentación del proyecto TEMPLATE BASE (SocgerFleet)**

Esta carpeta contiene documentación del template base del cual deriva este proyecto.

**NO debes:**
- ❌ Crear nuevos archivos aquí
- ❌ Modificar archivos existentes
- ❌ Mover archivos de esta carpeta

**Puedes:**
- ✅ Leer y consultar documentación como referencia
- ✅ Seguir guías y mejores prácticas documentadas

**Archivos importantes de referencia:**
- `GUIA-Crear-Nuevas-Entidades.md` - Workflow para crear entidades
- `GUIA-Versionado-API.md` - Versionado semántico de API
- `PASO-A-PASO-*.md` - Guías paso a paso de procesos
- `035-BOOLEAN-FILTERS-FIX...md` - **CRÍTICO** para filtros con booleanos

## ⚠️ REGLAS IMPORTANTES

### ✅ HACER:
1. Crear nuevos archivos .md en `IA chats/`
2. Organizar por features con carpetas numeradas
3. Numerar archivos secuencialmente dentro de cada feature
4. Documentar todas las decisiones técnicas importantes
5. Incluir ejemplos de código y casos de uso

### ❌ NO HACER:
1. Crear archivos .md en la raíz (`resources/documents/AI conversations/`)
2. Modificar archivos en `AI conversations - socgerFleet/`
3. Eliminar o mover documentación del template
4. Mezclar documentación de diferentes features en una misma carpeta

## 📝 Ejemplo de Nomenclatura

```
001 - Creación de perfiles de usuario/
├── 001-0 - Conversación inicial y análisis.md
├── 001-1 - Diseño de entidades.md
├── 001-2 - Guía rápida para frontend.md
└── 001-3 - Implementación técnica completa.md

002 - Sistema de reservas/
├── 002-1 - Análisis de requisitos.md
├── 002-2 - Diseño de base de datos.md
└── 002-3 - API endpoints implementados.md
```

## 🔗 Referencias

- **README principal**: `/README.md` - Sección "📊 Documentación"
- **AGENTS.md**: `/AGENTS.md` - Sección "📚 Documentación en resources/documents"
- **CHANGELOG.md**: `/CHANGELOG.md` - Historial de cambios

## 💡 Consejos

1. **Mantén la numeración secuencial**: Si ya existe `001`, el siguiente es `002`
2. **Nombres descriptivos**: Usa nombres claros que indiquen el contenido
3. **Agrupa por feature**: Todo lo relacionado va en la misma carpeta
4. **Documenta decisiones**: Explica el "por qué" además del "cómo"
5. **Incluye ejemplos**: Código, comandos, casos de uso reales

---

**Última actualización**: 25 de enero de 2026
