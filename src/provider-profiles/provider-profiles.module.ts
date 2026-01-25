import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderProfilesService } from './provider-profiles.service';
import { ProviderProfilesController } from './provider-profiles.controller';
import { ProviderProfile } from '../entities/provider-profile.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderProfile, User])],
  controllers: [ProviderProfilesController],
  providers: [ProviderProfilesService],
  exports: [ProviderProfilesService],
})
export class ProviderProfilesModule {}
