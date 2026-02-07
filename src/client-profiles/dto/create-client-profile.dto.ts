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

  // NOTA: Los campos phone, photoUrl, location, latitude, longitude, languages e isPremium
  // han sido movidos a la entidad User y deben gestionarse allí

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

  // NOTA: El campo isPremium se gestiona ahora en la entidad User
}
