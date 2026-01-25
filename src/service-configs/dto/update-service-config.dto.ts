import { PartialType } from '@nestjs/swagger';
import { CreateServiceConfigDto } from './create-service-config.dto';

export class UpdateServiceConfigDto extends PartialType(
  CreateServiceConfigDto,
) {}
