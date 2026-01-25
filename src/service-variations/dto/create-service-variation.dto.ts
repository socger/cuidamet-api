import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceVariationDto {
  @ApiProperty({
    description: 'ID de la configuración de servicio asociada',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID de la configuración es obligatorio' })
  @IsNumber({}, { message: 'El ID debe ser un número' })
  serviceConfigId: number;

  @ApiProperty({
    description: 'Nombre de la variación',
    example: 'Tarifa nocturna',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Precio de la variación',
    example: 25.50,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @ApiProperty({
    description: 'Unidad de medida (por hora, por noche, por visita, etc.)',
    example: 'por noche',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'La unidad es obligatoria' })
  @IsString({ message: 'La unidad debe ser texto' })
  @MaxLength(50, { message: 'La unidad no puede exceder 50 caracteres' })
  unit: string;

  @ApiPropertyOptional({
    description: 'Indica si la variación está habilitada',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'enabled debe ser verdadero o falso' })
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Descripción adicional de la variación',
    example: 'Incluye servicio desde las 22:00 hasta las 6:00',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Indica si es una variación personalizada por el proveedor',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isCustom debe ser verdadero o falso' })
  isCustom?: boolean;

  @ApiPropertyOptional({
    description: 'Orden de visualización',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El orden debe ser un número' })
  @Min(0, { message: 'El orden no puede ser negativo' })
  displayOrder?: number;
}
