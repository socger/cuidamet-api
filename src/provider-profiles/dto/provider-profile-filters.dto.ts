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

export class ProviderProfileFiltersDto {
  @ApiPropertyOptional({
    description: 'Búsqueda general en nombre, ubicación, idiomas, verificaciones y badges',
    example: 'Madrid',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por nombre del proveedor (búsqueda parcial)',
    example: 'Ana García',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ubicación (búsqueda parcial)',
    example: 'Madrid',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por idioma específico',
    example: 'Español',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por disponibilidad específica',
    example: 'Fines de semana',
  })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado del perfil',
    enum: ['draft', 'published', 'suspended'],
    example: 'published',
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'suspended'])
  profileStatus?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por suscripción premium',
    example: true,
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
    description: 'Filtrar por estado de disponibilidad del proveedor',
    enum: ['available', 'busy', 'offline'],
    example: 'available',
  })
  @IsOptional()
  @IsEnum(['available', 'busy', 'offline'])
  providerStatus?: string;

  @ApiPropertyOptional({
    description: 'Calificación mínima del proveedor (0-5)',
    example: 4.0,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Número mínimo de reseñas',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minReviews?: number;

  @ApiPropertyOptional({
    description: 'Número mínimo de servicios completados',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minCompletedBookings?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por verificación específica',
    example: 'DNI Verificado',
  })
  @IsOptional()
  @IsString()
  verification?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por insignia específica',
    example: 'Premium',
  })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({
    description: 'Número de página (para paginación)',
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
    description: 'Número de elementos por página',
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
    description: 'Campo por el que ordenar los resultados',
    example: 'rating',
    enum: ['name', 'location', 'rating', 'reviewsCount', 'completedBookings', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['name', 'location', 'rating', 'reviewsCount', 'completedBookings', 'createdAt'])
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
