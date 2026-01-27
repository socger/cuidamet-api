import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPhotoUrlClientProfileToMediumtext1674835300000 implements MigrationInterface {
    name = 'AlterPhotoUrlClientProfileToMediumtext1674835300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE client_profiles MODIFY photo_url MEDIUMTEXT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE client_profiles MODIFY photo_url TEXT`);
    }
}
