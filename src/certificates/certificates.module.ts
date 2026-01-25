import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Certificate } from '../entities/certificate.entity';
import { ServiceConfig } from '../entities/service-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, ServiceConfig])],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
