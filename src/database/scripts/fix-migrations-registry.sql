-- Script para registrar migraciones ya ejecutadas
-- Ejecutar este script ANTES de npm run migration:run

USE cuidamet;

-- Insertar registros de migraciones que ya se ejecutaron (o parcialmente)
-- Esto evita que TypeORM intente ejecutarlas de nuevo

INSERT INTO migrations (timestamp, name) VALUES 
  (1737158400000, 'InitialSchema1737158400000'),
  (1768854380268, 'AddLoginAttempts1768854380268')
ON DUPLICATE KEY UPDATE timestamp = timestamp;

-- Verificar que se insertaron
SELECT * FROM migrations ORDER BY timestamp;
