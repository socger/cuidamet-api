-- ========================================
-- ⛔ OBSOLETO - NO EJECUTAR
-- ========================================
-- Este script SQL fue reemplazado por una migración de TypeORM
-- Archivo: src/database/migrations/1769200000000-AddProfileFieldsToUsers.ts
--
-- ⚠️ ESTE ARCHIVO NO DEBE USARSE
-- Los scripts en docker/mysql/init/ solo se ejecutan al crear el contenedor
-- y NO son migraciones apropiadas.
--
-- ✅ USAR EN SU LUGAR:
-- npm run migration:run
--
-- Ver documentación completa en: MIGRACIONES-INFO.md
-- ========================================

-- ========================================
-- Migración: Mover campos de perfiles a users
-- Fecha: 2026-02-07
-- Descripción: Mueve los campos phone, photo_url, location, latitude, longitude, 
--              languages e is_premium desde provider_profiles y client_profiles a users
-- ========================================

-- PASO 1: Agregar nuevos campos a la tabla users
ALTER TABLE users
ADD COLUMN phone VARCHAR(15) NULL COMMENT 'Número de teléfono del usuario',
ADD COLUMN photo_url MEDIUMTEXT NULL COMMENT 'URL de la foto de perfil (soporta base64)',
ADD COLUMN location VARCHAR(255) NULL COMMENT 'Ubicación del usuario',
ADD COLUMN latitude DECIMAL(10, 7) NULL COMMENT 'Latitud de la ubicación',
ADD COLUMN longitude DECIMAL(10, 7) NULL COMMENT 'Longitud de la ubicación',
ADD COLUMN languages TEXT NULL COMMENT 'Idiomas que habla (separados por coma)',
ADD COLUMN is_premium TINYINT(1) DEFAULT 0 COMMENT 'Suscripción premium';

-- PASO 2: Migrar datos desde provider_profiles a users
-- Actualiza users con datos de provider_profiles donde exista
UPDATE users u
INNER JOIN provider_profiles pp ON u.id = pp.user_id
SET 
    u.phone = COALESCE(u.phone, pp.phone),
    u.photo_url = COALESCE(u.photo_url, pp.photo_url),
    u.location = COALESCE(u.location, pp.location),
    u.latitude = COALESCE(u.latitude, pp.latitude),
    u.longitude = COALESCE(u.longitude, pp.longitude),
    u.languages = COALESCE(u.languages, pp.languages),
    u.is_premium = COALESCE(u.is_premium, pp.is_premium);

-- PASO 3: Migrar datos desde client_profiles a users
-- Solo actualiza si el usuario no tiene ya datos (por si tiene ambos perfiles)
UPDATE users u
INNER JOIN client_profiles cp ON u.id = cp.user_id
SET 
    u.phone = COALESCE(u.phone, cp.phone),
    u.photo_url = COALESCE(u.photo_url, cp.photo_url),
    u.location = COALESCE(u.location, cp.location),
    u.latitude = COALESCE(u.latitude, cp.latitude),
    u.longitude = COALESCE(u.longitude, cp.longitude),
    u.languages = COALESCE(u.languages, cp.languages),
    u.is_premium = COALESCE(u.is_premium, cp.is_premium);

-- PASO 4: Eliminar campos de provider_profiles
ALTER TABLE provider_profiles
DROP COLUMN phone,
DROP COLUMN photo_url,
DROP COLUMN location,
DROP COLUMN latitude,
DROP COLUMN longitude,
DROP COLUMN languages,
DROP COLUMN is_premium;

-- PASO 5: Eliminar campos de client_profiles
ALTER TABLE client_profiles
DROP COLUMN phone,
DROP COLUMN photo_url,
DROP COLUMN location,
DROP COLUMN latitude,
DROP COLUMN longitude,
DROP COLUMN languages,
DROP COLUMN is_premium;

-- PASO 6: Agregar índices para mejorar el rendimiento de búsquedas
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_users_is_premium ON users(is_premium);
CREATE INDEX idx_users_latitude_longitude ON users(latitude, longitude);

-- Verificar cambios
SELECT 'Migración completada exitosamente' AS status;
SELECT COUNT(*) AS total_users_with_location FROM users WHERE location IS NOT NULL;
SELECT COUNT(*) AS total_users_with_premium FROM users WHERE is_premium = 1;
