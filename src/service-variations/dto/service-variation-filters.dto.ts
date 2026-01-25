import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceVariationFiltersDto {
  @ApiPropertyOptional({
    description: 'Búsqueda en nombre y descripción',
    example: 'nocturna',
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
    description: 'Filtrar por estado (habilitada o no)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar variaciones personalizadas',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isCustom?: boolean;

  @ApiPropertyOptional({
    description: 'Precio máximo',
    example: 50.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

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
    example: 'displayOrder',
    enum: ['name', 'price', 'displayOrder', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['name', 'price', 'displayOrder', 'createdAt'])
  sortBy?: string = 'displayOrder';

  @ApiPropertyOptional({
    description: 'Orden de clasificación',
    example: 'ASC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
