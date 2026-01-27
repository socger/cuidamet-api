import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPhotoUrlProviderProfile20260127XXXXXX implements MigrationInterface {
    name = 'AlterPhotoUrlProviderProfile20260127XXXXXX'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`provider_profiles\` MODIFY \`photo_url\` TEXT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`provider_profiles\` MODIFY \`photo_url\` VARCHAR(500) NULL`);
    }
}
