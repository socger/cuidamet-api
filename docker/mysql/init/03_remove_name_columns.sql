-- =====================================================
-- MIGRACIÓN: Eliminar columna 'name' de perfiles
-- Fecha: 26 de enero de 2026
-- Descripción: Elimina el campo 'name' de client_profiles 
--              y provider_profiles ya que el nombre se 
--              obtiene de la entidad User asociada
-- =====================================================

-- Eliminar columna name de client_profiles
ALTER TABLE client_profiles 
DROP COLUMN name;

-- Eliminar columna name de provider_profiles
ALTER TABLE provider_profiles 
DROP COLUMN name;

-- Nota: Esta migración es segura porque:
-- 1. Se puede revertir recreando la columna si es necesario
-- 2. Los nombres de usuarios se obtienen de la tabla 'users'
-- 3. La relación OneToOne garantiza acceso al nombre del usuario
