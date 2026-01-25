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

export class ServiceConfigFiltersDto {
  @ApiPropertyOptional({
    description: 'Búsqueda general en descripción, tareas, formación',
    example: 'Alzheimer',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID del proveedor',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  providerId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría de servicio',
    enum: ['Elderly Care', 'Child Care', 'Pet Care', 'Home Cleaning'],
    example: 'Elderly Care',
  })
  @IsOptional()
  @IsEnum(['Elderly Care', 'Child Care', 'Pet Care', 'Home Cleaning'])
  careCategory?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de configuración',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  completed?: boolean;

  @ApiPropertyOptional({
    description: 'Tarifa por hora máxima',
    example: 20.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxHourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Habilidad médica específica',
    example: 'Alzheimer',
  })
  @IsOptional()
  @IsString()
  medicalSkill?: string;

  @ApiPropertyOptional({
    description: 'Tipo de mascota aceptada',
    example: 'Perros',
  })
  @IsOptional()
  @IsString()
  acceptedPet?: string;

  @ApiPropertyOptional({
    description: 'Filtrar servicios ecológicos',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  ecoFriendly?: boolean;

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
    example: 'hourlyRate',
    enum: ['careCategory', 'hourlyRate', 'rating', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['careCategory', 'hourlyRate', 'rating', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Orden de clasificación',
    example: 'ASC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
