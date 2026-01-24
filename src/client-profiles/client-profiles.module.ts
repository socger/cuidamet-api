import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientProfilesService } from './client-profiles.service';
import { ClientProfilesController } from './client-profiles.controller';
import { ClientProfile } from '../entities/client-profile.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientProfile, User])],
  controllers: [ClientProfilesController],
  providers: [ClientProfilesService],
  exports: [ClientProfilesService],
})
export class ClientProfilesModule {}
