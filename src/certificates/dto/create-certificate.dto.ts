import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateDto {
  @ApiProperty({
    description: 'ID de la configuración de servicio asociada',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID de la configuración es obligatorio' })
  @IsNumber({}, { message: 'El ID debe ser un número' })
  serviceConfigId: number;

  @ApiProperty({
    description: 'Nombre del certificado o referencia',
    example: 'Certificado de Primeros Auxilios',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Información de contacto para verificación',
    example: 'Cruz Roja - tel: +34912345678',
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'La información de contacto debe ser texto' })
  @MaxLength(200, { message: 'Máximo 200 caracteres' })
  contactInfo?: string;

  @ApiPropertyOptional({
    description: 'Descripción o detalles adicionales',
    example: 'Certificado válido hasta 2026 con especialización en RCP',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @ApiProperty({
    description: 'Tipo de certificado',
    enum: ['certification', 'reference', 'license', 'diploma'],
    example: 'certification',
  })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  @IsString({ message: 'El tipo debe ser texto' })
  @IsEnum(['certification', 'reference', 'license', 'diploma'], {
    message: 'Tipo inválido',
  })
  certificateType: string;

  @ApiPropertyOptional({
    description: 'Nombre del archivo adjunto',
    example: 'certificado-primeros-auxilios.pdf',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'El nombre del archivo debe ser texto' })
  @MaxLength(255, { message: 'Máximo 255 caracteres' })
  fileName?: string;

  @ApiPropertyOptional({
    description: 'URL del archivo adjunto',
    example: 'https://storage.example.com/certificates/cert123.pdf',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La URL debe ser texto' })
  @MaxLength(500, { message: 'Máximo 500 caracteres' })
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Estado de verificación',
    enum: ['pending', 'verified', 'rejected'],
    example: 'pending',
    default: 'pending',
  })
  @IsOptional()
  @IsString({ message: 'El estado debe ser texto' })
  @IsEnum(['pending', 'verified', 'rejected'], {
    message: 'Estado inválido',
  })
  verificationStatus?: string;
}
