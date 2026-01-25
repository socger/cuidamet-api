import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceConfigsService } from './service-configs.service';
import { ServiceConfigsController } from './service-configs.controller';
import { ServiceConfig } from '../entities/service-config.entity';
import { ProviderProfile } from '../entities/provider-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceConfig, ProviderProfile])],
  controllers: [ServiceConfigsController],
  providers: [ServiceConfigsService],
  exports: [ServiceConfigsService],
})
export class ServiceConfigsModule {}
