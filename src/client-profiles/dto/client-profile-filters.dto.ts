import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ClientProfileFiltersDto {
  @ApiPropertyOptional({
    description: 'Búsqueda general (email, ubicación)',
    example: 'María',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ubicación',
    example: 'Madrid',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por idioma',
    example: 'Español',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por preferencia de categoría',
    example: 'Elderly Care',
    enum: ['Elderly Care', 'Child Care', 'Pet Care', 'Home Cleaning'],
  })
  @IsOptional()
  @IsString()
  preference?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado del perfil',
    example: 'published',
    enum: ['draft', 'published', 'suspended'],
  })
  @IsOptional()
  @IsString()
  profileStatus?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por suscripción premium',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isPremium?: boolean;

  @ApiPropertyOptional({
    description: 'Página actual',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Resultados por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    example: 'createdAt',
    enum: ['name', 'location', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Orden de clasificación',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
