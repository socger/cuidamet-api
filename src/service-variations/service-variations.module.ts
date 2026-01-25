import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceVariationsService } from './service-variations.service';
import { ServiceVariationsController } from './service-variations.controller';
import { ServiceVariation } from '../entities/service-variation.entity';
import { ServiceConfig } from '../entities/service-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceVariation, ServiceConfig])],
  controllers: [ServiceVariationsController],
  providers: [ServiceVariationsService],
  exports: [ServiceVariationsService],
})
export class ServiceVariationsModule {}
