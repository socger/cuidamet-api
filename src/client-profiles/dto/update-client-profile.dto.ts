import { PartialType } from '@nestjs/swagger';
import { CreateClientProfileDto } from './create-client-profile.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateClientProfileDto extends PartialType(CreateClientProfileDto) {
  @ApiPropertyOptional({
    description: 'ID del usuario (no actualizable después de creación)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  userId?: number;
}
