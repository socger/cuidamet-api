import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditFields1710000000000 implements MigrationInterface {
  name = 'AddAuditFields1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar campos de auditoría a la tabla users
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD COLUMN \`deleted_at\` datetime(6) NULL,
      ADD COLUMN \`created_by\` int NULL,
      ADD COLUMN \`updated_by\` int NULL,
      ADD COLUMN \`deleted_by\` int NULL
    `);

    // Agregar campos de auditoría a la tabla roles
    await queryRunner.query(`
      ALTER TABLE \`roles\` 
      ADD COLUMN \`deleted_at\` datetime(6) NULL,
      ADD COLUMN \`created_by\` int NULL,
      ADD COLUMN \`updated_by\` int NULL,
      ADD COLUMN \`deleted_by\` int NULL
    `);

    // Agregar campos de auditoría a la tabla refresh_tokens
    await queryRunner.query(`
      ALTER TABLE \`refresh_tokens\` 
      ADD COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      ADD COLUMN \`deleted_at\` datetime(6) NULL,
      ADD COLUMN \`created_by\` int NULL,
      ADD COLUMN \`updated_by\` int NULL,
      ADD COLUMN \`deleted_by\` int NULL
    `);

    // Agregar campos de auditoría a la tabla password_history
    await queryRunner.query(`
      ALTER TABLE \`password_history\` 
      ADD COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      ADD COLUMN \`deleted_at\` datetime(6) NULL,
      ADD COLUMN \`created_by\` int NULL,
      ADD COLUMN \`updated_by\` int NULL,
      ADD COLUMN \`deleted_by\` int NULL
    `);

    // Agregar campos de auditoría a la tabla verification_tokens
    await queryRunner.query(`
      ALTER TABLE \`verification_tokens\` 
      ADD COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      ADD COLUMN \`deleted_at\` datetime(6) NULL,
      ADD COLUMN \`created_by\` int NULL,
      ADD COLUMN \`updated_by\` int NULL,
      ADD COLUMN \`deleted_by\` int NULL
    `);

    // Crear índices para deleted_at (optimiza las consultas de soft delete)
    await queryRunner.query(
      `CREATE INDEX \`IDX_users_deleted_at\` ON \`users\` (\`deleted_at\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_roles_deleted_at\` ON \`roles\` (\`deleted_at\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX \`IDX_roles_deleted_at\` ON \`roles\``);
    await queryRunner.query(`DROP INDEX \`IDX_users_deleted_at\` ON \`users\``);

    // Remover campos de auditoría de verification_tokens
    await queryRunner.query(`
      ALTER TABLE \`verification_tokens\` 
      DROP COLUMN \`deleted_by\`,
      DROP COLUMN \`updated_by\`,
      DROP COLUMN \`created_by\`,
      DROP COLUMN \`deleted_at\`,
      DROP COLUMN \`updated_at\`
    `);

    // Remover campos de auditoría de password_history
    await queryRunner.query(`
      ALTER TABLE \`password_history\` 
      DROP COLUMN \`deleted_by\`,
      DROP COLUMN \`updated_by\`,
      DROP COLUMN \`created_by\`,
      DROP COLUMN \`deleted_at\`,
      DROP COLUMN \`updated_at\`
    `);

    // Remover campos de auditoría de refresh_tokens
    await queryRunner.query(`
      ALTER TABLE \`refresh_tokens\` 
      DROP COLUMN \`deleted_by\`,
      DROP COLUMN \`updated_by\`,
      DROP COLUMN \`created_by\`,
      DROP COLUMN \`deleted_at\`,
      DROP COLUMN \`updated_at\`
    `);

    // Remover campos de auditoría de roles
    await queryRunner.query(`
      ALTER TABLE \`roles\` 
      DROP COLUMN \`deleted_by\`,
      DROP COLUMN \`updated_by\`,
      DROP COLUMN \`created_by\`,
      DROP COLUMN \`deleted_at\`
    `);

    // Remover campos de auditoría de users
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      DROP COLUMN \`deleted_by\`,
      DROP COLUMN \`updated_by\`,
      DROP COLUMN \`created_by\`,
      DROP COLUMN \`deleted_at\`
    `);
  }
}
