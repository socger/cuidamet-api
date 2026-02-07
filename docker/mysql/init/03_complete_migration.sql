-- ========================================
-- Migración: Completar movimiento de campos de perfiles a users
-- Solo migración de datos y limpieza de columnas
-- ========================================

-- PASO 1: Migrar datos desde provider_profiles a users
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

-- PASO 2: Migrar datos desde client_profiles a users
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

-- PASO 3: Eliminar campos de provider_profiles
ALTER TABLE provider_profiles
DROP COLUMN phone,
DROP COLUMN photo_url,
DROP COLUMN location,
DROP COLUMN latitude,
DROP COLUMN longitude,
DROP COLUMN languages,
DROP COLUMN is_premium;

-- PASO 4: Eliminar campos de client_profiles
ALTER TABLE client_profiles
DROP COLUMN phone,
DROP COLUMN photo_url,
DROP COLUMN location,
DROP COLUMN latitude,
DROP COLUMN longitude,
DROP COLUMN languages,
DROP COLUMN is_premium;

-- PASO 5: Agregar índices para mejorar el rendimiento de búsquedas
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_users_is_premium ON users(is_premium);
CREATE INDEX idx_users_latitude_longitude ON users(latitude, longitude);

-- Verificar cambios
SELECT 'Migración completada exitosamente' AS status;
SELECT COUNT(*) AS total_users_with_location FROM users WHERE location IS NOT NULL;
SELECT COUNT(*) AS total_users_with_premium FROM users WHERE is_premium = 1;
