# Scripts de Base de Datos

Esta carpeta contiene scripts SQL de mantenimiento y troubleshooting que NO son migraciones TypeORM.

## 📄 Scripts Disponibles

### `fix-migrations-registry.sql`
**Propósito:** Registrar migraciones que ya fueron aplicadas parcialmente en la base de datos.

**Cuándo usar:**
- Cuando la tabla `migrations` está vacía pero las tablas ya existen
- Después de crear la BD manualmente o con scripts iniciales
- Para sincronizar el estado de migraciones con la realidad de la BD

**Cómo usar:**
```bash
# Opción 1: Desde fuera del contenedor
docker exec -i cuidamet-mysql mysql -u socger -p[PASSWORD] cuidamet < src/database/scripts/fix-migrations-registry.sql

# Opción 2: Desde dentro del contenedor
docker exec -it cuidamet-mysql mysql -u socger -p
# Luego copiar y pegar el contenido del script
```

**⚠️ IMPORTANTE:** Solo ejecutar este script si sabes que las tablas/columnas ya existen y solo falta el registro en la tabla `migrations`.

---

## 🔧 Crear Nuevos Scripts

Si necesitas crear scripts de mantenimiento adicionales:

1. Crear archivo `.sql` en esta carpeta
2. Documentarlo en este README
3. Incluir comentarios en el script explicando qué hace
4. Probar primero en desarrollo

**Ejemplos de scripts útiles:**
- Limpieza de datos antiguos
- Reindexación de tablas
- Backups selectivos
- Correcciones de datos inconsistentes
- Scripts de troubleshooting
