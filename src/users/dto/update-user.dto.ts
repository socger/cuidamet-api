import {
  IsOptional,
  IsBoolean,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsArray,
  IsInt,
  IsNumber,
  IsLatitude,
  IsLongitude,
  ArrayMaxSize,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nombre de usuario único',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico único',
    example: 'johndoe@example.com',
    maxLength: 100,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'John',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Doe',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo del usuario',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'IDs de los roles a asignar al usuario',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  roleIds?: number[];

  @ApiPropertyOptional({
    description: 'Número de teléfono del usuario',
    example: '+34612345678',
    maxLength: 15,
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto de perfil o imagen en base64',
    example: 'https://example.com/photos/user123.jpg',
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Ubicación del usuario (dirección o ciudad)',
    example: 'Madrid, España',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'Latitud de la ubicación (-90 a 90)',
    example: 40.4168,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud de la ubicación (-180 a 180)',
    example: -3.7038,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Idiomas que habla el usuario (máximo 10)',
    example: ['Español', 'Inglés', 'Francés'],
    type: [String],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Indica si el usuario tiene suscripción premium',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    description: 'Nueva contraseña del usuario',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;
}
