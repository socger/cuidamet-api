-- ============================================
-- Script de Verificación: Un Usuario = Un Rol
-- ============================================
-- Fecha: 2026-01-29
-- Propósito: Verificar que cada usuario tenga SOLO UN rol activo
--            en la tabla user_roles (no múltiples roles)
-- ============================================

-- 1. Verificar estructura de la tabla user_roles
-- Debería tener PRIMARY KEY compuesta (user_id, role_id)
DESCRIBE user_roles;

-- 2. VERIFICACIÓN CRÍTICA: Cada usuario debe tener SOLO 1 rol
-- Este query DEBE devolver solo usuarios con count = 1
SELECT 
    user_id, 
    COUNT(*) as total_roles
FROM user_roles 
GROUP BY user_id
ORDER BY total_roles DESC, user_id;

-- ⚠️ Si algún usuario tiene total_roles > 1, HAY UN PROBLEMA
-- ✅ Todos los usuarios deberían tener total_roles = 1

-- 3. Usuarios con MÚLTIPLES roles (NO debería haber ninguno)
SELECT 
    ur.user_id,
    u.email,
    GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ', ') as roles,
    COUNT(ur.role_id) as total_roles
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
GROUP BY ur.user_id, u.email
HAVING COUNT(ur.role_id) > 1;

-- Este query NO debería devolver ninguna fila

-- 4. Ver todos los roles asignados (UN rol por usuario)
SELECT 
    ur.user_id,
    u.email,
    u.username,
    r.name as rol_activo
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
ORDER BY ur.user_id;

-- 5. Verificar la integridad de la clave primaria
SHOW CREATE TABLE user_roles;

-- ============================================
-- Instrucciones de Uso
-- ============================================
-- 
-- Para ejecutar desde la terminal:
-- docker compose exec mysql mysql -u root -p[PASSWORD] cuidamet < verify-no-duplicates.sql
--
-- O copiar y pegar los queries individuales en phpMyAdmin
-- http://localhost:8080
--
-- ============================================
-- Qué esperar:
-- ============================================
--
-- Query 1 (DESCRIBE): Debería mostrar PRIMARY KEY en user_id y role_id
-- Query 2 (TOTAL ROLES): TODOS los usuarios deben tener total_roles = 1
-- Query 3 (MÚLTIPLES ROLES): NO debería devolver ninguna fila
-- Query 4 (ROLES ASIGNADOS): Cada usuario tiene UN solo rol
-- Query 5 (CREATE TABLE): Confirma la estructura con PRIMARY KEY
--
-- ⚠️ IMPORTANTE: Si algún usuario tiene más de 1 rol, el sistema NO está funcionando correctamente
--
-- ============================================
