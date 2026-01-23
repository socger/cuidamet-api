import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoginAttempts1768854380268 implements MigrationInterface {
  name = 'AddLoginAttempts1768854380268';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` DROP FOREIGN KEY \`verification_tokens_ibfk_1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`password_history\` DROP FOREIGN KEY \`password_history_ibfk_1\``,
    );
    await queryRunner.query(`DROP INDEX \`IDX_roles_deleted_at\` ON \`roles\``);
    await queryRunner.query(`DROP INDEX \`IDX_users_deleted_at\` ON \`users\``);
    await queryRunner.query(
      `DROP INDEX \`idx_expires_at\` ON \`verification_tokens\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_token\` ON \`verification_tokens\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_type\` ON \`verification_tokens\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_user_id\` ON \`verification_tokens\``,
    );
    await queryRunner.query(`DROP INDEX \`token\` ON \`verification_tokens\``);
    await queryRunner.query(
      `DROP INDEX \`idx_created_at\` ON \`password_history\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_user_id\` ON \`password_history\``,
    );
    await queryRunner.query(
      `CREATE TABLE \`login_attempts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(100) NOT NULL, \`ip_address\` varchar(45) NOT NULL, \`user_agent\` text NULL, \`is_successful\` tinyint NOT NULL DEFAULT 0, \`failure_reason\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`blocked_until\` datetime NULL, INDEX \`idx_identifier_created\` (\`identifier\`, \`created_at\`), INDEX \`idx_ip_created\` (\`ip_address\`, \`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` CHANGE \`token\` \`token\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` ADD UNIQUE INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` (\`token\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` CHANGE \`is_used\` \`is_used\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` ADD CONSTRAINT \`FK_31d2079dc4079b80517d31cf4f2\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`password_history\` ADD CONSTRAINT \`FK_4933dc7a01356ac0733a5ad52d9\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`password_history\` DROP FOREIGN KEY \`FK_4933dc7a01356ac0733a5ad52d9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` DROP FOREIGN KEY \`FK_31d2079dc4079b80517d31cf4f2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` CHANGE \`is_used\` \`is_used\` tinyint(1) NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` DROP INDEX \`IDX_b00b1be0e5a820594d7c07a3df\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` CHANGE \`token\` \`token\` varchar(255) COLLATE "utf8mb4_unicode_ci" NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_ip_created\` ON \`login_attempts\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_identifier_created\` ON \`login_attempts\``,
    );
    await queryRunner.query(`DROP TABLE \`login_attempts\``);
    await queryRunner.query(
      `CREATE INDEX \`idx_user_id\` ON \`password_history\` (\`user_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_created_at\` ON \`password_history\` (\`created_at\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`token\` ON \`verification_tokens\` (\`token\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_user_id\` ON \`verification_tokens\` (\`user_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_type\` ON \`verification_tokens\` (\`type\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_token\` ON \`verification_tokens\` (\`token\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_expires_at\` ON \`verification_tokens\` (\`expires_at\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_users_deleted_at\` ON \`users\` (\`deleted_at\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_roles_deleted_at\` ON \`roles\` (\`deleted_at\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`password_history\` ADD CONSTRAINT \`password_history_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`verification_tokens\` ADD CONSTRAINT \`verification_tokens_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
