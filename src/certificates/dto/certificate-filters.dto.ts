import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CertificateFiltersDto {
  @ApiPropertyOptional({
    description: 'Búsqueda en nombre, descripción y contacto',
    example: 'Primeros Auxilios',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de configuración de servicio',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  serviceConfigId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de certificado',
    enum: ['certification', 'reference', 'license', 'diploma'],
    example: 'certification',
  })
  @IsOptional()
  @IsEnum(['certification', 'reference', 'license', 'diploma'])
  certificateType?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de verificación',
    enum: ['pending', 'verified', 'rejected'],
    example: 'verified',
  })
  @IsOptional()
  @IsEnum(['pending', 'verified', 'rejected'])
  verificationStatus?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo de ordenamiento',
    example: 'name',
    enum: ['name', 'certificateType', 'verificationStatus', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['name', 'certificateType', 'verificationStatus', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Orden de clasificación',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
