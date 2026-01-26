import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsLatitude,
  IsLongitude,
  ArrayMaxSize,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProviderProfileDto {
  @ApiProperty({
    description: 'ID del usuario asociado (debe existir en la tabla users)',
    example: 2,
  })
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  userId: number;

  @ApiPropertyOptional({
    description: 'Número de teléfono del proveedor',
    example: '+34612345678',
    maxLength: 15,
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(15, { message: 'El teléfono no puede exceder 15 caracteres' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto de perfil',
    example: 'https://example.com/photos/provider123.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La URL de la foto debe ser texto' })
  @MaxLength(500, { message: 'La URL no puede exceder 500 caracteres' })
  photoUrl?: string;

  @ApiProperty({
    description: 'Ubicación del proveedor (dirección o ciudad)',
    example: 'Madrid, España',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'La ubicación es obligatoria' })
  @IsString({ message: 'La ubicación debe ser texto' })
  @MaxLength(255, { message: 'La ubicación no puede exceder 255 caracteres' })
  location: string;

  @ApiPropertyOptional({
    description: 'Latitud de la ubicación (-90 a 90)',
    example: 40.4168,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @IsLatitude({ message: 'La latitud debe estar entre -90 y 90' })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud de la ubicación (-180 a 180)',
    example: -3.7038,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @IsLongitude({ message: 'La longitud debe estar entre -180 y 180' })
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Idiomas que habla el proveedor (máximo 10)',
    example: ['Español', 'Inglés', 'Francés'],
    type: [String],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: 'Los idiomas deben ser un array' })
  @IsString({ each: true, message: 'Cada idioma debe ser texto' })
  @ArrayMaxSize(10, { message: 'No se pueden agregar más de 10 idiomas' })
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Disponibilidad general del proveedor',
    example: ['Mañanas', 'Tardes', 'Fines de semana'],
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray({ message: 'La disponibilidad debe ser un array' })
  @IsString({ each: true, message: 'Cada disponibilidad debe ser texto' })
  @ArrayMaxSize(20, {
    message: 'No se pueden agregar más de 20 disponibilidades',
  })
  availability?: string[];

  @ApiPropertyOptional({
    description: 'Estado del perfil (draft, published, suspended)',
    enum: ['draft', 'published', 'suspended'],
    example: 'published',
    default: 'draft',
  })
  @IsOptional()
  @IsString({ message: 'El estado del perfil debe ser texto' })
  @IsEnum(['draft', 'published', 'suspended'], {
    message: 'El estado debe ser: draft, published o suspended',
  })
  profileStatus?: string;

  @ApiPropertyOptional({
    description: 'Indica si el proveedor tiene suscripción premium',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPremium debe ser verdadero o falso' })
  isPremium?: boolean;

  @ApiPropertyOptional({
    description: 'Estado de disponibilidad del proveedor (available, busy, offline)',
    enum: ['available', 'busy', 'offline'],
    example: 'available',
    default: 'offline',
  })
  @IsOptional()
  @IsString({ message: 'El estado del proveedor debe ser texto' })
  @IsEnum(['available', 'busy', 'offline'], {
    message: 'El estado debe ser: available, busy u offline',
  })
  providerStatus?: string;

  @ApiPropertyOptional({
    description: 'Calificación promedio del proveedor (0-5)',
    example: 4.8,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La calificación debe ser un número' })
  @Min(0, { message: 'La calificación mínima es 0' })
  @Max(5, { message: 'La calificación máxima es 5' })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Número total de reseñas recibidas',
    example: 42,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El número de reseñas debe ser un número' })
  @Min(0, { message: 'El número de reseñas no puede ser negativo' })
  reviewsCount?: number;

  @ApiPropertyOptional({
    description: 'Número de servicios completados exitosamente',
    example: 127,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El número de servicios debe ser un número' })
  @Min(0, { message: 'El número de servicios no puede ser negativo' })
  completedBookings?: number;

  @ApiPropertyOptional({
    description: 'Verificaciones obtenidas (DNI, certificados, etc.)',
    example: ['DNI Verificado', 'Certificado de Primeros Auxilios'],
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray({ message: 'Las verificaciones deben ser un array' })
  @IsString({ each: true, message: 'Cada verificación debe ser texto' })
  @ArrayMaxSize(20, {
    message: 'No se pueden agregar más de 20 verificaciones',
  })
  verifications?: string[];

  @ApiPropertyOptional({
    description: 'Insignias y reconocimientos obtenidos',
    example: ['Premium', 'Mejor Valorado', 'Respuesta Rápida'],
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray({ message: 'Las insignias deben ser un array' })
  @IsString({ each: true, message: 'Cada insignia debe ser texto' })
  @ArrayMaxSize(20, { message: 'No se pueden agregar más de 20 insignias' })
  badges?: string[];
}
