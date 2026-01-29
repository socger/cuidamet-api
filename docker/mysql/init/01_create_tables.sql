-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL
);

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL
);

-- Crear tabla intermedia para usuarios y roles (muchos a muchos)
CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role_id)
);

-- Insertar roles por defecto
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrador del sistema con todos los permisos'),
('user', 'Usuario básico del sistema'),
('moderator', 'Moderador con permisos especiales'),
('provider', 'Cuidador profesional que ofrece servicios'),
('client', 'Cliente familiar que busca y contrata servicios')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insertar usuario administrador por defecto
-- Contraseña: admin123 (hasheada con bcrypt)
INSERT INTO users (username, email, password, first_name, last_name) VALUES 
('admin', 'admin@socgerfleet.com', '$2b$10$Pk9WQXt1r9enXJJccHAw6u2tuFg/HRsyMsI3pB9zCfHhdCvGySF1a', 'Admin', 'User')
ON DUPLICATE KEY UPDATE password = VALUES(password);

-- Asignar rol de admin al usuario admin
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.username = 'admin' AND r.name = 'admin'
ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP;
