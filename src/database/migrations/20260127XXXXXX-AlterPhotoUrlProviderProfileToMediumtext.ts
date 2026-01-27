import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPhotoUrlProviderProfileToMediumtext1674835200000 implements MigrationInterface {
    name = 'AlterPhotoUrlProviderProfileToMediumtext1674835200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE provider_profiles MODIFY photo_url MEDIUMTEXT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE provider_profiles MODIFY photo_url TEXT`);
    }
}
