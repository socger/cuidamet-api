import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileFieldsToUsers1769200000000 implements MigrationInterface {
  name = 'AddProfileFieldsToUsers1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // PASO 1: Agregar nuevos campos a la tabla users
    // ========================================
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD COLUMN \`phone\` varchar(15) NULL COMMENT 'Número de teléfono del usuario',
      ADD COLUMN \`photo_url\` mediumtext NULL COMMENT 'URL de la foto de perfil (soporta base64)',
      ADD COLUMN \`location\` varchar(255) NULL COMMENT 'Ubicación del usuario',
      ADD COLUMN \`latitude\` decimal(10, 7) NULL COMMENT 'Latitud de la ubicación',
      ADD COLUMN \`longitude\` decimal(10, 7) NULL COMMENT 'Longitud de la ubicación',
      ADD COLUMN \`languages\` text NULL COMMENT 'Idiomas que habla (separados por coma)',
      ADD COLUMN \`is_premium\` tinyint(1) DEFAULT 0 COMMENT 'Suscripción premium'
    `);

    // ========================================
    // PASO 2: Migrar datos desde provider_profiles a users
    // Solo si existen datos en provider_profiles
    // ========================================
    const hasProviderProfiles = await queryRunner.query(`
      SELECT COUNT(*) as count FROM \`provider_profiles\`
    `);

    if (hasProviderProfiles[0].count > 0) {
      await queryRunner.query(`
        UPDATE \`users\` u
        INNER JOIN \`provider_profiles\` pp ON u.id = pp.user_id
        SET 
          u.phone = COALESCE(u.phone, pp.phone),
          u.photo_url = COALESCE(u.photo_url, pp.photo_url),
          u.location = COALESCE(u.location, pp.location),
          u.latitude = COALESCE(u.latitude, pp.latitude),
          u.longitude = COALESCE(u.longitude, pp.longitude),
          u.languages = COALESCE(u.languages, pp.languages),
          u.is_premium = COALESCE(u.is_premium, pp.is_premium)
      `);
    }

    // ========================================
    // PASO 3: Migrar datos desde client_profiles a users
    // Solo actualiza si el usuario no tiene ya datos
    // ========================================
    const hasClientProfiles = await queryRunner.query(`
      SELECT COUNT(*) as count FROM \`client_profiles\`
    `);

    if (hasClientProfiles[0].count > 0) {
      await queryRunner.query(`
        UPDATE \`users\` u
        INNER JOIN \`client_profiles\` cp ON u.id = cp.user_id
        SET 
          u.phone = COALESCE(u.phone, cp.phone),
          u.photo_url = COALESCE(u.photo_url, cp.photo_url),
          u.location = COALESCE(u.location, cp.location),
          u.latitude = COALESCE(u.latitude, cp.latitude),
          u.longitude = COALESCE(u.longitude, cp.longitude),
          u.languages = COALESCE(u.languages, cp.languages),
          u.is_premium = COALESCE(u.is_premium, cp.is_premium)
      `);
    }

    // ========================================
    // PASO 4: Eliminar campos de provider_profiles
    // ========================================
    await queryRunner.query(`
      ALTER TABLE \`provider_profiles\`
      DROP COLUMN \`phone\`,
      DROP COLUMN \`photo_url\`,
      DROP COLUMN \`location\`,
      DROP COLUMN \`latitude\`,
      DROP COLUMN \`longitude\`,
      DROP COLUMN \`languages\`,
      DROP COLUMN \`is_premium\`
    `);

    // ========================================
    // PASO 5: Eliminar campos de client_profiles
    // ========================================
    await queryRunner.query(`
      ALTER TABLE \`client_profiles\`
      DROP COLUMN \`phone\`,
      DROP COLUMN \`photo_url\`,
      DROP COLUMN \`location\`,
      DROP COLUMN \`latitude\`,
      DROP COLUMN \`longitude\`,
      DROP COLUMN \`languages\`,
      DROP COLUMN \`is_premium\`
    `);

    // ========================================
    // PASO 6: Agregar índices para mejorar rendimiento
    // ========================================
    await queryRunner.query(`
      CREATE INDEX \`idx_users_location\` ON \`users\`(\`location\`)
    `);
    
    await queryRunner.query(`
      CREATE INDEX \`idx_users_is_premium\` ON \`users\`(\`is_premium\`)
    `);
    
    await queryRunner.query(`
      CREATE INDEX \`idx_users_latitude_longitude\` ON \`users\`(\`latitude\`, \`longitude\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // IMPORTANTE: Este down() NO restaura los datos
    // Solo revierte la estructura. Los datos se perderían.
    // ========================================

    // Eliminar índices
    await queryRunner.query(`DROP INDEX \`idx_users_latitude_longitude\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`idx_users_is_premium\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`idx_users_location\` ON \`users\``);

    // Agregar campos de vuelta a provider_profiles
    await queryRunner.query(`
      ALTER TABLE \`provider_profiles\`
      ADD COLUMN \`phone\` varchar(15) NULL,
      ADD COLUMN \`photo_url\` varchar(500) NULL,
      ADD COLUMN \`location\` varchar(255) NOT NULL,
      ADD COLUMN \`latitude\` decimal(10, 7) NULL,
      ADD COLUMN \`longitude\` decimal(10, 7) NULL,
      ADD COLUMN \`languages\` text NULL,
      ADD COLUMN \`is_premium\` tinyint NOT NULL DEFAULT 0
    `);

    // Agregar campos de vuelta a client_profiles
    await queryRunner.query(`
      ALTER TABLE \`client_profiles\`
      ADD COLUMN \`phone\` varchar(15) NULL,
      ADD COLUMN \`photo_url\` varchar(500) NULL,
      ADD COLUMN \`location\` varchar(255) NOT NULL,
      ADD COLUMN \`latitude\` decimal(10, 7) NULL,
      ADD COLUMN \`longitude\` decimal(10, 7) NULL,
      ADD COLUMN \`languages\` text NULL,
      ADD COLUMN \`is_premium\` tinyint NOT NULL DEFAULT 0
    `);

    // Eliminar campos de users
    await queryRunner.query(`
      ALTER TABLE \`users\`
      DROP COLUMN \`is_premium\`,
      DROP COLUMN \`languages\`,
      DROP COLUMN \`longitude\`,
      DROP COLUMN \`latitude\`,
      DROP COLUMN \`location\`,
      DROP COLUMN \`photo_url\`,
      DROP COLUMN \`phone\`
    `);
  }
}
