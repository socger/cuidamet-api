import { PartialType } from '@nestjs/swagger';
import { CreateServiceVariationDto } from './create-service-variation.dto';

export class UpdateServiceVariationDto extends PartialType(
  CreateServiceVariationDto,
) {}
