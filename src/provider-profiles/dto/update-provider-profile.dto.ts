import { PartialType } from '@nestjs/swagger';
import { CreateProviderProfileDto } from './create-provider-profile.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProviderProfileDto extends PartialType(
  CreateProviderProfileDto,
) {
  @ApiProperty({
    description: 'ID del usuario (no puede ser modificado)',
    example: 2,
  })
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  userId?: number;
}
