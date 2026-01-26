import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  MaxLength,
  IsUrl,
  ArrayMaxSize,
  Min,
  Max,
} from 'class-validator';

export class CreateClientProfileDto {
  @ApiProperty({
    description: 'ID del usuario asociado al perfil',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+34612345678',
    maxLength: 15,
  })
  @IsString()
  @IsOptional()
  @MaxLength(15)
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto de perfil',
    example: 'https://example.com/photos/user123.jpg',
    maxLength: 500,
  })
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  photoUrl?: string;

  @ApiProperty({
    description: 'Ubicación del cliente',
    example: 'Madrid, España',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location: string;

  @ApiPropertyOptional({
    description: 'Latitud de la ubicación',
    example: 40.4168,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud de la ubicación',
    example: -3.7038,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Idiomas que habla el cliente',
    example: ['Español', 'Inglés'],
    type: [String],
    maxItems: 10,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Categorías de cuidado que le interesan',
    example: ['Elderly Care', 'Child Care'],
    type: [String],
    enum: ['Elderly Care', 'Child Care', 'Pet Care', 'Home Cleaning'],
    maxItems: 4,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(4)
  preferences?: string[];

  @ApiPropertyOptional({
    description: 'Estado del perfil',
    example: 'draft',
    enum: ['draft', 'published', 'suspended'],
    default: 'draft',
  })
  @IsString()
  @IsOptional()
  profileStatus?: string;

  @ApiPropertyOptional({
    description: 'Indica si el cliente tiene suscripción premium',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;
}
