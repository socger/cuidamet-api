import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  name = 'CreateInitialTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // Crear tabla roles
    // ========================================
    await queryRunner.query(`
      CREATE TABLE \`roles\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(50) NOT NULL,
        \`description\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`)
      ) ENGINE=InnoDB
    `);

    // ========================================
    // Crear tabla users
    // ========================================
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`username\` varchar(50) NOT NULL,
        \`email\` varchar(100) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`first_name\` varchar(50) NULL,
        \`last_name\` varchar(50) NULL,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`email_verified\` tinyint NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`),
        UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`)
      ) ENGINE=InnoDB
    `);

    // ========================================
    // Crear tabla intermedia user_roles
    // ========================================
    await queryRunner.query(`
      CREATE TABLE \`user_roles\` (
        \`user_id\` int NOT NULL,
        \`role_id\` int NOT NULL,
        INDEX \`IDX_87b8888186ca9769c960e92687\` (\`user_id\`),
        INDEX \`IDX_b23c65e50a758245a33ee35fda\` (\`role_id\`),
        PRIMARY KEY (\`user_id\`, \`role_id\`)
      ) ENGINE=InnoDB
    `);

    // ========================================
    // Crear tabla refresh_tokens
    // ========================================
    await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL,
        \`token\` varchar(500) NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`is_revoked\` tinyint NOT NULL DEFAULT 0,
        \`device_info\` varchar(255) NULL,
        \`ip_address\` varchar(45) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_user_id\` (\`user_id\`),
        INDEX \`idx_token\` (\`token\`),
        INDEX \`idx_expires_at\` (\`expires_at\`)
      ) ENGINE=InnoDB
    `);

    // ========================================
    // Crear tabla password_history
    // ========================================
    await queryRunner.query(`
      CREATE TABLE \`password_history\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_user_id\` (\`user_id\`),
        INDEX \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB
    `);

    // ========================================
    // Crear tabla verification_tokens
    // ========================================
    await queryRunner.query(`
      CREATE TABLE \`verification_tokens\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL,
        \`token\` varchar(255) NOT NULL,
        \`type\` enum('email_verification', 'password_reset') NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`is_used\` tinyint NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` (\`token\`),
        INDEX \`idx_user_id\` (\`user_id\`),
        INDEX \`idx_type\` (\`type\`),
        INDEX \`idx_token\` (\`token\`),
        INDEX \`idx_expires_at\` (\`expires_at\`)
      ) ENGINE=InnoDB
    `);

    // ========================================
    // Agregar foreign keys
    // ========================================
    await queryRunner.query(`
      ALTER TABLE \`user_roles\` 
      ADD CONSTRAINT \`FK_87b8888186ca9769c960e926870\` 
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`user_roles\` 
      ADD CONSTRAINT \`FK_b23c65e50a758245a33ee35fda1\` 
      FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) 
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`refresh_tokens\` 
      ADD CONSTRAINT \`FK_3ddc983c5f7bcf132fd8732c3f4\` 
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`password_history\` 
      ADD CONSTRAINT \`FK_4933dc7a01356ac0733a5ad52d9\` 
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) 
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`verification_tokens\` 
      ADD CONSTRAINT \`FK_31d2079dc4079b80517d31cf4f2\` 
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) 
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // ========================================
    // Insertar roles por defecto
    // ========================================
    await queryRunner.query(`
      INSERT INTO \`roles\` (\`name\`, \`description\`) VALUES 
      ('admin', 'Administrador del sistema con todos los permisos'),
      ('user', 'Usuario básico del sistema'),
      ('moderator', 'Moderador con permisos especiales'),
      ('provider', 'Cuidador profesional que ofrece servicios'),
      ('client', 'Cliente familiar que busca y contrata servicios')
    `);

    // ========================================
    // Insertar usuario administrador por defecto
    // Contraseña: admin123 (hasheada con bcrypt)
    // ========================================
    await queryRunner.query(`
      INSERT INTO \`users\` (\`username\`, \`email\`, \`password\`, \`first_name\`, \`last_name\`) 
      VALUES ('admin', 'admin@socgerfleet.com', '$2b$10$Pk9WQXt1r9enXJJccHAw6u2tuFg/HRsyMsI3pB9zCfHhdCvGySF1a', 'Admin', 'User')
    `);

    // ========================================
    // Asignar rol de admin al usuario admin
    // ========================================
    await queryRunner.query(`
      INSERT INTO \`user_roles\` (\`user_id\`, \`role_id\`) 
      SELECT u.id, r.id 
      FROM \`users\` u, \`roles\` r 
      WHERE u.username = 'admin' AND r.name = 'admin'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE \`verification_tokens\` DROP FOREIGN KEY \`FK_31d2079dc4079b80517d31cf4f2\``);
    await queryRunner.query(`ALTER TABLE \`password_history\` DROP FOREIGN KEY \`FK_4933dc7a01356ac0733a5ad52d9\``);
    await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP FOREIGN KEY \`FK_3ddc983c5f7bcf132fd8732c3f4\``);
    await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_b23c65e50a758245a33ee35fda1\``);
    await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_87b8888186ca9769c960e926870\``);

    // Eliminar índices
    await queryRunner.query(`DROP INDEX \`idx_expires_at\` ON \`verification_tokens\``);
    await queryRunner.query(`DROP INDEX \`idx_token\` ON \`verification_tokens\``);
    await queryRunner.query(`DROP INDEX \`idx_type\` ON \`verification_tokens\``);
    await queryRunner.query(`DROP INDEX \`idx_user_id\` ON \`verification_tokens\``);
    await queryRunner.query(`DROP INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` ON \`verification_tokens\``);
    
    await queryRunner.query(`DROP INDEX \`idx_created_at\` ON \`password_history\``);
    await queryRunner.query(`DROP INDEX \`idx_user_id\` ON \`password_history\``);
    
    await queryRunner.query(`DROP INDEX \`idx_expires_at\` ON \`refresh_tokens\``);
    await queryRunner.query(`DROP INDEX \`idx_token\` ON \`refresh_tokens\``);
    await queryRunner.query(`DROP INDEX \`idx_user_id\` ON \`refresh_tokens\``);
    
    await queryRunner.query(`DROP INDEX \`IDX_b23c65e50a758245a33ee35fda\` ON \`user_roles\``);
    await queryRunner.query(`DROP INDEX \`IDX_87b8888186ca9769c960e92687\` ON \`user_roles\``);
    
    await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``);
    
    await queryRunner.query(`DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``);

    // Eliminar tablas
    await queryRunner.query(`DROP TABLE \`verification_tokens\``);
    await queryRunner.query(`DROP TABLE \`password_history\``);
    await queryRunner.query(`DROP TABLE \`refresh_tokens\``);
    await queryRunner.query(`DROP TABLE \`user_roles\``);
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`roles\``);
  }
}
